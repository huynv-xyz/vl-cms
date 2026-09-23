import * as React from "react"
import { DatabaseBackup, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { applyVipCustomerPlanBackfill, checkVipCustomerPlanBackfill, type VipPlanBackfillPreview, type VipPlanBackfillResult } from "@/api/vip-customer-plan-backfill-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VipCustomerPlanBackfillToolPage() {
    const [preview, setPreview] = React.useState<VipPlanBackfillPreview>()
    const [result, setResult] = React.useState<VipPlanBackfillResult>()
    const [busy, setBusy] = React.useState<"check" | "apply">()

    const check = async () => {
        try {
            setBusy("check")
            const next = await checkVipCustomerPlanBackfill()
            setPreview(next)
            setResult(undefined)
            toast.success("Đã kiểm tra dữ liệu kế hoạch")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kiểm tra thất bại")
        } finally { setBusy(undefined) }
    }

    const apply = async () => {
        if (!window.confirm("Kiểm tra và backfill dữ liệu kế hoạch cũ trong một transaction? Nếu hậu kiểm không đạt, toàn bộ thay đổi sẽ tự rollback.")) return
        try {
            setBusy("apply")
            const next = await applyVipCustomerPlanBackfill()
            setResult(next)
            setPreview(next.after)
            if (next.success) toast.success(next.message)
            else toast.error(next.message)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Backfill thất bại")
        } finally { setBusy(undefined) }
    }

    const samples = preview?.samples ?? []

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="flex items-start justify-between gap-3 border-b pb-4">
                <div><h2 className="text-2xl font-bold">Backfill kế hoạch điểm VIP</h2><p className="text-sm text-muted-foreground">Chuẩn hóa kế hoạch cũ sang mô hình nhiều phương án trong một transaction.</p></div>
                <Badge variant="destructive">Bảo trì dữ liệu</Badge>
            </div>
            <Card>
                <CardHeader><CardTitle className="text-base">Kiểm tra và cập nhật an toàn</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Backend tự kiểm tra trước, cập nhật và hậu kiểm trong cùng transaction. Nếu có lỗi hoặc hậu kiểm không đạt, toàn bộ thay đổi sẽ rollback và không lưu dở dữ liệu.</p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={check} disabled={!!busy}>{busy === "check" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Chỉ kiểm tra</Button>
                        <Button onClick={apply} disabled={!!busy}>{busy === "apply" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}Kiểm tra và backfill</Button>
                    </div>
                </CardContent>
            </Card>
            {result ? (
                <Card>
                    <CardHeader><CardTitle className="text-base">Kết quả thao tác</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className={result.success ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"}>{result.message}</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Metric label="Kế hoạch cập nhật" value={result.target_updated_count} />
                            <Metric label="Snapshot điểm cập nhật" value={result.target_point_updated_count} />
                            <Metric label="Item cập nhật" value={result.item_updated_count} />
                            <Metric label="Kế hoạch chính được gán" value={result.primary_updated_count} />
                        </div>
                    </CardContent>
                </Card>
            ) : null}
            {preview ? (
                <Card>
                    <CardHeader><CardTitle className="text-base">Kết quả kiểm tra</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <Metric label="Kế hoạch" value={preview.target_count} />
                            <Metric label="Kế hoạch cần backfill" value={preview.targets_needing_backfill} />
                            <Metric label="Item cần snapshot" value={preview.items_needing_backfill} />
                            <Metric label="Thiếu kế hoạch chính" value={preview.customer_years_without_primary} />
                            <Metric label="Lỗi chặn" value={preview.duplicate_primary_count + preview.duplicate_plan_code_count + preview.orphan_item_count + preview.non_transactional_table_count} />
                        </div>
                        {samples.length ? <DataTable title="Kế hoạch sẽ thay đổi" rows={samples} /> : <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Không còn dữ liệu cần backfill.</div>}
                    </CardContent>
                </Card>
            ) : null}
        </Main>
    )
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold tabular-nums">{value}</div></div> }

function DataTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
    const columns = rows.length ? Object.keys(rows[0]) : []
    return <div className="overflow-hidden rounded-md border"><div className="bg-muted/40 px-3 py-2 text-sm font-medium">{title} (tối đa 200 dòng)</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{columns.map((column) => <th key={column} className="border-b px-3 py-2 text-left">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0">{columns.map((column) => <td key={column} className="px-3 py-2">{String(row[column] ?? "-")}</td>)}</tr>)}</tbody></table></div></div>
}
