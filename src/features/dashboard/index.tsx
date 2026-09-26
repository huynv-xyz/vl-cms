import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Crown,
  Clock3,
  DatabaseZap,
  Gauge,
  ListChecks,
  MapPinned,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getGrowthDashboard,
  type GrowthDashboard,
  type GrowthRankingItem,
} from "@/api/ai/chat";
import { Main } from "@/components/layout/main";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const safeNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const money = (value: unknown) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
    safeNumber(value),
  );

const compactMoney = (rawValue: unknown) => {
  const value = safeNumber(rawValue);
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  if (absolute >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  return money(value);
};

const compactQuantity = (rawValue: unknown) => {
  const value = safeNumber(rawValue);
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} triệu`;
  if (absolute >= 1_000)
    return `${(value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} nghìn`;
  return money(value);
};

const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));

const opportunityStyles = {
  REACTIVATE: { label: "Kích hoạt lại", color: "#f97316" },
  RECOVER_DECLINE: { label: "Phục hồi giảm mua", color: "#ef4444" },
  REORDER_DUE: { label: "Đến chu kỳ mua lại", color: "#14b8a6" },
  CROSS_SELL: { label: "Bán chéo", color: "#6366f1" },
} as const;

function buildOpportunityMix(data: GrowthDashboard) {
  return Object.entries(opportunityStyles)
    .map(([type, style]) => {
      const opportunities = data.opportunities.filter(
        (item) => item.type === type,
      );
      return {
        type,
        ...style,
        count: opportunities.length,
        value: opportunities.reduce(
          (total, item) => total + item.estimatedRevenue,
          0,
        ),
      };
    })
    .filter((item) => item.count > 0);
}

export function Dashboard() {
  const dashboard = useQuery({
    queryKey: ["home-executive-dashboard"],
    queryFn: getGrowthDashboard,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (dashboard.isLoading) {
    return (
      <Main className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </Main>
    );
  }

  if (!dashboard.data || dashboard.isError) {
    return (
      <Main>
        <Card className="mx-auto mt-12 max-w-xl">
          <CardHeader>
            <CardTitle>Chưa tải được bảng điều hành</CardTitle>
            <CardDescription>
              Dữ liệu có thể đang được đồng bộ hoặc tài khoản chưa có quyền xem
              báo cáo điều hành.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => dashboard.refetch()}
              disabled={dashboard.isFetching}
            >
              <RefreshCw
                className={dashboard.isFetching ? "animate-spin" : ""}
              />
              Thử tải lại
            </Button>
          </CardContent>
        </Card>
      </Main>
    );
  }

  const data = dashboard.data;
  const operations = data.operations;
  const growth = data.summary.growthPercent;
  const trend = data.salesTrend.map((point) => ({
    ...point,
    label: `${date(point.fromDate)}–${date(point.toDate)}`,
  }));
  const ideas = buildBusinessIdeas(data);
  const opportunityMix = buildOpportunityMix(data);
  const activeTasks = data.tasks.filter((task) => task.status !== "DONE");
  const assignedOpportunityKeys = new Set(
    activeTasks.map((task) => task.opportunity_key),
  );
  const executionFunnel = [
    { label: "Đã phát hiện", value: data.opportunities.length, color: "#14b8a6" },
    { label: "Đang thực hiện", value: data.summary.activeTasks, color: "#6366f1" },
    { label: "Đã hoàn thành", value: data.summary.completedTasks, color: "#22c55e" },
  ];
  const recoveryOpportunities = data.opportunities.filter(
    (item) => item.type === "REACTIVATE" || item.type === "RECOVER_DECLINE",
  );
  const recoveryValue = recoveryOpportunities.reduce(
    (total, item) => total + item.estimatedRevenue,
    0,
  );
  const topReceivableValue = data.topReceivables.reduce(
    (total, item) => total + Math.max(0, item.balance),
    0,
  );
  const topEmployee = data.topEmployees[0];
  const topEmployeeShare = topEmployee
    ? (topEmployee.netRevenue / Math.max(operations.netRevenue, 1)) * 100
    : 0;
  const profitSummary = data.profitability.summary;
  const profitTotalRows = safeNumber(profitSummary.totalRows);
  const profitCoveredRows = safeNumber(profitSummary.coveredRows);
  const coveredNetRevenue = safeNumber(profitSummary.coveredNetRevenue);
  const coveredProfit = safeNumber(
    profitSummary.estimatedProfitOnCoveredRows,
  );
  const costCoverage =
    profitTotalRows > 0
      ? (profitCoveredRows / profitTotalRows) * 100
      : 0;
  const grossMargin =
    coveredNetRevenue > 0
      ? (coveredProfit / coveredNetRevenue) * 100
      : 0;
  const hasProfitData = profitCoveredRows > 0 && coveredNetRevenue > 0;
  const targetPerformance = [...data.salesTargets]
    .filter((item) => item.target_amount > 0)
    .sort(
      (left, right) =>
        Number(left.completion_percent ?? 0) -
        Number(right.completion_percent ?? 0),
    )
    .slice(0, 6);
  const activeNewCustomers = data.newCustomers.filter(
    (item) => Number(item.net_revenue) > 0,
  );
  const alerts = [
    {
      label: "Đơn quá hạn",
      value: operations.overdueOrders,
      note: "Cần xử lý ngay",
      icon: Clock3,
      tone: "text-red-600 bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Đơn đang mở",
      value: operations.openOrders,
      note: `trên ${operations.totalOrders} đơn trong kỳ`,
      icon: ShoppingCart,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: hasProfitData ? "Độ phủ giá vốn" : "Dữ liệu giá vốn",
      value: hasProfitData
        ? `${costCoverage.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}%`
        : `${data.profitability.incompleteGroups} nhóm`,
      note: hasProfitData ? "Giao dịch đã đối chiếu" : "Cần bổ sung để tính lãi",
      icon: DatabaseZap,
      tone: hasProfitData
        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        : "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Lô hàng đang về",
      value: operations.shipmentsInTransit,
      note: "Đang vận chuyển",
      icon: Truck,
      tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    },
  ];

  return (
    <Main className="space-y-8 pb-28">
      <section className="relative overflow-hidden rounded-3xl border border-teal-800/15 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 px-6 py-7 text-white shadow-lg shadow-slate-950/10 md:px-8 md:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-100">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Tổng quan điều hành
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Tình hình kinh doanh
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <CalendarDays className="size-4 text-teal-300" />
              {date(data.currentFrom)} – {date(data.asOfDate)}
              <span className="hidden text-slate-500 sm:inline">•</span>
              <span className="hidden sm:inline">Dữ liệu mới nhất</span>
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="h-11 self-start border border-white/15 bg-white text-slate-950 shadow-lg shadow-black/15 hover:bg-teal-50 md:self-auto"
          >
            <Link to="/ai-assistant">
              <Sparkles className="text-teal-600" /> Trợ lý điều hành
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {data.dataLagDays > 1 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Dữ liệu bán hàng mới nhất đến ngày {date(data.asOfDate)}, chậm{" "}
          {data.dataLagDays} ngày so với hiện tại.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Doanh thu thuần trong kỳ"
          value={`${compactMoney(operations.netRevenue)} đồng`}
          detail={`${money(operations.netRevenue)} đồng`}
          icon={Banknote}
          accent="primary"
        />
        <MetricCard
          title="Tăng trưởng cùng kỳ so sánh"
          value={`${growth > 0 ? "+" : ""}${growth.toLocaleString("vi-VN")}%`}
          detail={`Kỳ trước: ${compactMoney(data.summary.previousComparableRevenue)} đồng`}
          icon={growth >= 0 ? TrendingUp : TrendingDown}
          accent={growth >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Dư công nợ"
          value={`${compactMoney(operations.receivableBalance)} đồng`}
          detail={`Cập nhật đến ${date(operations.receivableDataThrough)}`}
          icon={CircleDollarSign}
          accent="warning"
        />
        <MetricCard
          title="Cơ hội doanh thu"
          value={`${compactMoney(data.summary.estimatedOpportunityRevenue)} đồng`}
          detail={`${data.opportunities.length} cơ hội được phát hiện`}
          icon={Sparkles}
          accent="positive"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <DecisionCard
          index="01"
          eyebrow={growth < 0 ? "Cần phục hồi" : "Đà tăng trưởng"}
          title={
            growth < 0
              ? `${recoveryOpportunities.length} khách đang giảm nhịp mua`
              : "Duy trì nhóm khách đang tăng trưởng"
          }
          value={`${compactMoney(recoveryValue)} đồng`}
          note="Giá trị doanh thu có thể phục hồi từ dữ liệu 30 ngày gần nhất"
          tone={growth < 0 ? "negative" : "positive"}
        />
        <DecisionCard
          index="02"
          eyebrow="Dòng tiền"
          title="Kiểm soát khách có dư công nợ cao"
          value={`${compactMoney(topReceivableValue)} đồng`}
          note="Tổng dư nợ của 5 khách lớn nhất trước khi mở thêm hạn mức"
          tone="warning"
        />
        <DecisionCard
          index="03"
          eyebrow="Đội sale"
          title={topEmployee ? `${topEmployee.name} đang dẫn đầu` : "Hiệu quả đội sale"}
          value={`${topEmployeeShare.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% doanh thu`}
          note="Dùng cơ cấu khách và sản phẩm của sale dẫn đầu để nhân rộng cách bán"
          tone="primary"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Nhịp doanh thu theo tuần</CardTitle>
              <CardDescription>
                Nhìn đồng thời doanh thu bán, doanh thu thuần và hàng trả lại
              </CardDescription>
            </div>
            <Badge variant={growth >= 0 ? "secondary" : "destructive"}>
              {growth > 0 ? "+" : ""}{growth.toLocaleString("vi-VN")}%
            </Badge>
          </CardHeader>
          <CardContent className="h-[330px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="netRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.35}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={compactMoney}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${money(Number(value))} đồng`,
                    name === "netRevenue"
                      ? "Doanh thu thuần"
                      : name === "grossRevenue"
                        ? "Doanh thu bán"
                        : "Hàng trả lại",
                  ]}
                  labelStyle={{ color: "#0f172a" }}
                />
                <Legend
                  formatter={(value) =>
                    value === "netRevenue"
                      ? "Doanh thu thuần"
                      : value === "grossRevenue"
                        ? "Doanh thu bán"
                        : "Hàng trả lại"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  stroke="#94a3b8"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  stroke="#0f9f91"
                  fill="url(#netRevenueFill)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="returnRevenue"
                  stroke="#f97316"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Cơ cấu cơ hội tăng trưởng</CardTitle>
            <CardDescription>
              Giá trị doanh thu có thể hành động theo từng nhóm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opportunityMix}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {opportunityMix.map((item) => (
                      <Cell key={item.type} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${money(Number(value))} đồng`}
                    labelStyle={{ color: "#0f172a" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-xl">
                  {compactMoney(data.summary.estimatedOpportunityRevenue)}
                </strong>
                <span className="text-xs text-muted-foreground">doanh thu cơ hội</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {opportunityMix.map((item) => (
                <div key={item.type} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label} · {item.count}</span>
                  </span>
                  <strong className="shrink-0">{compactMoney(item.value)}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Cảnh báo vận hành hôm nay</CardTitle>
          <CardDescription>Các điểm cần xử lý để bảo vệ doanh thu và tiến độ giao hàng</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {alerts.map((alert) => (
            <div key={alert.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${alert.tone}`}>
                <alert.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-muted-foreground">{alert.label}</p>
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-xl">
                    {typeof alert.value === "number"
                      ? money(alert.value)
                      : alert.value}
                  </strong>
                  <span className="truncate text-xs text-muted-foreground">{alert.note}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold">Cơ hội bán hàng hôm nay</h2>
            <p className="text-sm text-muted-foreground">
              Khách nào cần gọi, sale nào phụ trách và giá trị có thể mang về
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ai-assistant">
              Mở danh sách giao việc <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)]">
          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="divide-y p-0">
              {data.opportunities.slice(0, 6).map((opportunity, index) => {
                const style = opportunityStyles[opportunity.type];
                const assigned = assignedOpportunityKeys.has(opportunity.key);
                return (
                  <div
                    key={opportunity.key}
                    className="grid gap-3 p-4 transition-colors hover:bg-muted/35 md:grid-cols-[36px_minmax(0,1fr)_145px_120px] md:items-center"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold" title={opportunity.entityName}>
                          {opportunity.entityName}
                        </p>
                        <Badge variant="outline" className="font-normal">
                          <span className="mr-1.5 size-1.5 rounded-full" style={{ backgroundColor: style.color }} />
                          {style.label}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {opportunity.saleName || "Chưa phân sale"} · {opportunity.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cơ hội</p>
                      <strong className="text-sm text-emerald-700 dark:text-emerald-400">
                        {compactMoney(opportunity.estimatedRevenue)} đồng
                      </strong>
                    </div>
                    <Badge variant={assigned ? "secondary" : opportunity.priority === "HIGH" ? "destructive" : "outline"}>
                      {assigned ? "Đã giao việc" : opportunity.priority === "HIGH" ? "Xử lý ngay" : "Theo dõi"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30">
                  <ListChecks className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Phễu thực thi</CardTitle>
                  <CardDescription>Từ cơ hội đến doanh thu ghi nhận</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[205px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionFunnel} margin={{ top: 18, right: 8, left: 8, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                    <Tooltip formatter={(value) => [`${money(Number(value))} việc`, "Số lượng"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={58}>
                      {executionFunnel.map((item) => <Cell key={item.label} fill={item.color} />)}
                      <LabelList dataKey="value" position="top" className="fill-foreground text-xs font-bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Doanh thu đã ghi nhận</p>
                  <strong className="mt-1 block text-lg text-emerald-700 dark:text-emerald-400">
                    {compactMoney(data.summary.realizedRevenue)} đồng
                  </strong>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cơ hội chưa giao</p>
                  <strong className="mt-1 block text-lg">
                    {Math.max(0, data.opportunities.length - assignedOpportunityKeys.size)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Xếp hạng kinh doanh</h2>
          <p className="text-sm text-muted-foreground">
            So sánh doanh thu, tỷ trọng và mức trả hàng theo từng chiều
          </p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Ranking
            title="Top nhân viên sale"
            icon={Users}
            items={data.topEmployees}
          />
          <MarketCoverage items={data.marketCoverage} />
          <Ranking
            title="Top khách hàng"
            icon={Users}
            items={data.topCustomers}
          />
          <Ranking
            title="Top nhóm sản phẩm"
            icon={PackageSearch}
            items={data.topProductGroups}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950/20 md:p-7">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Nhịp cuối tháng</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Dự báo doanh thu và sức kéo đội sale</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dự báo theo tốc độ bán hiện tại; chỉ tiêu sale hiển thị theo sản lượng quy đổi
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-background/80">
            Ngày {data.summary.elapsedDays}/{data.summary.daysInMonth}
          </Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.5fr)]">
          <Card className="relative overflow-hidden border-0 bg-slate-950 text-white shadow-xl shadow-slate-950/15">
            <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-teal-400/20 blur-3xl" />
            <CardContent className="relative flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-teal-300">
                  <Gauge className="size-6" />
                </span>
                <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                  Dự báo
                </Badge>
              </div>
              <p className="mt-7 text-sm text-slate-400">Doanh thu dự kiến cuối tháng</p>
              <strong className="mt-2 text-4xl font-bold tracking-tight">
                {compactMoney(data.summary.forecastRevenue)}
              </strong>
              <p className="mt-1 text-sm text-slate-400">đồng, nếu giữ nhịp bán hiện tại</p>

              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs text-slate-500">Tháng trước</p>
                  <strong className="mt-1 block text-lg">
                    {compactMoney(data.summary.previousFullMonthRevenue)}
                  </strong>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Chênh lệch dự báo</p>
                  <strong className={`mt-1 block text-lg ${data.summary.forecastGrowthPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {data.summary.forecastGrowthPercent > 0 ? "+" : ""}
                    {safeNumber(data.summary.forecastGrowthPercent).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-background/90 shadow-lg shadow-slate-900/5 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                  <Target className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Sale cần tăng tốc</CardTitle>
                  <CardDescription>Ưu tiên người có tỷ lệ hoàn thành thấp</CardDescription>
                </div>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">Sản lượng quy đổi</span>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-4 pt-5 md:grid-cols-2">
              {targetPerformance.map((item, index) => {
                const completion = safeNumber(item.completion_percent);
                return (
                  <div key={item.employee_code} className="rounded-xl border border-border/60 bg-card/70 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-semibold">{item.employee_name}</span>
                      </div>
                      <strong className={completion < 70 ? "text-amber-600" : "text-emerald-600"}>
                        {completion.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
                      </strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={completion < 70 ? "h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500" : "h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"}
                        style={{ width: `${Math.max(1, Math.min(100, completion))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {compactQuantity(item.actual_amount)} / {compactQuantity(item.target_amount)} sản lượng
                    </p>
                  </div>
                );
              })}
              {targetPerformance.length === 0 && <EmptyState text="Chưa có dữ liệu chỉ tiêu năm nay" />}
            </CardContent>
          </Card>
        </div>

        {hasProfitData && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Lợi nhuận gộp tạm tính</p>
              <strong className="mt-1 block text-lg text-emerald-700 dark:text-emerald-400">{compactMoney(coveredProfit)} đồng</strong>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tỷ suất trên phần đủ giá vốn</p>
              <strong className="mt-1 block text-lg">{grossMargin.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%</strong>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Độ phủ dữ liệu giá vốn</p>
              <strong className="mt-1 block text-lg">{costCoverage.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%</strong>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-border/60 bg-muted/25 p-5 md:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Danh sách ưu tiên</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Khách hàng cần hành động</h2>
          <p className="text-sm text-muted-foreground">
            Giữ khách VIP, tạo đơn thứ hai cho khách mới và kiểm soát công nợ lớn
          </p>
          </div>
          <Badge variant="outline" className="w-fit bg-background">
            {data.vipInactiveCustomers.length + activeNewCustomers.length + data.topReceivables.length} khách cần theo dõi
          </Badge>
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-3">
          <Card className="gap-4 overflow-hidden border-0 bg-background/90 shadow-lg shadow-slate-900/5">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                <Crown className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">VIP có nguy cơ mất</CardTitle>
                <CardDescription>Từ 30 ngày chưa mua trở lên</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.vipInactiveCustomers.slice(0, 5).map((item, index) => (
                <DataRow
                  key={item.customer_code}
                  index={index}
                  title={item.customer_name}
                  subtitle={`${item.vip_tier} · ${item.employee_name || "Chưa phân sale"}`}
                  value={item.inactive_days == null ? "Chưa từng mua" : `${item.inactive_days} ngày`}
                  negative
                />
              ))}
              {data.vipInactiveCustomers.length === 0 && <EmptyState text="Không có VIP cần cảnh báo" />}
            </CardContent>
          </Card>

          <Card className="gap-4 overflow-hidden border-0 bg-background/90 shadow-lg shadow-slate-900/5">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <UserPlus className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Khách hàng mới trong tháng
                </CardTitle>
                <CardDescription>Doanh thu phát sinh lần đầu</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {activeNewCustomers.map((item, index) => (
                <DataRow
                  key={item.customer_code}
                  index={index}
                  title={item.customer_name}
                  subtitle={`${item.assigned_employee_name || "Chưa phân sale"} · ${date(item.first_purchase_date)}`}
                  value={compactMoney(item.net_revenue)}
                />
              ))}
              {activeNewCustomers.length === 0 && (
                <EmptyState text="Chưa có khách mới phát sinh doanh thu" />
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 overflow-hidden border-0 bg-background/90 shadow-lg shadow-slate-900/5">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30">
                <CircleDollarSign className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Công nợ cần kiểm soát</CardTitle>
                <CardDescription>5 khách có dư nợ lớn nhất</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.topReceivables.map((item, index) => (
                <DataRow
                  key={item.customerCode}
                  index={index}
                  title={item.customerName}
                  subtitle={item.customerCode}
                  value={compactMoney(item.balance)}
                  negative
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl shadow-slate-950/10 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Kế hoạch hành động</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Bốn việc tạo tăng trưởng tiếp theo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Mỗi chương trình đều có đối tượng, giá trị kỳ vọng và thời hạn rõ ràng
            </p>
          </div>
          <Badge className="w-fit border-white/10 bg-white/10 text-white hover:bg-white/10">Ưu tiên trong 14 ngày</Badge>
        </div>
        <div className="relative mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {ideas.slice(0, 4).map((idea, index) => (
            <div
              key={idea.key}
              className="group flex min-h-[300px] flex-col bg-slate-950/80 p-5 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">{idea.category}</span>
                <span className="text-3xl font-black text-white/10 transition-colors group-hover:text-teal-300/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold leading-snug">{idea.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{idea.evidence}</p>
              <div className="mt-auto pt-6">
                <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                  <div>
                    <span className="block text-[11px] text-slate-500">{idea.impactLabel}</span>
                    <strong className="mt-1 block text-base text-teal-300">{idea.impactValue}</strong>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">{idea.timeframe}</span>
                </div>
                <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-400">{idea.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Main>
  );
}

function DecisionCard({
  index,
  eyebrow,
  title,
  value,
  note,
  tone,
}: {
  index: string;
  eyebrow: string;
  title: string;
  value: string;
  note: string;
  tone: "primary" | "positive" | "warning" | "negative";
}) {
  const styles = {
    primary: "border-cyan-200 bg-cyan-50/70 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-300",
    positive: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300",
    negative: "border-red-200 bg-red-50/70 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300",
  }[tone];

  return (
    <Card className={`relative overflow-hidden border shadow-none ${styles}`}>
      <span className="absolute right-4 top-3 text-4xl font-black opacity-[0.08]">{index}</span>
      <CardContent className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{eyebrow}</p>
        <h3 className="mt-2 text-base font-semibold text-foreground">{title}</h3>
        <strong className="mt-3 block text-xl">{value}</strong>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Banknote;
  accent?: "primary" | "positive" | "warning" | "negative";
}) {
  const styles = {
    primary: {
      line: "bg-primary",
      icon: "bg-primary/10 text-primary",
      value: "text-foreground",
    },
    positive: {
      line: "bg-emerald-500",
      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30",
      value: "text-emerald-600",
    },
    warning: {
      line: "bg-amber-500",
      icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/30",
      value: "text-foreground",
    },
    negative: {
      line: "bg-red-500",
      icon: "bg-red-50 text-red-600 dark:bg-red-950/30",
      value: "text-red-600",
    },
  }[accent || "primary"];

  return (
    <Card className="group relative gap-0 overflow-hidden border-border/70 py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className={`absolute inset-x-0 top-0 h-1 ${styles.line}`} />
      <CardContent className="flex items-center gap-4 p-5 pt-6">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <CardDescription>{title}</CardDescription>
          <p
            className={`mt-1 truncate text-2xl font-bold tracking-tight ${styles.value}`}
          >
            {value}
          </p>
          <p
            className="mt-0.5 truncate text-xs text-muted-foreground"
            title={detail}
          >
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Ranking({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Users;
  items: GrowthRankingItem[];
}) {
  const totalRevenue = items.reduce((sum, item) => sum + item.netRevenue, 0);
  const chartData = items.map((item, index) => ({
    ...item,
    rank: index + 1,
    displayName: item.name || item.code,
  }));

  return (
    <Card className="gap-3 overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">
              So sánh theo doanh thu thuần
            </CardDescription>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Tổng top
          </p>
          <strong className="text-sm">{compactMoney(totalRevenue)}</strong>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[270px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 2, right: 88, bottom: 2, left: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="displayName"
                width={128}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  String(value).length > 20
                    ? `${String(value).slice(0, 18)}…`
                    : String(value)
                }
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "netRevenue")
                    return [`${money(Number(value))} đồng`, "Doanh thu thuần"];
                  return [value, name];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as GrowthRankingItem | undefined;
                  return item?.name || item?.code || "";
                }}
                contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
              />
              <Bar dataKey="netRevenue" fill="#14b8a6" radius={[0, 6, 6, 0]} maxBarSize={28}>
                <LabelList
                  dataKey="netRevenue"
                  position="right"
                  formatter={(value) => compactMoney(Number(value ?? 0))}
                  className="fill-foreground text-[11px] font-semibold"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span>Doanh thu top: <strong className="text-foreground">{compactMoney(totalRevenue)}</strong></span>
          <span>Trả hàng cao nhất: <strong className="text-foreground">{Math.max(...items.map((item) => item.returnRatePercent), 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketCoverage({
  items,
}: {
  items: GrowthDashboard["marketCoverage"];
}) {
  const chartData = items.slice(0, 5).map((item) => ({
    ...item,
    inactive_customers: Math.max(
      0,
      Number(item.total_customers) - Number(item.active_customers),
    ),
    activeRate:
      Number(item.total_customers) > 0
        ? (Number(item.active_customers) / Number(item.total_customers)) * 100
        : 0,
  }));

  return (
    <Card className="gap-3 overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPinned className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Độ phủ khách theo khu vực</CardTitle>
            <CardDescription className="mt-1">Khách có mua trong 90 ngày gần nhất</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[270px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 36, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="region" width={92} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  money(Number(value)),
                  name === "active_customers" ? "Có mua trong 90 ngày" : "Chưa mua trong 90 ngày",
                ]}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                  return item ? `${item.region} · hoạt động ${item.activeRate.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%` : "";
                }}
              />
              <Legend formatter={(value) => value === "active_customers" ? "Đang hoạt động" : "Chưa hoạt động"} />
              <Bar dataKey="active_customers" stackId="customers" fill="#14b8a6" radius={[5, 0, 0, 5]} />
              <Bar dataKey="inactive_customers" stackId="customers" fill="#e2e8f0" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 border-t pt-3 text-xs text-muted-foreground">
          Vùng có tỷ lệ hoạt động thấp là nơi cần tái kích hoạt khách hoặc mở thêm đại lý.
        </p>
      </CardContent>
    </Card>
  );
}

function DataRow({
  index,
  title,
  subtitle,
  value,
  negative,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={title}>
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={subtitle}>
          {subtitle}
        </p>
      </div>
      <span
        className={`shrink-0 text-xs font-semibold ${negative ? "text-red-600" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  );
}

type BusinessIdea = {
  key: string;
  category: string;
  title: string;
  evidence: string;
  action: string;
  impactLabel: string;
  impactValue: string;
  timeframe: string;
  successMetric: string;
  targets: Array<{
    name: string;
    meta?: string;
    value?: string;
  }>;
  score: number;
  tone: string;
};

function buildBusinessIdeas(data: GrowthDashboard): BusinessIdea[] {
  const ideas: BusinessIdea[] = [];
  const sumOpportunities = (
    types: GrowthDashboard["opportunities"][number]["type"][],
  ) =>
    data.opportunities
      .filter((item) => types.includes(item.type))
      .reduce((total, item) => total + item.estimatedRevenue, 0);
  const countOpportunities = (
    types: GrowthDashboard["opportunities"][number]["type"][],
  ) => data.opportunities.filter((item) => types.includes(item.type)).length;

  const recoveryTypes: GrowthDashboard["opportunities"][number]["type"][] = [
    "REACTIVATE",
    "RECOVER_DECLINE",
  ];
  const recoveryCount = countOpportunities(recoveryTypes);
  const recoveryValue = sumOpportunities(recoveryTypes);
  const recoveryTargets = data.opportunities
    .filter((item) => recoveryTypes.includes(item.type))
    .sort((left, right) => right.estimatedRevenue - left.estimatedRevenue)
    .slice(0, 3);
  if (recoveryCount > 0) {
    ideas.push({
      key: "customer-recovery",
      category: "Đại lý",
      title: `Chiến dịch 14 ngày kéo lại ${recoveryCount} đại lý giảm mua`,
      evidence: `Nhóm này đang tạo ra khoảng trống doanh thu ước tính ${compactMoney(recoveryValue)} đồng so với nhịp mua trước.`,
      action:
        "Chia danh sách cho từng sale, gọi xác nhận tồn kho và nguyên nhân giảm mua; đề xuất đơn nhập lại theo nhu cầu thực tế, theo dõi tỷ lệ liên hệ và đơn chốt mỗi ngày.",
      impactLabel: "Doanh thu có thể phục hồi",
      impactValue: `${compactMoney(recoveryValue)} đồng`,
      timeframe: "14 ngày",
      successMetric: "đơn chốt / khách đã liên hệ",
      targets: recoveryTargets.map((item) => ({
        name: item.entityName,
        meta: `Phụ trách: ${item.saleName || "Chưa phân sale"}`,
        value: compactMoney(item.estimatedRevenue),
      })),
      score: recoveryValue,
      tone: "bg-emerald-500",
    });
  }

  const crossSell = data.opportunities.filter(
    (item) => item.type === "CROSS_SELL",
  );
  const crossSellValue = sumOpportunities(["CROSS_SELL"]);
  if (crossSell.length > 0) {
    const productGroups = crossSell.reduce<Record<string, number>>(
      (result, item) => {
        const group = String(item.evidence.productGroup || "Sản phẩm bổ trợ");
        result[group] = (result[group] || 0) + 1;
        return result;
      },
      {},
    );
    const leadingGroup = Object.entries(productGroups).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0];
    ideas.push({
      key: "cross-sell",
      category: "Bán chéo",
      title: `Đẩy gói sản phẩm ${leadingGroup || "bổ trợ"} cho ${crossSell.length} đại lý phù hợp`,
      evidence: `Các đại lý này đang mua tốt trong khu vực nhưng chưa mua nhóm sản phẩm đề xuất trong 180 ngày gần nhất.`,
      action:
        "Tạo gói thử nhỏ gồm sản phẩm chủ lực và sản phẩm bổ trợ, kèm hướng dẫn sử dụng theo cây trồng; sale thu phản hồi sau 7 ngày trước khi đề xuất đơn lớn.",
      impactLabel: "Doanh thu bán chéo ước tính",
      impactValue: `${compactMoney(crossSellValue)} đồng`,
      timeframe: "21 ngày",
      successMetric: "khách mua thử / khách được chào",
      targets: crossSell
        .sort((left, right) => right.estimatedRevenue - left.estimatedRevenue)
        .slice(0, 3)
        .map((item) => ({
          name: item.entityName,
          meta: `Phụ trách: ${item.saleName || "Chưa phân sale"}`,
          value: compactMoney(item.estimatedRevenue),
        })),
      score: crossSellValue,
      tone: "bg-blue-500",
    });
  }

  const reorderCount = countOpportunities(["REORDER_DUE"]);
  const reorderValue = sumOpportunities(["REORDER_DUE"]);
  const reorderTargets = data.opportunities
    .filter((item) => item.type === "REORDER_DUE")
    .sort((left, right) => right.estimatedRevenue - left.estimatedRevenue)
    .slice(0, 3);
  if (reorderCount > 0) {
    ideas.push({
      key: "reorder-cycle",
      category: "Mua lại",
      title: `Chốt đơn theo chu kỳ với ${reorderCount} đại lý sắp đến hạn nhập`,
      evidence: `Lịch sử mua cho thấy nhóm này đã đến hoặc vượt chu kỳ nhập hàng thông thường.`,
      action:
        "Nhắc sale trước chu kỳ 5–7 ngày, gửi đề xuất số lượng theo tốc độ mua cũ và gom giao theo tuyến để tăng tỷ lệ chốt mà không cần giảm giá rộng.",
      impactLabel: "Doanh thu mua lại ước tính",
      impactValue: `${compactMoney(reorderValue)} đồng`,
      timeframe: "7 ngày",
      successMetric: "đơn tái mua đúng chu kỳ",
      targets: reorderTargets.map((item) => ({
        name: item.entityName,
        meta: `Phụ trách: ${item.saleName || "Chưa phân sale"}`,
        value: compactMoney(item.estimatedRevenue),
      })),
      score: reorderValue,
      tone: "bg-violet-500",
    });
  }

  const newCustomerRevenue = data.newCustomers.reduce(
    (total, item) => total + Number(item.net_revenue || 0),
    0,
  );
  if (data.newCustomers.length > 0) {
    ideas.push({
      key: "new-customer-second-order",
      category: "Khách mới",
      title: `Biến ${data.newCustomers.length} khách mới thành khách mua lặp lại`,
      evidence: `Nhóm khách mới đã tạo ${compactMoney(newCustomerRevenue)} đồng doanh thu trong kỳ nhưng chưa hình thành thói quen nhập hàng.`,
      action:
        "Áp dụng lịch chăm sóc 3–7–21 ngày: xác nhận sử dụng, xử lý vướng mắc và đề xuất đơn thứ hai dựa trên sản phẩm đã mua cùng mùa vụ địa phương.",
      impactLabel: "Doanh thu khách mới hiện tại",
      impactValue: `${compactMoney(newCustomerRevenue)} đồng`,
      timeframe: "21 ngày",
      successMetric: "khách phát sinh đơn thứ hai",
      targets: [...data.newCustomers]
        .filter((item) => item.net_revenue > 0)
        .sort((left, right) => right.net_revenue - left.net_revenue)
        .slice(0, 3)
        .map((item) => ({
          name: item.customer_name,
          meta: `Phụ trách: ${item.assigned_employee_name || "Chưa phân sale"}`,
          value: compactMoney(item.net_revenue),
        })),
      score: newCustomerRevenue * 0.5,
      tone: "bg-cyan-500",
    });
  }

  const expiring = data.inventoryRisks.filter(
    (item) => item.riskType === "EXPIRING_SOON",
  );
  if (expiring.length > 0) {
    ideas.push({
      key: "expiring-stock",
      category: "Tồn kho",
      title: `Tạo chương trình bán theo mùa vụ cho ${expiring.length} lô cận hạn`,
      evidence: `Các lô này còn dưới 60 ngày đến hạn và cần được ưu tiên theo đúng khu vực có nhu cầu thực tế.`,
      action:
        "Ghép lô cận hạn vào gói sản phẩm đang bán tốt, phân bổ chỉ tiêu theo vùng và kiểm soát giá sàn; ưu tiên hội thảo kỹ thuật hoặc đơn dùng ngay thay vì giảm giá đại trà.",
      impactLabel: "Số lô cần luân chuyển",
      impactValue: `${expiring.length} lô`,
      timeframe: "30 ngày",
      successMetric: "tỷ lệ tồn cận hạn đã bán",
      targets: expiring.slice(0, 3).map((item) => ({
        name: item.productName,
        meta: `Kho: ${item.warehouseName || "Chưa xác định"}`,
        value: `${money(item.quantity)} ${item.unit || ""}`.trim(),
      })),
      score: expiring.length * 10_000_000,
      tone: "bg-orange-500",
    });
  }

  const receivableValue = data.topReceivables.reduce(
    (total, item) => total + Math.max(0, Number(item.balance || 0)),
    0,
  );
  if (receivableValue > 0) {
    ideas.push({
      key: "credit-growth",
      category: "Dòng tiền",
      title: "Tăng doanh số theo hạn mức công nợ của từng đại lý",
      evidence: `5 khách có công nợ cao nhất đang chiếm ${compactMoney(receivableValue)} đồng, cần kiểm soát trước khi mở rộng đơn mới.`,
      action:
        "Chia khách theo lịch sử thanh toán, đặt hạn mức và điều kiện đơn mới; khách trả tốt được ưu tiên hàng và chương trình bán, khách rủi ro gắn đơn mới với cam kết thu nợ.",
      impactLabel: "Công nợ cần kiểm soát",
      impactValue: `${compactMoney(receivableValue)} đồng`,
      timeframe: "7 ngày",
      successMetric: "tiền thu về và công nợ cam kết",
      targets: data.topReceivables.slice(0, 3).map((item) => ({
        name: item.customerName,
        meta: `Mã KH: ${item.customerCode}`,
        value: compactMoney(item.balance),
      })),
      score: receivableValue * 0.08,
      tone: "bg-rose-500",
    });
  }

  const leadingEmployees = [...data.topEmployees]
    .sort((left, right) => right.netRevenue - left.netRevenue)
    .slice(0, 3);
  const leadingEmployeeRevenue = leadingEmployees.reduce(
    (total, item) => total + item.netRevenue,
    0,
  );
  if (leadingEmployees.length > 0) {
    ideas.push({
      key: "replicate-sales-playbook",
      category: "Đội sale",
      title: `Nhân rộng cách bán của ${leadingEmployees[0].name} cho toàn đội`,
      evidence: `${leadingEmployees.length} sale dẫn đầu đang tạo ${compactMoney(leadingEmployeeRevenue)} đồng doanh thu, là nguồn dữ liệu tốt nhất để chuẩn hóa cách bán hiệu quả.`,
      action:
        "Rà lại nhóm khách, nhóm sản phẩm và nhịp chăm sóc tạo doanh thu của sale dẫn đầu; chọn 2 cách làm có thể lặp lại, ghép cặp hướng dẫn cho sale còn lại và theo dõi doanh thu tăng thêm hàng tuần.",
      impactLabel: "Doanh thu top sale để học từ",
      impactValue: `${compactMoney(leadingEmployeeRevenue)} đồng`,
      timeframe: "30 ngày",
      successMetric: "doanh thu tăng thêm của nhóm áp dụng",
      targets: leadingEmployees.map((item) => ({
        name: item.name,
        meta: `Tỷ lệ trả hàng: ${item.returnRatePercent.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`,
        value: compactMoney(item.netRevenue),
      })),
      score: leadingEmployeeRevenue * 0.04,
      tone: "bg-indigo-500",
    });
  }

  const rankedRegions = [...data.topRegions].sort(
    (left, right) => right.netRevenue - left.netRevenue,
  );
  const regionRevenue = rankedRegions.reduce(
    (total, item) => total + item.netRevenue,
    0,
  );
  if (rankedRegions.length > 1) {
    const weakestRegion = rankedRegions[rankedRegions.length - 1];
    const leaderShare =
      (rankedRegions[0].netRevenue / Math.max(regionRevenue, 1)) * 100;
    ideas.push({
      key: "regional-expansion",
      category: "Thị trường",
      title: `Mở rộng doanh số tại vùng ${weakestRegion.name}`,
      evidence: `Vùng dẫn đầu đang chiếm ${leaderShare.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% doanh thu trong top vùng, trong khi ${weakestRegion.name} mới đạt ${compactMoney(weakestRegion.netRevenue)} đồng.`,
      action:
        "Lập danh sách đại lý mục tiêu tại vùng doanh thu thấp, chọn sản phẩm đã bán tốt ở vùng dẫn đầu nhưng phù hợp mùa vụ địa phương; giao chỉ tiêu mở mới và đơn thử theo từng sale thay vì áp một chương trình chung.",
      impactLabel: `Doanh thu hiện tại vùng ${weakestRegion.name}`,
      impactValue: `${compactMoney(weakestRegion.netRevenue)} đồng`,
      timeframe: "60 ngày",
      successMetric: "đại lý mới và doanh thu vùng",
      targets: rankedRegions.slice(0, 3).map((item) => ({
        name: item.name,
        meta: `Tỷ trọng: ${((item.netRevenue / Math.max(regionRevenue, 1)) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`,
        value: compactMoney(item.netRevenue),
      })),
      score: Math.max(weakestRegion.netRevenue, regionRevenue * 0.02),
      tone: "bg-sky-500",
    });
  }

  const returnRiskGroups = [...data.topProductGroups]
    .filter((item) => item.returnRatePercent > 0)
    .sort((left, right) => right.returnRatePercent - left.returnRatePercent)
    .slice(0, 3);
  if (data.operations.returnRevenue > 0 && returnRiskGroups.length > 0) {
    ideas.push({
      key: "reduce-returns",
      category: "Chất lượng bán",
      title: "Giảm trả hàng ở các nhóm sản phẩm rủi ro cao",
      evidence: `Hàng trả lại trong kỳ là ${compactMoney(data.operations.returnRevenue)} đồng; một số nhóm sản phẩm đang có tỷ lệ trả hàng cao hơn mặt bằng chung.`,
      action:
        "Đối chiếu lý do trả theo sản phẩm, sale và đại lý; khóa nguyên nhân do tư vấn sai hoặc giao sai, bổ sung bước xác nhận nhu cầu trước xuất kho và theo dõi tỷ lệ trả hàng hàng tuần.",
      impactLabel: "Doanh thu trả lại cần giảm",
      impactValue: `${compactMoney(data.operations.returnRevenue)} đồng`,
      timeframe: "30 ngày",
      successMetric: "tỷ lệ và giá trị hàng trả lại",
      targets: returnRiskGroups.map((item) => ({
        name: item.name,
        meta: `Doanh thu: ${compactMoney(item.netRevenue)}`,
        value: `${item.returnRatePercent.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}% trả`,
      })),
      score: data.operations.returnRevenue * 1.5,
      tone: "bg-red-500",
    });
  }

  const pendingDelivery = [...data.deliveryPerformance]
    .filter((item) => item.pending_orders > 0 || item.late_orders > 0)
    .sort(
      (left, right) =>
        right.late_orders +
        right.pending_orders -
        (left.late_orders + left.pending_orders),
    )
    .slice(0, 3);
  if (data.operations.openOrders > 0) {
    ideas.push({
      key: "accelerate-open-orders",
      category: "Chốt giao hàng",
      title: `Đẩy nhanh ${data.operations.openOrders} đơn đang mở để ghi nhận doanh thu`,
      evidence: `Có ${data.operations.openOrders} đơn chưa hoàn tất trên tổng ${data.operations.totalOrders} đơn trong kỳ; xử lý sớm giúp giảm dồn đơn và giữ trải nghiệm đại lý.`,
      action:
        "Chia đơn đang mở theo tuổi đơn, tồn kho và người phụ trách; chốt lịch giao cho đơn đủ hàng, báo lại ngay cho khách nếu thiếu hàng và họp nhanh 15 phút mỗi ngày đến khi hết nhóm tồn đọng.",
      impactLabel: "Đơn đang chờ hoàn tất",
      impactValue: `${money(data.operations.openOrders)} đơn`,
      timeframe: "7 ngày",
      successMetric: "đơn hoàn tất và thời gian xử lý",
      targets: pendingDelivery.length
        ? pendingDelivery.map((item) => ({
            name: item.employee_name,
            meta: `${item.late_orders} trễ · ${item.pending_orders} đang giao`,
            value: `${item.late_orders + item.pending_orders} đơn`,
          }))
        : [
            {
              name: "Toàn bộ đơn đang mở",
              meta: "Cần phân người phụ trách từ dữ liệu đơn hàng",
              value: `${data.operations.openOrders} đơn`,
            },
          ],
      score:
        data.operations.openOrders *
        (data.operations.netRevenue / Math.max(data.operations.totalOrders, 1)),
      tone: "bg-amber-500",
    });
  }

  const productLeaders = [...data.topProductGroups]
    .sort((left, right) => right.netRevenue - left.netRevenue)
    .slice(0, 3);
  const productLeaderRevenue = productLeaders.reduce(
    (total, item) => total + item.netRevenue,
    0,
  );
  if (productLeaders.length > 0) {
    const topTwoRevenue = productLeaders
      .slice(0, 2)
      .reduce((total, item) => total + item.netRevenue, 0);
    ideas.push({
      key: "product-portfolio",
      category: "Danh mục",
      title: "Dùng sản phẩm chủ lực để kéo doanh số nhóm bổ trợ",
      evidence: `Hai nhóm dẫn đầu tạo ${compactMoney(topTwoRevenue)} đồng, tương đương ${((topTwoRevenue / Math.max(data.operations.netRevenue, 1)) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% doanh thu kỳ này.`,
      action:
        "Thiết kế gói theo nhu cầu canh tác gồm một sản phẩm chủ lực và một sản phẩm bổ trợ; thử trên đại lý mua đều, đo tỷ lệ mua kèm và biên lợi nhuận trước khi nhân rộng.",
      impactLabel: "Doanh thu 3 nhóm dẫn đầu",
      impactValue: `${compactMoney(productLeaderRevenue)} đồng`,
      timeframe: "30 ngày",
      successMetric: "tỷ lệ mua kèm và doanh thu bổ trợ",
      targets: productLeaders.map((item) => ({
        name: item.name,
        meta: `Tỷ lệ trả hàng: ${item.returnRatePercent.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`,
        value: compactMoney(item.netRevenue),
      })),
      score: productLeaderRevenue * 0.03,
      tone: "bg-fuchsia-500",
    });
  }

  return ideas.sort((left, right) => right.score - left.score).slice(0, 10);
}
