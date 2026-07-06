import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Copy, Wrench } from "lucide-react"
import { toast } from "sonner"

import {
    auditProductionInventoryChronology,
    fixProductionInventoryChronology,
    type ProductionChronologyCandidate,
    type ProductionChronologyAuditResult,
    type ProductionChronologyFixResult,
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

export function LedgerProductionChronologyToolButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [fromDate, setFromDate] = useState("2026-04-01")
    const [toDate, setToDate] = useState(todayIso())
    const [result, setResult] = useState<ProductionChronologyAuditResult | null>(null)
    const [fixResult, setFixResult] = useState<ProductionChronologyFixResult | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [dateByProduction, setDateByProduction] = useState<Record<number, string>>({})

    const payload = useMemo(() => ({ from_date: fromDate || undefined, to_date: toDate || undefined }), [fromDate, toDate])

    const auditMutation = useMutation({
        mutationFn: (options?: { silent?: boolean }) => auditProductionInventoryChronology(payload),
        onSuccess: (data, options) => {
            const normalized = normalizeAuditResult(data)
            setResult(normalized)
            const runnable = normalized.candidates.filter((item) => canRunCandidate(item))
            setSelectedIds(runnable.map((item) => item.production_id))
            setDateByProduction(Object.fromEntries(runnable.map((item) => [item.production_id, item.proposed_date || ""])))
            if (!options?.silent) {
                setFixResult(null)
                toast.success(`Đã kiểm tra: ${normalized.production_count} lệnh SX cần xem`)
            }
        },
        onError: (error: any) => toast.error(error?.message || "Không kiểm tra được dữ liệu sản xuất"),
    })

    const fixMutation = useMutation({
        mutationFn: () => fixProductionInventoryChronology({
            ...payload,
            items: selectedIds.map((id) => ({
                production_id: id,
                new_date: dateByProduction[id],
            })),
        }),
        onSuccess: async (data) => {
            setFixResult(data)
            toast.success(data.message || "Đã sửa dữ liệu")
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
            toast.error(error?.message || "Sửa dữ liệu thất bại, giao dịch đã rollback")
        },
    })

    const candidates = normalizeCandidates(result?.candidates)
    const busy = auditMutation.isPending || fixMutation.isPending
    const allSelected = candidates.length > 0 && candidates.filter(canRunCandidate).every((item) => selectedIds.includes(item.production_id))

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(candidates.filter(canRunCandidate).map((item) => item.production_id))
        }
    }

    const copyRows = async () => {
        if (!candidates.length) return
        const text = candidates.map((item) => {
            const rows = normalizeRows(item.rows).map((row) =>
                `  - ${row.product_code || row.product_id} | ${row.warehouse_code || row.warehouse_id} | lo ${row.lot_code || "-"} | can ${formatNumber(row.required_qty)} | co truoc dong ${formatNumber(row.available_before)}`
            ).join("\n")
            return `${item.production_no || item.production_id}: ${item.current_date} -> ${item.proposed_date || "khong co de xuat"}\n${rows}`
        }).join("\n\n")
        await navigator.clipboard.writeText(text)
        toast.success("Đã copy danh sách kiểm tra")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Wrench className="mr-2 h-4 w-4 text-amber-600" />
                    Sửa tồn SX
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "calc(100vw - 32px)", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Kiểm tra tồn kho theo ngày lệnh sản xuất</DialogTitle>
                    <DialogDescription>
                        Tool tạm để tìm phiếu xuất nguyên liệu đã dùng tồn phát sinh sau ngày lệnh, đề xuất ngày đủ tồn rồi unpost/post lại trong một giao dịch.
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
                        <div className="mt-1">
                            {fixResult.message || `Đã sửa ${formatNumber(fixResult.fixed_count)} lệnh SX.`}
                            {" "}Hệ thống đã tự kiểm tra lại dữ liệu sau khi sửa.
                        </div>
                        {normalizeFixRows(fixResult.rows).length ? (
                            <div className="mt-2 grid gap-1">
                                {normalizeFixRows(fixResult.rows).slice(0, 5).map((row) => (
                                    <div key={row.production_id} className="text-xs">
                                        <span className="font-medium">{row.production_no || `#${row.production_id}`}</span>
                                        {": "}
                                        {formatDate(row.old_date)} → {formatDate(row.new_date)}
                                        {row.message ? ` · ${row.message}` : ""}
                                    </div>
                                ))}
                                {normalizeFixRows(fixResult.rows).length > 5 ? (
                                    <div className="text-muted-foreground text-xs">
                                        +{normalizeFixRows(fixResult.rows).length - 5} lệnh khác
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {result ? (
                    <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                        <div className="grid gap-2 md:grid-cols-4">
                            <Metric label="Dòng thiếu theo ngày" value={result.shortage_rows} />
                            <Metric label="Lệnh SX lỗi" value={result.production_count} />
                            <Metric label="Có ngày đề xuất" value={result.auto_fixable} tone="good" />
                            <Metric label="Không tự sửa" value={result.not_fixable} tone="bad" />
                        </div>

                        <div className="rounded-md border">
                            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                                <div className="font-medium">Danh sách lệnh cần kiểm tra</div>
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
                                <table className="w-full min-w-[1500px] text-sm">
                                    <thead className="bg-muted/70 sticky top-0 z-10">
                                        <tr>
                                            <th className="w-12 px-3 py-2 text-center">Chọn</th>
                                            <th className="px-3 py-2 text-left">Lệnh SX</th>
                                            <th className="px-3 py-2 text-left">Phiếu xuất NVL</th>
                                            <th className="px-3 py-2 text-left">Phiếu nhập TP</th>
                                            <th className="px-3 py-2 text-center">Ngày hiện tại</th>
                                            <th className="px-3 py-2 text-center">Ngày đề xuất</th>
                                            <th className="px-3 py-2 text-left">Lý do</th>
                                            <th className="px-3 py-2 text-left">Dòng thiếu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.length > 0 ? candidates.map((item) => (
                                            <tr key={item.production_id} className="border-t align-top">
                                                <td className="px-3 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        disabled={!canRunCandidate(item)}
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
                                                    <div className="text-muted-foreground text-xs">{item.production_status || "-"}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <VoucherCell voucher={item.issue_voucher} />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <VoucherCell voucher={item.receive_voucher} />
                                                </td>
                                                <td className="px-3 py-3 text-center">{formatDate(item.current_date)}</td>
                                                <td className="px-3 py-3">
                                                    <Input
                                                        type="date"
                                                        className="mx-auto w-[160px]"
                                                        disabled={!canRunCandidate(item)}
                                                        value={dateByProduction[item.production_id] || item.proposed_date || ""}
                                                        onChange={(event) => setDateByProduction((old) => ({
                                                            ...old,
                                                            [item.production_id]: event.target.value,
                                                        }))}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 min-w-[260px]">
                                                    <div className={canRunCandidate(item) ? "text-emerald-700" : "text-rose-700"}>
                                                        {canRunCandidate(item) ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : <AlertTriangle className="mr-1 inline h-4 w-4" />}
                                                        {item.proposed_reason || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 min-w-[360px]">
                                                    <div className="space-y-2">
                                                        {normalizeRows(item.rows).slice(0, 4).map((row) => (
                                                            <div key={row.ledger_id} className="rounded border bg-background px-2 py-1">
                                                                <div className="font-medium">{row.product_code} - {row.product_name}</div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    Kho {row.warehouse_code || row.warehouse_name || "-"} | Lô {row.lot_code || "-"} | Cần {formatNumber(row.required_qty)} | Có trước dòng {formatNumber(row.available_before)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {normalizeRows(item.rows).length > 4 ? (
                                                            <div className="text-muted-foreground text-xs">+{normalizeRows(item.rows).length - 4} dòng khác</div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td className="text-muted-foreground px-3 py-8 text-center" colSpan={8}>
                                                    Không phát hiện lệnh sản xuất dùng tồn tương lai trong khoảng đã chọn.
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

function VoucherCell({ voucher }: { voucher?: { voucher_no?: string | null; posting_date?: string | null; status?: string | null } | null }) {
    if (!voucher) return <span className="text-muted-foreground">-</span>
    return (
        <div>
            <div className="font-medium">{voucher.voucher_no || "-"}</div>
            <div className="text-muted-foreground text-xs">{formatDate(voucher.posting_date)} · {voucher.status || "-"}</div>
        </div>
    )
}

function canRunCandidate(item: ProductionChronologyCandidate) {
    return Boolean(item.proposed_date)
}

function normalizeAuditResult(data?: ProductionChronologyAuditResult | null): ProductionChronologyAuditResult {
    return {
        from_date: data?.from_date ?? null,
        to_date: data?.to_date ?? null,
        shortage_rows: Number(data?.shortage_rows ?? 0),
        production_count: Number(data?.production_count ?? 0),
        auto_fixable: Number(data?.auto_fixable ?? 0),
        not_fixable: Number(data?.not_fixable ?? 0),
        candidates: normalizeCandidates(data?.candidates),
    }
}

function normalizeCandidates(value?: ProductionChronologyCandidate[] | null) {
    return Array.isArray(value) ? value : []
}

function normalizeRows(value?: ProductionChronologyCandidate["rows"] | null) {
    return Array.isArray(value) ? value : []
}

function normalizeFixRows(value?: ProductionChronologyFixResult["rows"] | null) {
    return Array.isArray(value) ? value : []
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
    return (
        <div className="rounded-md border px-3 py-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className={tone === "bad" ? "text-lg font-semibold text-rose-600" : tone === "good" ? "text-lg font-semibold text-emerald-600" : "text-lg font-semibold"}>
                {formatNumber(value)}
            </div>
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
