import { useState } from "react"
import { CircleCheck, Search } from "lucide-react"
import { toast } from "sonner"

import {
    applyGiftTransactionRepair,
    checkGiftTransactions,
    type GiftTransactionRepairResult,
} from "@/api/sales-gift-transaction-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"

export default function SalesGiftTransactionRepairToolPage() {
    const [result, setResult] = useState<GiftTransactionRepairResult | null>(null)
    const [busy, setBusy] = useState(false)

    const check = async () => {
        setBusy(true)
        try {
            setResult(await checkGiftTransactions())
        } catch (error: any) {
            toast.error(error?.message || "Không thể kiểm tra giao dịch")
        } finally {
            setBusy(false)
        }
    }

    const apply = async () => {
        if (!result?.repairable || result.applied) return
        if (!window.confirm(`Sửa ${result.repairable} giao dịch hàng tặng đã đối chiếu? Doanh thu sẽ giảm ${formatCurrency(result.revenue_reduction)}. Các dòng chưa xác định được nguồn sẽ giữ nguyên.`)) return
        setBusy(true)
        try {
            const updated = await applyGiftTransactionRepair(result.token)
            setResult(updated)
            toast.success(`Đã sửa ${updated.updated} giao dịch`)
        } catch (error: any) {
            toast.error(error?.message || "Không thể áp dụng; hãy kiểm tra lại dữ liệu")
            setResult(null)
        } finally {
            setBusy(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold">Sửa giao dịch hàng tặng</h2>
                    <p className="text-sm text-muted-foreground">Đối chiếu phiếu xuất khuyến mãi với các giao dịch có giá hoặc doanh thu khác 0.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={check} disabled={busy}>
                        <Search className="size-4" /> Kiểm tra
                    </Button>
                    <Button onClick={apply} disabled={busy || !result?.repairable || !!result?.applied}>
                        <CircleCheck className="size-4" /> Áp dụng
                    </Button>
                </div>
            </div>

            {result && (
                <>
                    <div className="grid gap-3 border-b pb-4 sm:grid-cols-4">
                        <Metric label="Dòng bất thường" value={result.total} />
                        <Metric label="Đối chiếu được" value={result.repairable} />
                        <Metric label="Cần xử lý riêng" value={result.unresolved} />
                        <Metric label={result.applied ? "Đã sửa" : "Doanh thu sẽ giảm"}
                            value={result.applied ? result.updated : formatCurrency(result.revenue_reduction)} />
                    </div>
                    <div className="overflow-auto border">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="bg-muted/60 text-muted-foreground">
                                <tr>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Phiếu xuất</th>
                                    <th className="p-3 text-left">Mã hàng</th>
                                    <th className="p-3 text-right">Số lượng</th>
                                    <th className="p-3 text-right">Đơn giá hiện tại</th>
                                    <th className="p-3 text-right">Doanh thu hiện tại</th>
                                    <th className="p-3 text-left">Dòng xuất</th>
                                    <th className="p-3 text-left">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(result.rows ?? []).map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="p-3 font-mono">{row.id}</td>
                                        <td className="p-3 font-mono">{row.document_no || "-"}</td>
                                        <td className="p-3 font-mono">{row.product_code || "-"}</td>
                                        <td className="p-3 text-right tabular-nums">{formatNumber(row.quantity)}</td>
                                        <td className="p-3 text-right tabular-nums">{formatCurrency(row.unit_price)}</td>
                                        <td className="p-3 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                                        <td className="p-3">{row.source_item_id ? `#${row.source_item_id}` : "-"}</td>
                                        <td className="p-3">
                                            {row.reason
                                                ? <span className="text-destructive">{row.reason}</span>
                                                : <Badge variant="outline">{result.applied ? "Đã sửa" : "Sẽ sửa về 0"}</Badge>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!(result.rows ?? []).length && <p className="p-6 text-sm text-muted-foreground">Không có giao dịch cần sửa.</p>}
                    </div>
                    {result.total > (result.rows ?? []).length && (
                        <p className="text-sm text-muted-foreground">Đang hiển thị {(result.rows ?? []).length}/{result.total} dòng. Tổng số dòng đối chiếu được vẫn được xử lý khi áp dụng.</p>
                    )}
                </>
            )}
        </Main>
    )
}

function Metric({ label, value }: { label: string; value: number | string }) {
    return <div><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums">{typeof value === "number" ? formatNumber(value) : value}</div></div>
}
