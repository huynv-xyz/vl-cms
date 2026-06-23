import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import {
    previewSalesInventorySync,
    runSalesInventorySync,
    type SalesInventorySyncResult,
} from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LedgerSalesSyncButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [fromDate, setFromDate] = useState("2026-04-01")
    const [toDate, setToDate] = useState(todayIso())
    const [result, setResult] = useState<SalesInventorySyncResult | null>(null)

    const payload = useMemo(() => ({
        from_date: fromDate,
        to_date: toDate,
    }), [fromDate, toDate])

    const previewMutation = useMutation({
        mutationFn: () => previewSalesInventorySync(payload),
        onSuccess: (data) => {
            setResult(data)
            toast.success("Đã kiểm tra dữ liệu bán hàng")
        },
        onError: (error: any) => toast.error(error?.message || "Không kiểm tra được dữ liệu bán hàng"),
    })

    const runMutation = useMutation({
        mutationFn: () => runSalesInventorySync(payload),
        onSuccess: async (data) => {
            setResult(data)
            await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
            if (data.failed_operations > 0) {
                toast.warning(`Đã đồng bộ ${data.created_vouchers} phiếu, lỗi ${data.failed_operations} dòng`)
            } else {
                toast.success(`Đã đồng bộ ${data.created_vouchers} phiếu bán hàng`)
            }
        },
        onError: (error: any) => toast.error(error?.message || "Không đồng bộ được dữ liệu bán hàng"),
    })

    const busy = previewMutation.isPending || runMutation.isPending

    const copyErrors = async () => {
        if (!result?.errors?.length) return
        const text = result.errors
            .map((error, index) => [
                `${index + 1}. ${error.reason || ""}`,
                `Chứng từ: ${error.document_no || "-"}`,
                `Loại: ${labelType(error.voucher_type_code)}`,
                `Mã hàng: ${error.product_code || "-"}`,
                `Kho: ${error.warehouse_code || "-"}`,
                `Sales ID: ${error.sales_transaction_id || "-"}`,
            ].join(" | "))
            .join("\n")
        await navigator.clipboard.writeText(text)
        toast.success("Đã copy danh sách lỗi")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4 text-sky-600" />
                    Đồng bộ bán hàng
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "calc(100vw - 32px)", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đồng bộ bán hàng sang tồn kho</DialogTitle>
                    <DialogDescription>
                        Tạo phiếu xuất bán hàng và phiếu nhập hàng bán trả lại từ dữ liệu sales_transactions.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-[220px_220px_1fr]">
                    <div className="space-y-1.5">
                        <Label>Từ ngày</Label>
                        <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Đến ngày</Label>
                        <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => previewMutation.mutate()}
                        >
                            Kiểm tra
                        </Button>
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => runMutation.mutate()}
                        >
                            Đồng bộ
                        </Button>
                    </div>
                </div>

                {result && (
                    <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                        <div className="grid gap-2 md:grid-cols-5">
                            <Metric label="Giao dịch" value={result.total_transactions} />
                            <Metric label="Dòng xử lý" value={result.total_operations} />
                            <Metric label="Sẵn sàng" value={result.ready_operations} />
                            <Metric label="Đã có" value={result.skipped_operations} />
                            <Metric label="Lỗi" value={result.failed_operations} tone="bad" />
                        </div>

                        <div className="grid gap-2 md:grid-cols-3">
                            <Metric label="Xuất bán" value={result.ready_export_operations} />
                            <Metric label="Nhập trả lại" value={result.ready_return_operations} />
                            <Metric label="Phiếu đã tạo" value={result.created_vouchers} />
                        </div>

                        {result.errors?.length > 0 && (
                            <div className="rounded-md border">
                                <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                                    <div className="font-medium">Danh sách lỗi</div>
                                    <Button size="sm" variant="outline" onClick={copyErrors}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy lỗi
                                    </Button>
                                </div>
                                <div className="max-h-[52vh] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/60 text-muted-foreground sticky top-0">
                                            <tr>
                                                <th className="w-12 px-3 py-2 text-left">STT</th>
                                                <th className="px-3 py-2 text-left">Chứng từ</th>
                                                <th className="px-3 py-2 text-left">Loại</th>
                                                <th className="px-3 py-2 text-left">Mã hàng</th>
                                                <th className="px-3 py-2 text-left">Kho</th>
                                                <th className="px-3 py-2 text-left">Lý do</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((error, index) => (
                                                <tr key={`${error.sales_transaction_id}-${index}`} className="border-t">
                                                    <td className="px-3 py-2">{index + 1}</td>
                                                    <td className="px-3 py-2">{error.document_no || "-"}</td>
                                                    <td className="px-3 py-2">{labelType(error.voucher_type_code)}</td>
                                                    <td className="px-3 py-2">{error.product_code || "-"}</td>
                                                    <td className="px-3 py-2">{error.warehouse_code || "-"}</td>
                                                    <td className="px-3 py-2">{error.reason || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
    return (
        <div className="rounded-md border px-3 py-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className={tone === "bad" ? "text-lg font-semibold text-rose-600" : "text-lg font-semibold"}>
                {new Intl.NumberFormat("vi-VN").format(value || 0)}
            </div>
        </div>
    )
}

function labelType(value?: string | null) {
    if (value === "SALES_EXPORT") return "Xuất kho bán hàng"
    if (value === "SALES_RETURN") return "Nhập hàng bán trả lại"
    return value || "-"
}

function todayIso() {
    return new Date().toISOString().slice(0, 10)
}
