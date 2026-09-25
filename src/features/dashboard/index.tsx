import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);

const compactMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  if (absolute >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  return money(value);
};

const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));

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
      label: "Lô sắp hết hạn",
      value: operations.expiringLots,
      note: "Cần ưu tiên bán",
      icon: PackageSearch,
      tone: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        <MetricCard
          title="Hàng trả lại"
          value={`${compactMoney(operations.returnRevenue)} đồng`}
          detail={`${((operations.returnRevenue / (operations.netRevenue + operations.returnRevenue || 1)) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}% doanh thu gộp`}
          icon={PackageSearch}
          accent={operations.returnRevenue > 0 ? "negative" : undefined}
        />
        <MetricCard
          title="Giá trị đơn trung bình"
          value={`${compactMoney(operations.netRevenue / (operations.totalOrders || 1))} đồng`}
          detail={`${money(operations.totalOrders)} đơn trong kỳ`}
          icon={ShoppingCart}
          accent="primary"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Doanh thu thuần theo tuần</CardTitle>
            <CardDescription>
              Xu hướng doanh thu trong kỳ hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trend}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
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
                  formatter={(value) => [
                    `${money(Number(value))} đồng`,
                    "Doanh thu thuần",
                  ]}
                  labelStyle={{ color: "#0f172a" }}
                />
                <Bar
                  dataKey="netRevenue"
                  fill="#14b8a6"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={70}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Cảnh báo vận hành</CardTitle>
            <CardDescription>
              Các việc cần chú ý theo dữ liệu hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {alerts.map((alert) => (
              <div
                key={alert.label}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${alert.tone}`}
                >
                  <alert.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{alert.label}</p>
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="text-xl">{money(alert.value)}</strong>
                    <span className="truncate text-xs text-muted-foreground">
                      {alert.note}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Ý tưởng phát triển kinh doanh
            </h2>
            <p className="text-sm text-muted-foreground">
              Đề xuất hành động được ưu tiên theo dữ liệu hiện tại
            </p>
          </div>
          <Badge variant="secondary">{ideas.length} đề xuất</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {ideas.map((idea, index) => (
            <Card
              key={idea.key}
              className="group gap-4 overflow-hidden border-border/70 py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`h-1.5 ${idea.tone}`} />
              <CardHeader className="gap-3 px-5 pt-1 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{idea.category}</Badge>
                  <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <CardTitle className="text-lg leading-snug">
                  {idea.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {idea.evidence}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ưu tiên thực hiện
                  </p>
                  <div className="space-y-1.5">
                    {idea.targets.map((target) => (
                      <div
                        key={`${idea.key}-${target.name}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium"
                            title={target.name}
                          >
                            {target.name}
                          </p>
                          {target.meta && (
                            <p className="truncate text-xs text-muted-foreground">
                              {target.meta}
                            </p>
                          )}
                        </div>
                        {target.value && (
                          <strong className="shrink-0 text-xs text-primary">
                            {target.value}
                          </strong>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nên làm ngay
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{idea.action}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                  <div>
                    <span className="block text-xs text-muted-foreground">
                      {idea.impactLabel}
                    </span>
                    <strong className="text-sm text-primary">
                      {idea.impactValue}
                    </strong>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{idea.timeframe}</Badge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Đo bằng: {idea.successMetric}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <Ranking title="Top khu vực" icon={Boxes} items={data.topRegions} />
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

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Điểm cần điều hành</h2>
          <p className="text-sm text-muted-foreground">
            Công nợ, tồn kho và giao hàng cần được theo dõi sát
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30">
                <CircleDollarSign className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Công nợ khách hàng cao
                </CardTitle>
                <CardDescription className="mt-1">
                  5 khách có dư nợ lớn nhất
                </CardDescription>
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

          <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/30">
                <PackageSearch className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Rủi ro tồn kho</CardTitle>
                <CardDescription className="mt-1">
                  Lô cần kiểm tra và xử lý sớm
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.inventoryRisks.map((item, index) => (
                <DataRow
                  key={`${item.riskType}-${item.productCode}-${item.lotCode || index}`}
                  index={index}
                  title={item.productName}
                  subtitle={inventoryRiskLabel(
                    item.riskType,
                    item.daysToExpiry,
                  )}
                  value={`${money(item.quantity)} ${item.unit || ""}`}
                  negative={item.riskType !== "EXPIRING_SOON"}
                />
              ))}
              {data.inventoryRisks.length === 0 && (
                <EmptyState text="Không có rủi ro tồn kho" />
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <Truck className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">Hiệu suất giao hàng</CardTitle>
                <CardDescription className="mt-1">
                  Đơn trễ và đơn đang giao theo sale
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.deliveryPerformance.map((item, index) => (
                <DataRow
                  key={item.employee_code}
                  index={index}
                  title={item.employee_name}
                  subtitle={`${item.late_orders} trễ · ${item.pending_orders} đang giao`}
                  value={
                    item.on_time_percent == null
                      ? "Chưa đủ dữ liệu"
                      : `${item.on_time_percent.toLocaleString("vi-VN")}% đúng hạn`
                  }
                  negative={(item.late_orders || 0) > 0}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Khách hàng cần theo dõi</h2>
          <p className="text-sm text-muted-foreground">
            Ưu tiên tạo đơn mua lại và phân công sale chăm sóc
          </p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
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
              {data.newCustomers.map((item, index) => (
                <DataRow
                  key={item.customer_code}
                  index={index}
                  title={item.customer_name}
                  subtitle={`${item.assigned_employee_name || "Chưa phân sale"} · ${date(item.first_purchase_date)}`}
                  value={compactMoney(item.net_revenue)}
                />
              ))}
              {data.newCustomers.length === 0 && (
                <EmptyState text="Chưa có khách hàng mới trong kỳ" />
              )}
            </CardContent>
          </Card>

          <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 bg-muted/20 pb-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                <UserRoundX className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Khách hàng cần chăm sóc lại
                </CardTitle>
                <CardDescription>
                  Không mua hàng từ 60 ngày trở lên
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.inactiveCustomers.map((item, index) => (
                <DataRow
                  key={item.customer_code}
                  index={index}
                  title={item.customer_name}
                  subtitle={`${item.employee_name || "Chưa phân sale"} · ${item.inactive_days == null ? "Chưa từng mua" : `${item.inactive_days} ngày`}`}
                  value={compactMoney(item.revenue_last_12_months)}
                  negative
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div>
            <CardTitle>Cơ hội tăng trưởng ưu tiên</CardTitle>
            <CardDescription>
              Khách hàng cần sale ưu tiên chăm sóc
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="divide-y rounded-xl border p-0">
          {data.opportunities.slice(0, 6).map((opportunity) => (
            <div
              key={opportunity.key}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_140px_130px] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-medium" title={opportunity.title}>
                  {opportunity.title}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {opportunity.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Doanh thu ước tính
                </p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {compactMoney(opportunity.estimatedRevenue)} đồng
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="truncate text-xs text-muted-foreground">
                  {opportunity.saleName || "Chưa phân công"}
                </span>
                <Badge
                  variant={
                    opportunity.priority === "HIGH"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {opportunity.priority === "HIGH" ? "Ưu tiên" : "Theo dõi"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Main>
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
  const maxRevenue = Math.max(...items.map((item) => item.netRevenue), 1);
  const totalRevenue = items.reduce((sum, item) => sum + item.netRevenue, 0);

  return (
    <Card className="gap-4 overflow-hidden border-border/70 shadow-sm">
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
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.code}-${index}`}
            className="relative overflow-hidden rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/40"
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-primary/[0.055]"
              style={{
                width: `${Math.max(5, (item.netRevenue / maxRevenue) * 100)}%`,
              }}
            />
            <div className="relative flex items-center gap-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={item.name}>
                  {item.name || item.code}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Trả hàng{" "}
                  {item.returnRatePercent.toLocaleString("vi-VN", {
                    maximumFractionDigits: 2,
                  })}
                  % · SL {money(item.saleQuantity)}
                </p>
              </div>
              <p className="shrink-0 text-right">
                <strong className="block text-sm">
                  {compactMoney(item.netRevenue)}
                </strong>
                <span className="text-[11px] text-muted-foreground">
                  {(
                    (item.netRevenue / (totalRevenue || 1)) *
                    100
                  ).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
                  % top
                </span>
              </p>
            </div>
          </div>
        ))}
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

function inventoryRiskLabel(
  riskType: "NEGATIVE_STOCK" | "EXPIRED" | "EXPIRING_SOON",
  daysToExpiry?: number | null,
) {
  if (riskType === "NEGATIVE_STOCK") return "Tồn kho âm";
  if (daysToExpiry == null || Math.abs(daysToExpiry) > 3_650)
    return "Ngày hết hạn không hợp lệ · cần sửa dữ liệu";
  if (riskType === "EXPIRED")
    return `Đã hết hạn ${Math.abs(daysToExpiry || 0)} ngày`;
  return `Còn ${daysToExpiry ?? 0} ngày đến hạn`;
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
