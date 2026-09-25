import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Coins,
  DatabaseZap,
  Gauge,
  MessageSquareText,
  RefreshCw,
  Save,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAiAdminAnalytics,
  updateAiModelPricing,
  type AiAdminAnalytics,
  type AiRecentRequest,
} from "@/api/ai/admin";
import { Main } from "@/components/layout/main";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const integer = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function localDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function compact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${decimal.format(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${decimal.format(value / 1_000)}K`;
  return integer.format(value);
}

function duration(value: number) {
  if (value >= 60_000) return `${decimal.format(value / 60_000)} phút`;
  if (value >= 1_000) return `${decimal.format(value / 1_000)} giây`;
  return `${integer.format(value)} ms`;
}

const toolLabels: Record<string, string> = {
  get_customer_sales_performance: "Doanh thu & lợi nhuận khách hàng",
  get_sales_breakdown: "Doanh thu theo chiều",
  get_sales_profit: "Giá vốn & lợi nhuận",
  get_customer_receivable_risk: "Rủi ro công nợ khách hàng",
  get_customer_activity: "Khách cần chăm sóc",
  get_declining_customers: "Khách giảm mua",
  get_executive_overview: "Tổng quan điều hành",
  get_inventory_risks: "Rủi ro tồn kho",
  get_vip_overdue: "VIP nợ quá hạn",
};

const reasonLabels: Record<string, string> = {
  MISSING_DATA: "Thiếu số liệu",
  WRONG_DATA: "Sai số liệu",
  HARD_TO_UNDERSTAND: "Khó hiểu",
  TOO_SLOW: "Phản hồi chậm",
  NOT_RELEVANT: "Chưa đúng trọng tâm",
  OTHER: "Khác",
  NO_REASON: "Không chọn lý do",
};

export default function AiAdminPage() {
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState(localDate(6));
  const [toDate, setToDate] = useState(localDate());
  const analytics = useQuery({
    queryKey: ["ai-admin-analytics", fromDate, toDate],
    queryFn: () => getAiAdminAnalytics(fromDate, toDate),
    staleTime: 30_000,
    retry: 1,
  });
  const pricingMutation = useMutation({
    mutationFn: ({ model, values }: { model: string; values: PricingDraft }) =>
      updateAiModelPricing(model, {
        input_usd_per_million: numberValue(values.input),
        cached_input_usd_per_million: numberValue(values.cached),
        output_usd_per_million: numberValue(values.output),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-admin-analytics"] }),
  });

  if (analytics.isLoading) return <Loading />;
  if (!analytics.data || analytics.isError) {
    return (
      <Main className="space-y-5">
        <Header fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} refreshing={analytics.isFetching} refresh={() => analytics.refetch()} />
        <Card className="mx-auto mt-12 max-w-xl border-red-200">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="size-10 text-red-500" />
            <h2 className="text-lg font-semibold">Chưa tải được dữ liệu vận hành AI</h2>
            <p className="text-sm text-muted-foreground">Tài khoản cần vai trò ADMIN và migration giám sát AI phải được áp dụng.</p>
            <Button onClick={() => analytics.refetch()}><RefreshCw /> Thử lại</Button>
          </CardContent>
        </Card>
      </Main>
    );
  }

  const data = analytics.data;
  const summary = data.summary;
  const cachedRate = summary.input_tokens > 0 ? (summary.cached_input_tokens * 100) / summary.input_tokens : 0;
  const averageDuration = data.models.length
    ? data.models.reduce((sum, item) => sum + item.average_duration_ms * item.requests, 0) / Math.max(1, summary.requests)
    : 0;
  const qualityState = summary.feedback_count < 5
    ? { label: "Chưa đủ đánh giá", value: `${summary.feedback_count} phản hồi` }
    : { label: `${decimal.format(summary.useful_rate)}% hữu ích`, value: `${summary.useful_feedback}/${summary.feedback_count} phản hồi tốt` };

  return (
    <Main className="min-w-0 space-y-6 bg-gradient-to-b from-teal-50/40 via-background to-background pb-12 dark:from-teal-950/10">
      <Header fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} refreshing={analytics.isFetching} refresh={() => analytics.refetch()} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} title="Tổng request" value={integer.format(summary.requests)} detail={`${integer.format(summary.successful)} thành công · ${integer.format(summary.failed)} lỗi`} tone="teal" />
        <Metric icon={BrainCircuit} title="Input token" value={compact(summary.input_tokens)} detail={`TB ${compact(summary.average_input_tokens)}/request · cache ${decimal.format(cachedRate)}%`} tone="violet" />
        <Metric icon={MessageSquareText} title="Output token" value={compact(summary.output_tokens)} detail={`TB ${compact(summary.average_output_tokens)}/request · không giới hạn chất lượng`} tone="blue" />
        <Metric icon={Coins} title="Chi phí ước tính" value={summary.pricing_coverage_rate > 0 ? usd.format(summary.estimated_cost_usd) : "Chưa cấu hình"} detail={`Độ phủ đơn giá ${decimal.format(summary.pricing_coverage_rate)}%`} tone="amber" />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Signal icon={CheckCircle2} label="Tỷ lệ kỹ thuật thành công" value={`${decimal.format(summary.success_rate)}%`} note="Request hoàn tất, chưa đồng nghĩa output tốt" good={summary.success_rate >= 95} />
        <Signal icon={ThumbsUp} label="Chất lượng do người dùng đánh giá" value={qualityState.label} note={qualityState.value} good={summary.feedback_count >= 5 && summary.useful_rate >= 80} />
        <Signal icon={DatabaseZap} label="Cache câu trả lời" value={`${decimal.format(summary.cache_hit_rate)}%`} note={`${integer.format(summary.cache_hits)} request không gọi OpenAI`} good={summary.cache_hit_rate >= 10} />
        <Signal icon={Clock3} label="Thời gian phản hồi trung bình" value={duration(averageDuration)} note={`Tổng ${integer.format(summary.openai_requests)} lượt gọi OpenAI`} good={averageDuration > 0 && averageDuration <= 15_000} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-5 text-teal-600" /> Request và token theo ngày</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px] p-4 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.daily} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} fontSize={11} />
                <YAxis yAxisId="tokens" tickFormatter={compact} fontSize={11} width={52} />
                <YAxis yAxisId="requests" orientation="right" allowDecimals={false} fontSize={11} width={34} />
                <Tooltip formatter={(value, name) => [integer.format(Number(value)), name === "requests" ? "Request" : name === "output_tokens" ? "Output token" : "Input token"]} labelFormatter={(label) => `Ngày ${label}`} />
                <Legend />
                <Area yAxisId="tokens" type="monotone" dataKey="input_tokens" name="Input token" fill="#99f6e4" stroke="#0f766e" fillOpacity={0.5} />
                <Bar yAxisId="tokens" dataKey="output_tokens" name="Output token" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="requests" type="monotone" dataKey="requests" name="Request" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-base"><Wrench className="size-5 text-teal-600" /> Công cụ được sử dụng</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            {data.tools.length === 0 ? <Empty text="Chưa có tool được gọi trong kỳ." /> : data.tools.slice(0, 8).map((item, index) => {
              const max = data.tools[0]?.requests || 1;
              return (
                <div key={item.tool} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{toolLabels[item.tool] ?? item.tool}</span>
                    <span className="tabular-nums text-muted-foreground">{integer.format(item.requests)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", index === 0 ? "bg-teal-500" : "bg-teal-300 dark:bg-teal-700")} style={{ width: `${Math.max(5, (item.requests * 100) / max)}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <QualityPanel data={data} />
        <PricingPanel data={data} mutation={pricingMutation} />
      </section>

      <RecentRequests items={data.recent} />
    </Main>
  );
}

