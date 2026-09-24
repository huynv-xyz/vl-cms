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
import { getGrowthDashboard, type GrowthRankingItem } from "@/api/ai/chat";
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
