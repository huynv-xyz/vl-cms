import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
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
    <Main className="space-y-6 pb-12">
      <section className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Tổng quan điều hành
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Tình hình kinh doanh
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {date(data.currentFrom)} – {date(data.asOfDate)} · Dữ liệu mới nhất
          </p>
        </div>
        <Button asChild className="self-start shadow-none md:self-auto">
          <Link to="/ai-assistant">
            <Sparkles /> Trợ lý điều hành <ArrowRight />
          </Link>
        </Button>
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
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card className="shadow-none">
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

        <Card className="shadow-none">
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea, index) => (
            <Card
              key={idea.key}
              className="gap-4 overflow-hidden py-0 shadow-none"
            >
              <div className={`h-1 ${idea.tone}`} />
              <CardHeader className="gap-3 px-5 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{idea.category}</Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    Đề xuất {index + 1}
                  </span>
                </div>
                <CardTitle className="text-base leading-snug">
                  {idea.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {idea.evidence}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nên làm ngay
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{idea.action}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {idea.impactLabel}
                  </span>
                  <strong className="text-sm text-primary">
                    {idea.impactValue}
                  </strong>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Điểm cần điều hành</h2>
          <p className="text-sm text-muted-foreground">
            Công nợ, tồn kho và giao hàng cần được theo dõi sát
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="gap-4 shadow-none">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <CircleDollarSign className="size-5 text-red-500" />
              <CardTitle className="text-base">
                Công nợ khách hàng cao
              </CardTitle>
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

          <Card className="gap-4 shadow-none">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <PackageSearch className="size-5 text-orange-500" />
              <CardTitle className="text-base">Rủi ro tồn kho</CardTitle>
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

          <Card className="gap-4 shadow-none">
            <CardHeader className="flex-row items-center gap-2 pb-0">
              <Truck className="size-5 text-blue-500" />
              <CardTitle className="text-base">Hiệu suất giao hàng</CardTitle>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 shadow-none">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <UserPlus className="size-5 text-emerald-600" />
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

        <Card className="gap-4 shadow-none">
          <CardHeader className="flex-row items-center gap-2 pb-0">
            <UserRoundX className="size-5 text-amber-600" />
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
      </section>

      <Card className="shadow-none">
        <CardHeader>
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
  accent?: "positive" | "negative";
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <CardDescription>{title}</CardDescription>
          <p
            className={`mt-1 truncate text-xl font-bold tracking-tight ${accent === "positive" ? "text-emerald-600" : accent === "negative" ? "text-red-600" : ""}`}
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
  return (
    <Card className="gap-4 shadow-none">
      <CardHeader className="flex-row items-center gap-2 pb-0">
        <Icon className="size-5 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, index) => (
          <div
            key={`${item.code}-${index}`}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={item.name}>
                {item.name || item.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Trả hàng{" "}
                {item.returnRatePercent.toLocaleString("vi-VN", {
                  maximumFractionDigits: 2,
                })}
                % · SL {money(item.saleQuantity)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {compactMoney(item.netRevenue)}
            </span>
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
      score: crossSellValue,
      tone: "bg-blue-500",
    });
  }

  const reorderCount = countOpportunities(["REORDER_DUE"]);
  const reorderValue = sumOpportunities(["REORDER_DUE"]);
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
      score: receivableValue * 0.08,
      tone: "bg-rose-500",
    });
  }

  return ideas.sort((left, right) => right.score - left.score).slice(0, 6);
}