function Header({ fromDate, toDate, setFromDate, setToDate, refreshing, refresh }: {
  fromDate: string; toDate: string; setFromDate: (value: string) => void; setToDate: (value: string) => void; refreshing: boolean; refresh: () => void;
}) {
  const preset = (days: number) => { setFromDate(localDate(days - 1)); setToDate(localDate()); };
  return (
    <header className="rounded-2xl border border-teal-200/70 bg-background/90 p-5 shadow-sm backdrop-blur dark:border-teal-900/60 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(360px,1fr)_auto] xl:items-center">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"><Bot className="size-6" /></span>
          <div><h1 className="mb-1 text-2xl font-bold tracking-tight">Quản trị Trợ lý AI</h1><p className="max-w-2xl text-sm text-muted-foreground">Theo dõi chi phí, token, hiệu năng và chất lượng câu trả lời trên cùng một màn hình.</p></div>
        </div>
        <div className="flex flex-wrap items-end justify-start gap-3 xl:justify-end">
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-muted/45 p-1">
            {[1, 7, 30].map((days) => <Button key={days} type="button" size="sm" variant={fromDate === localDate(days - 1) && toDate === localDate() ? "secondary" : "ghost"} onClick={() => preset(days)}>{days === 1 ? "Hôm nay" : `${days} ngày`}</Button>)}
          </div>
          <div className="flex shrink-0 items-end gap-2">
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">Từ ngày<Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-9 w-[145px] bg-background text-xs" /></label>
            <label className="space-y-1 text-[11px] font-medium text-muted-foreground">Đến ngày<Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-9 w-[145px] bg-background text-xs" /></label>
            <Button size="icon" variant="outline" className="mb-px size-9 shrink-0" onClick={refresh} disabled={refreshing} title="Làm mới"><RefreshCw className={cn("size-4", refreshing && "animate-spin")} /></Button>
          </div>
        </div>
      </div>
    </header>
  );
}

