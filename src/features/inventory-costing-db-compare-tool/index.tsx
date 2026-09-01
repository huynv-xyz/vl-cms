import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, DatabaseBackup, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { listCostPeriods, type CostPeriod } from "@/api/inventory/costing"
import { compareInventoryCostingDatabases, type CostingCompareResult, type CostingCompareSample } from "@/api/inventory-costing-db-compare-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { formatNumber } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

export default function InventoryCostingDbCompareToolPage() {
    const periodsQuery = useQuery({ queryKey: ["inventory-cost-periods"], queryFn: () => listCostPeriods({ page: 1, size: 1000 }) })
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [checking, setChecking] = useState(false)
    const [result, setResult] = useState<CostingCompareResult>()
    const periods = periodsQuery.data?.items || []
    const selected = useMemo(() => new Set(selectedIds), [selectedIds])

    const toggle = (period: CostPeriod) => setSelectedIds((ids) => ids.includes(period.id) ? ids.filter((id) => id !== period.id) : [...ids, period.id])
    const check = async () => {
        if (!selectedIds.length) { toast.error("Chọn ít nhất một kỳ tính giá") ; return }
        try { setChecking(true); const data = await compareInventoryCostingDatabases(selectedIds); setResult(data); toast.success("Đã đối chiếu dữ liệu với vlife_ss") }
        catch (error: any) { toast.error(error?.message || "Đối chiếu thất bại") }
        finally { setChecking(false) }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Đối chiếu dữ liệu tính giá</h2><Badge variant="destructive">Tool tạm</Badge></div>
                    <p className="text-muted-foreground mt-1 text-sm">Chỉ đọc dữ liệu đã lưu giữa DB hiện tại và <span className="font-mono">vlife_ss</span>; không cập nhật, không tính lại giá.</p>
                </div>
                <Button onClick={check} disabled={checking || periodsQuery.isLoading}>
                    {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Đối chiếu dữ liệu
                </Button>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-base">Chọn kỳ cần đối chiếu</CardTitle></CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {periods.map((period) => <label key={period.id} className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/30">
                        <Checkbox checked={selected.has(period.id)} onCheckedChange={() => toggle(period)} />
                        <span className="min-w-0"><b className="block truncate">{period.name}</b><span className="text-muted-foreground text-xs">{period.from_date} - {period.to_date} · {period.status}</span></span>
                    </label>)}
                </CardContent>
            </Card>
            {result ? <ComparisonResult result={result} /> : <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">Chọn kỳ rồi bấm “Đối chiếu dữ liệu”.</div>}
        </Main>
    )
}

