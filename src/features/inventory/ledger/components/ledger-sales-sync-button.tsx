import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Copy, RefreshCw, XCircle } from "lucide-react"
import { toast } from "sonner"

import {
    previewSalesInventorySync,
    runSalesInventorySync,
    type SalesInventorySyncDetail,
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

    const details = result?.details ?? []
    const busy = previewMutation.isPending || runMutation.isPending

    const copyDetails = async () => {
        if (!details.length) return
        await navigator.clipboard.writeText(details.map(formatDetailLine).join("\n"))
        toast.success("Đã copy danh sách chi tiết")
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
                        <Button type="button" variant="outline" disabled={busy} onClick={() => previewMutation.mutate()}>
                            Kiểm tra
                        </Button>
                        <Button type="button" disabled={busy} onClick={() => runMutation.mutate()}>
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

                        <div className="rounded-md border">
                            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                                <div>
                                    <div className="font-medium">Chi tiết kiểm tra</div>
                                    <div className="text-muted-foreground text-xs">
                                        Preview hiển thị dòng sẵn sàng/lỗi/đã có. Sau khi đồng bộ sẽ có thêm trạng thái thành công và mã phiếu.
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" disabled={!details.length} onClick={copyDetails}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy chi tiết
                                </Button>
                            </div>
                            <div className="max-h-[52vh] overflow-auto">
                                <table className="w-full min-w-[1500px] text-sm">
                                    <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10">
                                        <tr>
                                            <th className="w-12 px-3 py-2 text-left">STT</th>
                                            <th className="px-3 py-2 text-left">Trạng thái</th>
                                            <th className="px-3 py-2 text-left">Ngày</th>
                                            <th className="px-3 py-2 text-left">Chứng từ</th>
                                            <th className="px-3 py-2 text-left">Loại</th>
                                            <th className="px-3 py-2 text-left">Khách hàng</th>
                                            <th className="px-3 py-2 text-left">Mã hàng</th>
                                            <th className="px-3 py-2 text-left">Tên hàng</th>
                                            <th className="px-3 py-2 text-left">ĐVT</th>
                                            <th className="px-3 py-2 text-right">Số lượng</th>
                                            <th className="px-3 py-2 text-left">Kho</th>
                                            <th className="px-3 py-2 text-left">Phiếu kho</th>
                                            <th className="px-3 py-2 text-left">Lý do</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.length > 0 ? details.map((item, index) => (
                                            <tr key={`${item.sales_transaction_id}-${item.voucher_type_code}-${index}`} className="border-t">
                                                <td className="px-3 py-2">{index + 1}</td>
                                                <td className="px-3 py-2">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.date)}</td>
                                                <td className="px-3 py-2 font-medium">{item.document_no || "-"}</td>
                                                <td className="px-3 py-2">{labelType(item.voucher_type_code)}</td>
                                                <td className="px-3 py-2">{item.customer_name || "-"}</td>
                                                <td className="px-3 py-2">{item.product_code || "-"}</td>
                                                <td className="px-3 py-2 min-w-[260px]">{item.product_name || "-"}</td>
                                                <td className="px-3 py-2">{item.unit || "-"}</td>
                                                <td className="px-3 py-2 text-right font-medium">{formatNumber(item.quantity)}</td>
                                                <td className="px-3 py-2">
                                                    <div className="font-medium">{item.warehouse_name || "-"}</div>
                                                    <div className="text-muted-foreground text-xs">{item.warehouse_code || "-"}</div>
                                                </td>
                                                <td className="px-3 py-2">{item.voucher_no || "-"}</td>
                                                <td className="px-3 py-2 min-w-[260px]">{item.reason || "-"}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td className="text-muted-foreground px-3 py-8 text-center" colSpan={13}>
                                                    Không có dòng cần xử lý trong khoảng thời gian này.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                {formatNumber(value)}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status?: string | null }) {
    const normalized = status || "-"
    if (normalized === "SUCCESS") {
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Thành công</span>
    }
    if (normalized === "ERROR") {
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"><XCircle className="h-3.5 w-3.5" />Lỗi</span>
    }
    if (normalized === "SKIPPED") {
        return <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Đã có</span>
    }
    if (normalized === "READY") {
        return <span className="inline-flex rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">Sẵn sàng</span>
    }
    return <span className="text-muted-foreground">{normalized}</span>
}

function labelType(value?: string | null) {
    if (value === "SALES_EXPORT") return "Xuất kho bán hàng"
    if (value === "SALES_RETURN") return "Nhập hàng bán trả lại"
    return value || "-"
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-")
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

function formatNumber(value?: number | string | null) {
    const numeric = Number(value || 0)
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(Number.isFinite(numeric) ? numeric : 0)
}

function formatDetailLine(item: SalesInventorySyncDetail, index: number) {
    return [
        `${index + 1}. ${statusLabel(item.status)}`,
        `Ngày: ${formatDate(item.date)}`,
        `Chứng từ: ${item.document_no || "-"}`,
        `Loại: ${labelType(item.voucher_type_code)}`,
        `Khách hàng: ${item.customer_name || "-"}`,
        `Mã hàng: ${item.product_code || "-"}`,
        `Tên hàng: ${item.product_name || "-"}`,
        `SL: ${formatNumber(item.quantity)} ${item.unit || ""}`.trim(),
        `Kho: ${item.warehouse_code || "-"} - ${item.warehouse_name || "-"}`,
        `Phiếu kho: ${item.voucher_no || "-"}`,
        `Lý do: ${item.reason || "-"}`,
    ].join(" | ")
}

function statusLabel(status?: string | null) {
    if (status === "SUCCESS") return "Thành công"
    if (status === "ERROR") return "Lỗi"
    if (status === "SKIPPED") return "Đã có"
    if (status === "READY") return "Sẵn sàng"
    return status || "-"
}

function todayIso() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