const tones = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

function Metric({ icon: Icon, title, value, detail, tone }: { icon: typeof Activity; title: string; value: string; detail: string; tone: keyof typeof tones }) {
  return <Card className="border-border/70 shadow-sm"><CardContent className="flex items-start gap-4 p-5"><span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{detail}</p></div></CardContent></Card>;
}

function Signal({ icon: Icon, label, value, note, good }: { icon: typeof Activity; label: string; value: string; note: string; good: boolean }) {
  return <div className="flex items-start gap-3 rounded-xl border bg-background p-4"><span className={cn("mt-0.5 flex size-8 items-center justify-center rounded-lg", good ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950" : "bg-amber-50 text-amber-600 dark:bg-amber-950")}><Icon className="size-4" /></span><div><p className="text-[11px] font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold">{value}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{note}</p></div></div>;
}

function QualityPanel({ data }: { data: AiAdminAnalytics }) {
  const rated = data.summary.feedback_count;
  return <Card className="border-border/70 shadow-sm"><CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-5 text-violet-600" /> Chất lượng câu trả lời</CardTitle></CardHeader><CardContent className="space-y-5 p-5">
    <div className="grid grid-cols-3 gap-3"><MiniStat icon={ThumbsUp} label="Hữu ích" value={data.summary.useful_feedback} tone="text-emerald-600" /><MiniStat icon={ThumbsDown} label="Chưa tốt" value={data.summary.not_useful_feedback} tone="text-red-500" /><MiniStat icon={MessageSquareText} label="Đã đánh giá" value={rated} tone="text-violet-600" /></div>
    {rated < 5 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Cần tối thiểu 5 phản hồi để tỷ lệ chất lượng có ý nghĩa. Tỷ lệ kỹ thuật thành công không thay thế đánh giá của người dùng.</div>}
    <div><p className="mb-3 text-xs font-semibold">Lý do câu trả lời chưa tốt</p>{data.feedback_reasons.length === 0 ? <Empty text="Chưa có phản hồi tiêu cực." /> : <div className="flex flex-wrap gap-2">{data.feedback_reasons.map((item) => <Badge key={item.reason_code} variant="outline" className="gap-2 rounded-full px-3 py-1.5"><span>{reasonLabels[item.reason_code] ?? item.reason_code}</span><span className="rounded-full bg-muted px-1.5 tabular-nums">{item.count}</span></Badge>)}</div>}</div>
    <div><p className="mb-3 text-xs font-semibold">Lỗi và fallback kỹ thuật</p>{data.errors.length === 0 ? <div className="flex items-center gap-2 text-xs text-emerald-600"><CheckCircle2 className="size-4" /> Không có lỗi trong kỳ.</div> : <div className="space-y-2">{data.errors.map((item) => <div key={item.error_code} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"><span>{item.error_code}</span><strong>{item.count}</strong></div>)}</div>}</div>
  </CardContent></Card>;
}

type PricingDraft = { input: string; cached: string; output: string };
function PricingPanel({ data, mutation }: { data: AiAdminAnalytics; mutation: UseMutationResult<{ model: string }, Error, { model: string; values: PricingDraft }> }) {
  const modelNames = Array.from(new Set([...data.models.map((item) => item.model), ...data.pricing.map((item) => item.model)])).filter((name) => name !== "Chưa xác định");
  const [drafts, setDrafts] = useState<Record<string, PricingDraft>>({});
  return <Card className="border-border/70 shadow-sm"><CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-base"><Coins className="size-5 text-amber-600" /> Đơn giá và chi phí ước tính</CardTitle></CardHeader><CardContent className="space-y-4 p-5"><p className="text-xs leading-5 text-muted-foreground">Nhập giá USD cho 1 triệu token theo trang Billing OpenAI. Hệ thống không hardcode giá để tránh tính sai khi nhà cung cấp thay đổi.</p>{modelNames.length === 0 ? <Empty text="Chưa phát sinh model nào trong kỳ." /> : modelNames.map((model) => { const price = data.pricing.find((item) => item.model === model); const draft = drafts[model] ?? { input: String(price?.input_usd_per_million ?? ""), cached: String(price?.cached_input_usd_per_million ?? ""), output: String(price?.output_usd_per_million ?? "") }; const usage = data.models.find((item) => item.model === model); return <div key={model} className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{model}</p><p className="text-[11px] text-muted-foreground">{usage ? `${integer.format(usage.requests)} request · ${usage.pricing_configured ? usd.format(usage.estimated_cost_usd) : "chưa tính được chi phí"}` : "Chưa dùng trong kỳ"}</p></div><Button size="sm" className="h-8" disabled={mutation.isPending || !validPricing(draft)} onClick={() => mutation.mutate({ model, values: draft })}><Save className="size-3.5" /> Lưu</Button></div><div className="grid grid-cols-3 gap-2">{(["input", "cached", "output"] as const).map((field) => <label key={field} className="space-y-1 text-[10px] font-medium text-muted-foreground"><span>{field === "input" ? "Input" : field === "cached" ? "Cached input" : "Output"}</span><Input inputMode="decimal" value={draft[field]} onChange={(event) => setDrafts((current) => ({ ...current, [model]: { ...draft, [field]: event.target.value } }))} placeholder="USD/1M" className="h-8 text-xs" /></label>)}</div></div>; })}{mutation.isSuccess && <p className="text-xs text-emerald-600">Đã cập nhật đơn giá và tính lại chi phí.</p>}{mutation.isError && <p className="text-xs text-destructive">Không lưu được đơn giá.</p>}</CardContent></Card>;
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: number; tone: string }) { return <div className="rounded-xl bg-muted/35 p-3 text-center"><Icon className={cn("mx-auto size-4", tone)} /><p className="mt-2 text-xl font-bold tabular-nums">{integer.format(value)}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }

function RecentRequests({ items }: { items: AiRecentRequest[] }) {
  return <Card className="overflow-hidden border-border/70 shadow-sm"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Zap className="size-5 text-cyan-600" /> 100 request gần nhất</CardTitle><span className="text-xs text-muted-foreground">Bấm vào dòng để xem câu hỏi và output</span></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-muted/30 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Thời gian / người hỏi</th><th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 text-right font-medium">Input</th><th className="px-3 py-3 text-right font-medium">Cached</th><th className="px-3 py-3 text-right font-medium">Output</th><th className="px-3 py-3 text-right font-medium">Thời gian</th><th className="px-3 py-3 font-medium">Tool</th><th className="px-4 py-3 font-medium">Đánh giá</th></tr></thead><tbody className="divide-y">{items.map((item) => <RequestRow key={item.request_id} item={item} />)}</tbody></table></div>{items.length === 0 && <div className="p-10"><Empty text="Chưa có request trong kỳ." /></div>}</CardContent></Card>;
}

function RequestRow({ item }: { item: AiRecentRequest }) {
  const [open, setOpen] = useState(false);
  return <><tr className="cursor-pointer hover:bg-muted/25" onClick={() => setOpen((value) => !value)}><td className="px-4 py-3"><p className="font-medium">{new Date(item.created_at).toLocaleString("vi-VN")}</p><p className="mt-0.5 max-w-[190px] truncate text-[10px] text-muted-foreground">{item.user_name || item.user_email || "Không xác định"} · {item.request_id.slice(0, 8)}</p></td><td className="px-3 py-3">{item.status === "SUCCESS" ? <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="size-3" /> Thành công</Badge> : <Badge variant="destructive"><XCircle className="size-3" /> {item.error_code || "Lỗi"}</Badge>}</td><td className="px-3 py-3 text-right tabular-nums">{compact(item.input_tokens || 0)}</td><td className="px-3 py-3 text-right tabular-nums text-teal-600">{compact(item.cached_input_tokens || 0)}</td><td className="px-3 py-3 text-right tabular-nums">{compact(item.output_tokens || 0)}</td><td className="px-3 py-3 text-right tabular-nums">{duration(item.duration_ms)}</td><td className="max-w-[220px] px-3 py-3"><span className="line-clamp-2">{item.tool_names?.split(",").map((tool) => toolLabels[tool] ?? tool).join(", ") || "Không gọi tool"}</span></td><td className="px-4 py-3">{item.rating === "USEFUL" ? <span className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="size-3.5" /> Hữu ích</span> : item.rating === "NOT_USEFUL" ? <span className="flex items-center gap-1 text-red-500"><ThumbsDown className="size-3.5" /> {reasonLabels[item.reason_code || ""] || "Chưa tốt"}</span> : <span className="text-muted-foreground">Chưa đánh giá</span>}</td></tr>{open && <tr className="bg-muted/15"><td colSpan={8} className="px-5 py-4"><div className="grid gap-4 lg:grid-cols-2"><Preview title="Câu hỏi" content={item.question_preview} /><Preview title="Câu trả lời" content={item.answer_preview} /></div><div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground"><Badge variant="outline">Model: {item.model || "-"}</Badge><Badge variant="outline">OpenAI calls: {item.openai_request_count ?? 0}</Badge><Badge variant="outline">Tool payload: {compact(item.tool_payload_chars ?? 0)} ký tự</Badge><Badge variant="outline">Tool offered: {item.offered_tool_count ?? 0}</Badge><Badge variant="outline">Cache: {item.cache_status || "-"}</Badge></div>{item.comment && <p className="mt-3 rounded-lg bg-background p-3 text-xs"><strong>Góp ý:</strong> {item.comment}</p>}</td></tr>}</>;
}

function Preview({ title, content }: { title: string; content?: string | null }) { return <div className="rounded-xl border bg-background p-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><p className="line-clamp-6 whitespace-pre-wrap text-xs leading-5">{content || "Không có nội dung lưu trữ."}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 py-5 text-xs text-muted-foreground"><AlertTriangle className="size-4" /> {text}</div>; }
function Loading() { return <Main className="space-y-5"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div><div className="h-96 animate-pulse rounded-xl bg-muted" /></Main>; }
function numberValue(value: string) { const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) ? parsed : 0; }
function validPricing(value: PricingDraft) { return [value.input, value.cached, value.output].every((item) => item !== "" && Number.isFinite(Number(item.replace(",", "."))) && Number(item.replace(",", ".")) >= 0); }
