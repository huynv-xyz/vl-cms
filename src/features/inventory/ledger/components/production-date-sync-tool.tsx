import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
    applyProductionDateSync,
    checkProductionDateSync,
    type ProductionDateSyncResult,
} from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function ProductionDateSyncTool({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [productionNos, setProductionNos] = useState("")
    const [result, setResult] = useState<ProductionDateSyncResult | null>(null)

    const checkMutation = useMutation({
        mutationFn: () => checkProductionDateSync(productionNos),
        onSuccess: setResult,
    })

    const applyMutation = useMutation({
        mutationFn: () => applyProductionDateSync(productionNos),
        onSuccess: async (data) => {
            setResult(data)
            toast.success(data.message || "Đã sửa đồng bộ ngày lệnh SX")
            await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-cost-periods"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            await queryClient.invalidateQueries({ queryKey: ["production-order-detail"] })
        },
        onError: (error: any) => toast.error(error?.message || "Không sửa được ngày lệnh SX"),
    })

    const busy = checkMutation.isPending || applyMutation.isPending
    const error = checkMutation.error || applyMutation.error
    const hasMismatch = Number(result?.mismatch_count || 0) > 0

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
            <DialogContent className="flex max-h-[92vh] !w-[min(1320px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Sửa đồng bộ ngày lệnh SX</DialogTitle>
                    <DialogDescription>
                        Nhập mã lệnh sản xuất cách nhau bằng dấu phẩy. Bỏ trống để kiểm tra toàn bộ lệnh SX trong danh sách sản xuất.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto pr-1">
                    <Textarea
                        value={productionNos}
                        onChange={(event) => {
                            setProductionNos(event.target.value)
                            setResult(null)
                            checkMutation.reset()
                            applyMutation.reset()
                        }}
                        placeholder="VD: SX-20260630-002, SX-20260701-001"
                        className="min-h-24 font-mono"
                    />

                    {error ? (
                        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{(error as any)?.message || "Không xử lý được đồng bộ ngày lệnh SX."}</span>
                        </div>
                    ) : null}

                    {result ? <ProductionDateSyncResultPanel result={result} /> : null}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" variant="outline" disabled={busy} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                        Kiểm tra
                    </Button>
                    <Button type="button" disabled={busy || !hasMismatch} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Sửa đồng bộ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ProductionDateSyncResultPanel({ result }: { result: ProductionDateSyncResult }) {
    const hasMismatch = Number(result.mismatch_count || 0) > 0
    const changes = result.changes || {}

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    "flex items-start gap-2 rounded-md border p-3 text-sm",
                    hasMismatch ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800",
                )}
            >
                {hasMismatch ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                <div>
                    <div className="font-semibold">{result.message}</div>
                    <div className="mt-1">
                        Đã kiểm tra {formatNumber(result.checked_count)} lệnh SX, phát hiện {formatNumber(result.mismatch_count)} lệnh lệch ngày.
                    </div>
                    {result.applied ? (
                        <div className="mt-1">
                            Đã cập nhật {formatNumber(changes.updated_vouchers || 0)} chứng từ, {formatNumber(changes.updated_ledgers || 0)} dòng sổ kho,
                            {` ${formatNumber(changes.updated_outputs || 0)} dòng nhập TP.`}
                        </div>
                    ) : null}
                </div>
            </div>

            {hasMismatch ? (
                <div className="overflow-auto rounded-md border">
                    <table className="w-full min-w-[1000px] text-sm">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-2 py-2 text-left">Mã lệnh SX</th>
                                <th className="px-2 py-2 text-left">Ngày lệnh SX</th>
                                <th className="px-2 py-2 text-right">Chứng từ</th>
                                <th className="px-2 py-2 text-right">Sổ kho</th>
                                <th className="px-2 py-2 text-right">Nhập TP</th>
                                <th className="px-2 py-2 text-left">Chi tiết lệch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.issues.map((item) => (
                                <tr key={item.production_id} className="border-t align-top">
                                    <td className="px-2 py-2 font-mono">{item.production_no}</td>
                                    <td className="px-2 py-2">{item.production_date}</td>
                                    <td className="px-2 py-2 text-right">{formatNumber(item.voucher_mismatch_count)}</td>
                                    <td className="px-2 py-2 text-right">{formatNumber(item.ledger_mismatch_count)}</td>
                                    <td className="px-2 py-2 text-right">{formatNumber(item.output_mismatch_count)}</td>
                                    <td className="px-2 py-2">
                                        <div className="max-h-32 space-y-1 overflow-y-auto">
                                            {item.details.slice(0, 12).map((detail, index) => (
                                                <div key={`${item.production_id}-${detail.kind}-${detail.id || index}`} className="font-mono text-xs">
                                                    {detail.kind} #{detail.id || "-"} {detail.doc_no || ""}: {detail.current_date || "-"} -&gt; {detail.expected_date || "-"}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}

function formatNumber(value?: number | null) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}
