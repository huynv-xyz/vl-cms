import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, FileSearch, Loader2, ReceiptText, RotateCcw } from "lucide-react"

import {
    applySalesExportArMissingRepair,
    previewSalesExportArMissingRepair,
    type SalesExportArMissingRepairResult,
    type SalesExportArMissingRepairSample,
} from "@/api/sales-export-ar-missing-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"

export default function SalesExportArMissingRepairToolPage() {
    const [result, setResult] = useState<SalesExportArMissingRepairResult>()
    const [checking, setChecking] = useState(false)
    const [applying, setApplying] = useState(false)

    const busy = checking || applying
    const canApply = Boolean(result && !result.applied && result.missing_line_count > 0 && !busy)

    const handlePreview = async () => {
        try {
            setChecking(true)
            const data = await previewSalesExportArMissingRepair()
            setResult(data)
            toast.success("Đã quét phiếu xuất thiếu công nợ")
        } catch (error: any) {
            toast.error(error?.message || "Quét dữ liệu thất bại")
        } finally {
            setChecking(false)
        }
    }

    const handleApply = async () => {
        if (!result) {
            toast.error("Cần quét trước khi chạy")
            return
        }

        const confirmed = window.confirm(
            "Bổ sung công nợ thiếu cho phiếu xuất đã DONE?\n\nTool sẽ tạo dòng ar_ledger còn thiếu theo đơn giá hiện tại trên đơn hàng và cộng lại accounts_receivable trong một transaction."
        )
        if (!confirmed) return

        try {
            setApplying(true)
            const data = await applySalesExportArMissingRepair()
            setResult(data)
            toast.success("Đã bổ sung công nợ thiếu")
        } catch (error: any) {
            toast.error(error?.message || "Chạy tool thất bại, dữ liệu đã rollback")
        } finally {
            setApplying(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Bù công nợ phiếu xuất</h2>
                        <Badge variant="destructive">Tool tạm</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quét phiếu xuất DONE có đơn giá hiện tại đã phát sinh tiền nhưng còn thiếu dòng công nợ.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePreview} disabled={busy}>
                        {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                        Quét dữ liệu
                    </Button>
                    <Button variant="destructive" onClick={handleApply} disabled={!canApply}>
                        {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        Cập nhật công nợ
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Tool chỉ xử lý dòng hàng thường, phiếu xuất đã DONE, chưa có dòng <b>ar_ledger</b> tương ứng và số tiền theo đơn giá hiện tại lớn hơn 0.
            </div>

            {result ? (
                <>
                    <div className="grid gap-3 md:grid-cols-4">
                        <SummaryCard title="Phiếu thiếu" value={result.missing_export_count} />
                        <SummaryCard title="Đơn thiếu" value={result.missing_order_count} />
                        <SummaryCard title="Dòng thiếu" value={result.missing_line_count} />
                        <SummaryCard title="Số tiền cần bù" value={formatMoney(result.missing_amount)} />
                    </div>

                    {result.applied ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ReceiptText className="h-4 w-4" />
                                    Kết quả cập nhật
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                                <ResultLine label="Dòng công nợ đã thêm" value={result.ledger_inserted} />
                                <ResultLine label="Đơn công nợ đã tạo" value={result.receivables_created} />
                                <ResultLine label="Đơn công nợ đã cộng tiền" value={result.receivables_updated} />
                            </CardContent>
                        </Card>
                    ) : null}

                    {result.missing_line_count === 0 ? (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            Không còn phiếu xuất DONE bị thiếu công nợ theo phạm vi tool.
                        </div>
                    ) : (
                        <SampleTable rows={result.samples} />
                    )}
                </>
            ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                    Bấm “Quét dữ liệu” để xem danh sách trước khi cập nhật.
                </div>
            )}

            {result && result.missing_line_count > result.samples.length ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Bảng chỉ hiển thị tối đa {formatNumber(result.samples.length)} dòng mẫu.
                </div>
            ) : null}
        </Main>
    )
}

function SummaryCard({ title, value }: { title: string; value: number | string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
        </Card>
    )
}

function ResultLine({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{formatNumber(value)}</span>
        </div>
    )
}

function SampleTable({ rows }: { rows: SalesExportArMissingRepairSample[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Dòng sẽ bổ sung công nợ</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[520px] overflow-auto rounded-md border">
                    <table className="w-full min-w-[1200px] text-sm">
                        <thead className="sticky top-0 bg-muted/50">
                            <tr>
                                <th className="border px-2 py-1 text-left">Phiếu xuất</th>
                                <th className="border px-2 py-1 text-left">Đơn hàng</th>
                                <th className="border px-2 py-1 text-left">Ngày xuất</th>
                                <th className="border px-2 py-1 text-left">Khách hàng</th>
                                <th className="border px-2 py-1 text-left">Mã hàng</th>
                                <th className="border px-2 py-1 text-left">Tên hàng</th>
                                <th className="border px-2 py-1 text-right">SL</th>
                                <th className="border px-2 py-1 text-right">Đơn giá</th>
                                <th className="border px-2 py-1 text-right">Số tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${row.export_item_id}-${row.product_code}`}>
                                    <td className="border px-2 py-1 font-mono">{row.export_no || "-"}</td>
                                    <td className="border px-2 py-1 font-mono">{row.order_no || "-"}</td>
                                    <td className="border px-2 py-1">{formatDate(row.posting_date)}</td>
                                    <td className="border px-2 py-1">
                                        <div className="font-medium">{row.customer_name || "-"}</div>
                                        <div className="text-muted-foreground font-mono text-xs">{row.customer_code || "-"}</div>
                                    </td>
                                    <td className="border px-2 py-1 font-mono">{row.product_code || "-"}</td>
                                    <td className="border px-2 py-1">{row.product_name || "-"}</td>
                                    <td className="border px-2 py-1 text-right tabular-nums">{formatMoney(row.quantity)}</td>
                                    <td className="border px-2 py-1 text-right tabular-nums">{formatMoney(row.unit_price)}</td>
                                    <td className="border px-2 py-1 text-right font-semibold tabular-nums">{formatMoney(row.expected_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

function formatMoney(value?: number | string | null) {
    return formatNumber(Number(value || 0))
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const [date] = String(value).split(/[T ]/)
    const [year, month, day] = date.split("-")
    if (!year || !month || !day) return String(value)
    return `${day}/${month}/${year}`
}
