import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, Search, Wrench } from "lucide-react"

import { getMyPermissions } from "@/api/auth/permission"
import {
    applyLegacyConversionLots,
    scanLegacyConversionLots,
    type LegacyConversionLotCandidate,
    type LegacyConversionLotScanResult,
} from "@/api/inventory/legacy-conversion-lot-merge-tool"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type LegacyConversionLotMergeToolProps = {
    trigger?: (open: () => void) => ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideTrigger?: boolean
}

export function LegacyConversionLotMergeTool({
    trigger,
    open,
    onOpenChange,
    hideTrigger = false,
}: LegacyConversionLotMergeToolProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const allowed = permissions.some(
        (permission) => permission.module === "inventory.ledgers" && permission.action === "correction.change",
    )

    if (!allowed) return null

    const dialogOpen = open ?? internalOpen
    const setDialogOpen = onOpenChange ?? setInternalOpen
    const openTool = () => setDialogOpen(true)

    return (
        <>
            {!hideTrigger ? (
                trigger ? (
                    trigger(openTool)
                ) : (
                    <Button size="sm" variant="outline" onClick={openTool}>
                        <Wrench className="mr-2 h-4 w-4 text-amber-600" />
                        Sửa lô chuyển mã cũ
                    </Button>
                )
            ) : null}
            <LegacyConversionLotMergeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    )
}

function LegacyConversionLotMergeDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [fromDate, setFromDate] = useState("2026-04-01")
    const [toDate, setToDate] = useState(todayValue())
    const [keyword, setKeyword] = useState("")
    const [result, setResult] = useState<LegacyConversionLotScanResult | null>(null)
    const [selected, setSelected] = useState<number[]>([])
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const safeIds = useMemo(
        () => (result?.items || []).filter((item) => item.status === "SAFE").map((item) => item.ledger_id),
        [result],
    )

    const scanMutation = useMutation({
        mutationFn: () => scanLegacyConversionLots({ fromDate, toDate, keyword: keyword.trim() || undefined }),
        onSuccess: (data) => {
            setResult(data)
            setSelected(data.items.filter((item) => item.status === "SAFE").map((item) => item.ledger_id))
            setMessage(null)
        },
        onError: (error: any) => {
            setResult(null)
            setSelected([])
            setMessage({ type: "error", text: error?.message || "Không kiểm tra được dữ liệu lô." })
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyLegacyConversionLots(selected),
        onSuccess: async (data) => {
            setMessage({ type: "success", text: data.message || `Đã sửa ${data.fixed} lô.` })
            const refreshed = await scanLegacyConversionLots({ fromDate, toDate, keyword: keyword.trim() || undefined })
            setResult(refreshed)
            setSelected(refreshed.items.filter((item) => item.status === "SAFE").map((item) => item.ledger_id))
        },
        onError: (error: any) => {
            setMessage({
                type: "error",
                text: error?.message || "Chạy sửa thất bại. Toàn bộ thay đổi đã được rollback.",
            })
        },
    })

    const busy = scanMutation.isPending || applyMutation.isPending
    const allSafeSelected = safeIds.length > 0 && safeIds.every((id) => selected.includes(id))

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
            <DialogContent
                className="flex max-h-[94vh] flex-col overflow-hidden p-0"
                style={{ width: "min(1500px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>Gộp lô chuyển mã cũ</DialogTitle>
                    <DialogDescription>
                        Tìm các lô thành phẩm dạng mã hàng-ngày do luồng Nhập kho khác - chuyển mã cũ và gộp toàn bộ lịch sử vào lô mã hàng-TP.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-4">
                    <div className="grid shrink-0 gap-3 pt-4 md:grid-cols-[180px_180px_minmax(260px,1fr)_auto_auto]">
                        <Field label="Từ ngày">
                            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                        </Field>
                        <Field label="Đến ngày">
                            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                        </Field>
                        <Field label="Tìm kiếm">
                            <Input
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Mã hàng, tên hàng, kho, số lô"
                                onKeyDown={(event) => event.key === "Enter" && !busy && scanMutation.mutate()}
                            />
                        </Field>
                        <Button variant="outline" className="self-end" disabled={busy} onClick={() => scanMutation.mutate()}>
                            {scanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Kiểm tra
                        </Button>
                        <Button
                            className="self-end"
                            disabled={busy || selected.length === 0}
                            onClick={() => applyMutation.mutate()}
                        >
                            {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                            Chạy sửa ({selected.length})
                        </Button>
                    </div>

                    {message ? (
                        <div className={cn(
                            "flex shrink-0 items-start gap-2 rounded-md border px-3 py-2 text-sm",
                            message.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-700",
                        )}>
                            {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                            <span>{message.text}</span>
                        </div>
                    ) : null}

                    {result ? (
                        <>
                            <div className="grid shrink-0 gap-3 sm:grid-cols-3">
                                <Summary label="Lô nghi vấn" value={result.total} />
                                <Summary label="An toàn để gộp" value={result.safe} tone="safe" />
                                <Summary label="Cần kiểm tra" value={result.review} tone="warning" />
                            </div>
                            <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                                <table className="min-w-[1400px] w-full border-collapse text-sm">
                                    <thead className="sticky top-0 z-10 bg-muted/95 text-muted-foreground">
                                        <tr className="border-b">
                                            <th className="w-12 px-3 py-2 text-center">
                                                <Checkbox
                                                    checked={allSafeSelected}
                                                    disabled={safeIds.length === 0 || busy}
                                                    onCheckedChange={(checked) => setSelected(checked === true ? safeIds : [])}
                                                />
                                            </th>
                                            <Header>Hàng hóa</Header>
                                            <Header>Kho</Header>
                                            <Header>Lô sai</Header>
                                            <Header>Lô chuẩn</Header>
                                            <Header align="right">Nhập</Header>
                                            <Header align="right">Xuất</Header>
                                            <Header align="right">Tồn sau gộp</Header>
                                            <Header align="center">Dòng sổ</Header>
                                            <Header align="center">Tham chiếu</Header>
                                            <Header align="center">Chi phí</Header>
                                            <Header>Trạng thái</Header>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.items.length === 0 ? (
                                            <tr><td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">{result.message}</td></tr>
                                        ) : result.items.map((item) => (
                                            <CandidateRow
                                                key={`${item.product_id}-${item.warehouse_id}-${item.old_lot_no}`}
                                                item={item}
                                                checked={selected.includes(item.ledger_id)}
                                                busy={busy}
                                                onChecked={(checked) => setSelected((current) => checked
                                                    ? Array.from(new Set([...current, item.ledger_id]))
                                                    : current.filter((id) => id !== item.ledger_id))}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-52 flex-1 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                            Chọn khoảng thời gian và bấm Kiểm tra để quét dữ liệu.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function CandidateRow({ item, checked, busy, onChecked }: {
    item: LegacyConversionLotCandidate
    checked: boolean
    busy: boolean
    onChecked: (checked: boolean) => void
}) {
    const safe = item.status === "SAFE"
    return (
        <tr className={cn("border-b align-top", !safe && "bg-red-50/60")}>
            <td className="px-3 py-2 text-center">
                <Checkbox checked={checked} disabled={!safe || busy} onCheckedChange={(value) => onChecked(value === true)} />
            </td>
            <td className="px-3 py-2"><div className="font-medium">{item.product_name}</div><div className="text-xs text-muted-foreground">{item.product_code}</div></td>
            <td className="px-3 py-2"><div>{item.warehouse_name}</div><div className="text-xs text-muted-foreground">{item.warehouse_code}</div></td>
            <td className="px-3 py-2 font-mono text-xs">{item.old_lot_no}</td>
            <td className="px-3 py-2 font-mono text-xs">{item.target_lot_no}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(item.inbound_quantity)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(item.outbound_quantity)}</td>
            <td className="px-3 py-2 text-right font-medium tabular-nums">{formatNumber(item.merged_remaining)}</td>
            <td className="px-3 py-2 text-center">{item.ledger_rows}</td>
            <td className="px-3 py-2 text-center">{item.reference_rows}</td>
            <td className="px-3 py-2 text-center">{item.cost_rows}</td>
            <td className="max-w-[320px] px-3 py-2">
                <div className={cn("font-medium", safe ? "text-emerald-700" : "text-red-700")}>{item.status_label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.reason}</div>
            </td>
        </tr>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="grid gap-1 text-sm"><span className="font-medium">{label}</span>{children}</label>
}

function Summary({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "safe" | "warning" }) {
    return (
        <div className={cn(
            "rounded-md border px-4 py-3",
            tone === "safe" && "border-emerald-200 bg-emerald-50",
            tone === "warning" && "border-amber-200 bg-amber-50",
        )}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
        </div>
    )
}

function Header({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
    return <th className={cn("whitespace-nowrap px-3 py-2 font-medium", align === "right" && "text-right", align === "center" && "text-center")}>{children}</th>
}

function todayValue() {
    const date = new Date()
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    return local.toISOString().slice(0, 10)
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(Number(value || 0))
}