function ComparisonResult({ result }: { result: CostingCompareResult }) {
    const allMatch = result.totals.different_periods === 0
    return <>
        <div className={allMatch ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800" : "rounded-md border border-red-200 bg-red-50 p-3 text-red-800"}>
            {allMatch ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : <AlertTriangle className="mr-2 inline h-4 w-4" />}
            {allMatch
                ? <>Các số liệu đã lưu khớp với dữ liệu trước khi sửa trong <b>{result.reference_database}</b>.</>
                : <>Phát hiện chênh lệch so với dữ liệu trước khi sửa trong <b>{result.reference_database}</b>. Xem từng kỳ và các dòng mẫu bên dưới để xác định thay đổi có chủ đích hay không.</>}
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><DatabaseBackup className="h-4 w-4" />Kết quả theo kỳ</CardTitle></CardHeader><CardContent><div className="overflow-auto rounded-md border"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-muted/50"><tr><th className="border px-2 py-1 text-left">Kỳ</th><th className="border px-2 py-1">Kết quả</th><th className="border px-2 py-1">Dòng tổng hợp tồn kho khác</th><th className="border px-2 py-1">Dòng sổ kho giá đã tính khác</th><th className="border px-2 py-1 text-left">Diễn giải</th></tr></thead><tbody>{result.periods.map((period) => <tr key={period.current_period_id}><td className="border px-2 py-1"><b>{period.name}</b><br/><span className="text-muted-foreground text-xs">{period.from_date} - {period.to_date}</span></td><td className="border px-2 py-1 text-center"><Badge variant={period.status === "MATCH" ? "secondary" : "destructive"}>{period.status === "MATCH" ? "Khớp" : period.status === "DIFFERENT" ? "Có khác biệt" : "Chưa có dữ liệu đối chiếu"}</Badge></td><td className="border px-2 py-1 text-right">{period.product_costs ? differenceDescription(period.product_costs) : "-"}</td><td className="border px-2 py-1 text-right">{period.ledger_costs ? differenceDescription(period.ledger_costs) : "-"}</td><td className="border px-2 py-1">{period.status === "MATCH" ? "Số lượng và giá trị đã lưu đều khớp." : period.message}</td></tr>)}</tbody></table></div></CardContent></Card>
        <DifferenceTable title="Các dòng Tổng hợp tồn kho khác nhau" rows={result.product_differences} />
        <DifferenceTable title="Các dòng sổ kho đã tính giá khác nhau" rows={result.ledger_differences} />
    </>
}

function DifferenceTable({ title, rows }: { title: string; rows: CostingCompareSample[] }) {
    return <Card><CardHeader><CardTitle className="text-base">{title} <span className="text-muted-foreground font-normal">({formatNumber(rows.length)} dòng mẫu, tối đa 300)</span></CardTitle></CardHeader><CardContent>{rows.length ? <div className="max-h-96 overflow-auto rounded-md border"><table className="w-full min-w-[1120px] text-sm"><thead className="sticky top-0 bg-muted/50"><tr><th className="border px-2 py-1 text-left">Thông tin dòng</th><th className="border px-2 py-1 text-left">Nguyên nhân</th><th className="border px-2 py-1 text-left">Chênh lệch cụ thể</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.key}-${index}`}><td className="border px-2 py-1">{sampleIdentity(row)}</td><td className="border px-2 py-1"><b>{categoryLabel(row.category)}</b><br/><span className="text-muted-foreground text-xs">{row.explanation || humanColumns(row.reason)}</span></td><td className="border px-2 py-1">{sampleChanges(row)}</td></tr>)}</tbody></table></div> : <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">Không có chênh lệch.</div>}</CardContent></Card>
}

function differenceDescription(stats: NonNullable<CostingCompareResult["periods"][number]["product_costs"]>) {
    if (!stats.difference_count) return "Không có dòng khác"
    const parts = [`${formatNumber(stats.difference_count)} dòng`]
    if (stats.quantity_mismatches) parts.push(`${formatNumber(stats.quantity_mismatches)} lệch số lượng`)
    if (stats.value_mismatches) parts.push(`${formatNumber(stats.value_mismatches)} lệch giá/giá trị`)
    if (stats.only_current) parts.push(`${formatNumber(stats.only_current)} dòng mới`)
    if (stats.only_reference) parts.push(`${formatNumber(stats.only_reference)} dòng chỉ có trong backup`)
    return parts.join(", ")
}

const columnLabels: Record<string, string> = {
    opening_quantity: "SL đầu kỳ", opening_value: "GT đầu kỳ", inbound_quantity: "SL nhập", inbound_value: "GT nhập",
    outbound_quantity: "SL xuất", outbound_value: "GT xuất", closing_quantity: "SL tồn", closing_value: "GT tồn",
    avg_unit_cost: "Đơn giá bình quân", quantity: "Số lượng", costed_unit_price: "Đơn giá đã tính", costed_amount: "Thành tiền đã tính",
}
function humanColumns(reason: string) { return reason === "Chỉ có ở DB hiện tại" || reason === "Chỉ có ở vlife_ss" ? reason : reason.split(", ").map((key) => columnLabels[key] || key).join(", ") }
function sampleIdentity(row: CostingCompareSample) {
    const data = row.current || row.reference || {}
    if (row.type === "PRODUCT_COST") return <><b>{String(data.product_code || "-")}</b><br/><span className="text-muted-foreground">{String(data.product_name || "-")} · {String(data.warehouse_code || "Không xác định kho")}</span></>
    return <><b>{String(data.doc_no || "Chưa có số chứng từ")}</b><br/><span className="text-muted-foreground">{String(data.posting_date || "-")} · {String(data.doc_type || "-")} · dòng sổ kho #{String(data.id || row.key)}</span></>
}
function sampleValues(data: Record<string, unknown> | null | undefined, reason: string) {
    if (!data) return "Không có"
    if (reason === "Chỉ có ở DB hiện tại" || reason === "Chỉ có ở vlife_ss") return "Có dòng dữ liệu"
    return reason.split(", ").map((key) => `${columnLabels[key] || key}: ${formatValue(data[key])}`).join(" · ")
}
function categoryLabel(category?: CostingCompareSample["category"]) {
    if (category === "QUANTITY_CHANGED") return "Thay đổi số lượng"
    if (category === "ROUNDING_DIFFERENCE") return "Sai số làm tròn rất nhỏ"
    if (category === "UNIT_COST_RECALCULATED") return "Đơn giá vốn đã được tính lại"
    if (category === "VALUE_CHANGED") return "Giá trị đã tính khác"
    return "Dòng dữ liệu khác"
}
function sampleChanges(row: CostingCompareSample) {
    if (!row.changes?.length) return row.reason === "Chỉ có ở DB hiện tại" ? "Dòng này mới có sau khi sửa." : "Dòng này chỉ có trong dữ liệu trước khi sửa."
    return <div className="space-y-1">{row.changes.map((change) => <div key={change.column}><b>{columnLabels[change.column] || change.column}:</b> {formatValue(change.reference)} → {formatValue(change.current)} <span className="text-muted-foreground">({Number(change.difference) >= 0 ? "+" : ""}{formatValue(change.difference)})</span></div>)}</div>
}
function formatValue(value: unknown) {
    const number = Number(value ?? 0)
    return Number.isFinite(number) ? number.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) : String(value ?? "-")
}
