import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Copy, Shuffle, Wrench } from "lucide-react"
import { toast } from "sonner"

import {
    auditProductionFifoWarehouse,
    fixProductionFifoWarehouse,
    type ProductionFifoWarehouseAuditResult,
    type ProductionFifoWarehouseCandidate,
    type ProductionFifoWarehouseFixResult,
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

export function LedgerProductionFifoWarehouseToolButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [fromDate, setFromDate] = useState("2026-04-01")
    const [toDate, setToDate] = useState(todayIso())
    const [result, setResult] = useState<ProductionFifoWarehouseAuditResult | null>(null)
    const [fixResult, setFixResult] = useState<ProductionFifoWarehouseFixResult | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    const payload = useMemo(() => ({ from_date: fromDate || undefined, to_date: toDate || undefined }), [fromDate, toDate])

    const auditMutation = useMutation({
        mutationFn: (options?: { silent?: boolean }) => auditProductionFifoWarehouse(payload),
        onSuccess: (data, options) => {
            const normalized = normalizeAuditResult(data)
            setResult(normalized)
            setSelectedIds(normalized.candidates.map((item) => item.production_id))
            if (!options?.silent) {
                setFixResult(null)
                toast.success(`Đã kiểm tra: ${normalized.production_count} lệnh SX cần sửa FIFO kho`)
            }
        },
        onError: (error: any) => toast.error(error?.message || "Không kiểm tra được FIFO kho sản xuất"),
    })

    const fixMutation = useMutation({
        mutationFn: () => fixProductionFifoWarehouse({ ...payload, production_ids: selectedIds }),
        onSuccess: async (data) => {
            setFixResult(data)
            toast.success(data.message || "Đã sửa FIFO kho sản xuất")
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] }),
                queryClient.invalidateQueries({ queryKey: ["inventory-lots"] }),
                queryClient.invalidateQueries({ queryKey: ["inventory-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["production-orders"] }),
            ])
            auditMutation.mutate({ silent: true })
        },
        onError: (error: any) => {
            setFixResult(null)
            toast.error(error?.message || "Sửa FIFO kho thất bại, giao dịch đã rollback")
        },
    })

    const candidates = normalizeCandidates(result?.candidates)
    const busy = auditMutation.isPending || fixMutation.isPending
    const allSelected = candidates.length > 0 && candidates.every((item) => selectedIds.includes(item.production_id))

    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : candidates.map((item) => item.production_id))
    }

    const copyRows = async () => {
        if (!candidates.length) return
        const text = candidates.map((item) => {
            const rows = normalizeRows(item.rows).map((row) =>
                `  - ${row.product_code || row.material_id}: ${row.preferred_warehouse_code || "-"} -> ${row.allocated_warehouse_code || "-"} | lô ${row.lot_no || "-"} | SL ${formatNumber(row.allocated_quantity)}`
            ).join("\n")
            return `${item.production_no || item.production_id} (${formatDate(item.production_date)})\n${rows}`
        }).join("\n\n")
        await navigator.clipboard.writeText(text)
        toast.success("Đã copy danh sách FIFO lệch kho")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Shuffle className="mr-2 h-4 w-4 text-blue-600" />
                    Sửa FIFO kho
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "calc(100vw - 32px)", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Kiểm tra FIFO theo kho ưu tiên của vật tư</DialogTitle>
                    <DialogDescription>
                        Tool tạm để tìm lệnh sản xuất đã chạy FIFO sang kho khác dù dòng vật tư có kho ưu tiên, sau đó unpost/post lại phiếu xuất nguyên liệu trong một giao dịch.
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
                        <Button type="button" variant="outline" disabled={busy} onClick={() => auditMutation.mutate(undefined)}>
                            Kiểm tra
                        </Button>
                        <Button type="button" disabled={busy || selectedIds.length === 0} onClick={() => fixMutation.mutate()}>
                            <Wrench className="mr-2 h-4 w-4" />
                            Chạy sửa
                        </Button>
                    </div>
                </div>

                {fixResult ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        <div className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Đã chạy sửa xong
                        </div>
                        <div className="mt-1">{fixResult.message || `Đã sửa ${formatNumber(fixResult.fixed_count)} lệnh SX.`}</div>
                    </div>
                ) : null}

                {result ? (
                    <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                        <div className="grid gap-2 md:grid-cols-2">
                            <Metric label="Dòng lệch kho" value={result.mismatch_rows} />
                            <Metric label="Lệnh SX cần xem" value={result.production_count} />
                        </div>

                        <div className="rounded-md border">
                            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                                <div className="font-medium">Danh sách lệnh cần sửa FIFO kho</div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" disabled={!candidates.length} onClick={copyRows}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={!candidates.length} onClick={toggleAll}>
                                        {allSelected ? "Bỏ chọn" : "Chọn tất cả"}
                                    </Button>
                                </div>
                            </div>
                            <div className="max-h-[56vh] overflow-auto">
                                <table className="w-full min-w-[1400px] text-sm">
                                    <thead className="sticky top-0 z-10 bg-muted/70">
                                        <tr>
                                            <th className="w-12 px-3 py-2 text-center">Chọn</th>
                                            <th className="px-3 py-2 text-left">Lệnh SX</th>
                                            <th className="px-3 py-2 text-left">Phiếu xuất NVL</th>
                                            <th className="px-3 py-2 text-left">Dòng lệch kho</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.length > 0 ? candidates.map((item) => (
                                            <tr key={item.production_id} className="border-t align-top">
                                                <td className="px-3 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.production_id)}
                                                        onChange={(event) => {
                                                            setSelectedIds((old) => event.target.checked
                                                                ? Array.from(new Set([...old, item.production_id]))
                                                                : old.filter((id) => id !== item.production_id))
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="font-semibold">{item.production_no || `#${item.production_id}`}</div>
                                                    <div className="text-xs text-muted-foreground">{formatDate(item.production_date)} · {item.production_status || "-"}</div>
                                                </td>
                                                <td className="px-3 py-3">{item.issue_voucher_no || "-"}</td>
                                                <td className="min-w-[560px] px-3 py-3">
                                                    <div className="space-y-2">
                                                        {normalizeRows(item.rows).slice(0, 5).map((row) => (
                                                            <div key={`${row.material_id}-${row.lot_no}-${row.allocated_warehouse_code}`} className="rounded border bg-background px-2 py-1">
                                                                <div className="font-medium">{row.product_code} - {row.product_name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Kho ưu tiên {row.preferred_warehouse_code || "-"} · Đã FIFO {row.allocated_warehouse_code || "-"} · Lô {row.lot_no || "-"} · SL {formatNumber(row.allocated_quantity)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {normalizeRows(item.rows).length > 5 ? (
                                                            <div className="text-xs text-muted-foreground">+{normalizeRows(item.rows).length - 5} dòng khác</div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={4}>
                                                    Không phát hiện lệnh sản xuất FIFO lệch kho ưu tiên trong khoảng đã chọn.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function normalizeAuditResult(data?: ProductionFifoWarehouseAuditResult | null): ProductionFifoWarehouseAuditResult {
    return {
        from_date: data?.from_date ?? null,
        to_date: data?.to_date ?? null,
        mismatch_rows: Number(data?.mismatch_rows ?? 0),
        production_count: Number(data?.production_count ?? 0),
        candidates: normalizeCandidates(data?.candidates),
    }
}

function normalizeCandidates(value?: ProductionFifoWarehouseCandidate[] | null) {
    return Array.isArray(value) ? value : []
}

function normalizeRows(value?: ProductionFifoWarehouseCandidate["rows"] | null) {
    return Array.isArray(value) ? value : []
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{formatNumber(value)}</div>
        </div>
    )
}

function todayIso() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = `${d.getMonth() + 1}`.padStart(2, "0")
    const dd = `${d.getDate()}`.padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const [yyyy, mm, dd] = value.slice(0, 10).split("-")
    if (!yyyy || !mm || !dd) return value
    return `${dd}/${mm}/${yyyy}`
}

function formatNumber(value?: number | string | null) {
    const n = Number(value ?? 0)
    if (!Number.isFinite(n)) return "-"
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(n)
}
