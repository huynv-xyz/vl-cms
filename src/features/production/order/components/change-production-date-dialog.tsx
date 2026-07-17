import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Info,
    Loader2,
} from "lucide-react"

import {
    changeProductionDate,
    checkProductionDateChange,
    type ProductionDateChangeDetail,
    type ProductionDateChangeResult,
} from "@/api/production/order"
import { DatePicker } from "@/components/date-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Production } from "../data/schema"

type Props = {
    production?: Production
    open: boolean
    onOpenChange: (open: boolean) => void
}

type SummaryRow = {
    label: string
    status: string
    detail: string
}

type ResultPanel = {
    type: "info" | "success" | "error" | "loading"
    title: string
    message?: string
    summaryRows?: SummaryRow[]
    conflictRows?: ProductionDateChangeDetail[]
}

const currentTime = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const normalizeTime = (value?: string) => (value ? value.slice(0, 5) : currentTime())

export function ChangeProductionDateDialog({
    production,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState(currentTime())
    const [checkResult, setCheckResult] = useState<ProductionDateChangeResult | null>(null)
    const [checkedTime, setCheckedTime] = useState("")
    const [resultPanel, setResultPanel] = useState<ResultPanel>(initialPanel())
    const [applied, setApplied] = useState(false)

    useEffect(() => {
        if (open && production) {
            setNewDate(production.production_date || "")
            setNewTime(normalizeTime(production.production_time))
            setCheckResult(null)
            setCheckedTime("")
            setResultPanel(initialPanel())
            setApplied(false)
        }
    }, [open, production])

    const today = useMemo(() => {
        const value = new Date()
        value.setHours(23, 59, 59, 999)
        return value
    }, [])

    const validationMessage = validateDate(
        newDate,
        production?.production_date,
        newTime,
        production?.production_time
    )

    const checkMutation = useMutation({
        mutationFn: () =>
            checkProductionDateChange(Number(production?.id), {
                production_date: newDate,
                production_time: newTime || undefined,
            }),
        onMutate: () => {
            setResultPanel({
                type: "loading",
                title: "Đang kiểm tra ngày mới",
                message: "Hệ thống đang mô phỏng FIFO, phiếu xuất nguyên liệu và phiếu nhập thành phẩm theo ngày mới.",
            })
        },
        onSuccess: (result) => {
            setCheckResult(result.success ? result : null)
            setCheckedTime(result.success ? newTime : "")
            setResultPanel({
                type: result.success ? "success" : "error",
                title: result.details?.length
                    ? "Đổi ngày sẽ làm lịch sử tồn kho bất hợp lý"
                    : result.message || (result.success ? "Ngày mới hợp lệ" : "Không thể đổi ngày"),
                summaryRows: buildCheckRows(result),
                conflictRows: result.details ?? [],
            })
        },
        onError: (e: any) => {
            setCheckResult(null)
            setResultPanel({
                type: "error",
                title: "Không thể đổi ngày",
                summaryRows: [
                    {
                        label: "Kiểm tra",
                        status: "Lỗi",
                        detail: e.message || "Kiểm tra ngày mới thất bại.",
                    },
                ],
            })
        },
    })

    const applyMutation = useMutation({
        mutationFn: () =>
            changeProductionDate(Number(production?.id), {
                production_date: newDate,
                production_time: newTime || undefined,
            }),
        onMutate: () => {
            setResultPanel({
                type: "loading",
                title: "Đang đổi ngày lệnh sản xuất",
                message: "Thao tác đang chạy trong một giao dịch. Nếu có lỗi, toàn bộ thay đổi sẽ rollback.",
            })
        },
        onSuccess: (result) => {
            setCheckResult(result)
            setApplied(true)
            setResultPanel({
                type: "success",
                title: "Đổi ngày thành công",
                message: result.message || "Lệnh sản xuất đã được cập nhật.",
                summaryRows: buildApplyRows(result),
            })
        },
        onError: (e: any) => {
            setResultPanel({
                type: "error",
                title: "Đổi ngày thất bại, đã rollback",
                summaryRows: [
                    {
                        label: "Đổi ngày",
                        status: "Lỗi",
                        detail: e.message || "Không thể đổi ngày lệnh sản xuất.",
                    },
                ],
            })
        },
    })

    function handleDateChange(value?: string) {
        setNewDate(value || "")
        setCheckResult(null)
        setCheckedTime("")
        setResultPanel(initialPanel())
    }

    function handleTimeChange(value: string) {
        setNewTime(value)
        setCheckResult(null)
        setCheckedTime("")
        setResultPanel(initialPanel())
    }

    function handleCheck() {
        if (validationMessage) {
            setResultPanel({
                type: "error",
                title: "Ngày mới chưa hợp lệ",
                summaryRows: [
                    {
                        label: "Ngày mới",
                        status: "Không hợp lệ",
                        detail: validationMessage,
                    },
                ],
            })
            return
        }
        checkMutation.mutate()
    }

    function handleApply() {
        if (validationMessage) {
            setResultPanel({
                type: "error",
                title: "Ngày mới chưa hợp lệ",
                summaryRows: [
                    {
                        label: "Ngày mới",
                        status: "Không hợp lệ",
                        detail: validationMessage,
                    },
                ],
            })
            return
        }
        if (!checkResult?.success || checkResult.new_date !== newDate || checkedTime !== newTime) {
            setResultPanel({
                type: "error",
                title: "Cần kiểm tra lại",
                summaryRows: [
                    {
                        label: "Điều kiện đổi ngày",
                        status: "Chưa kiểm tra",
                        detail: "Vui lòng kiểm tra ngày mới trước khi đổi thật.",
                    },
                ],
            })
            return
        }
        applyMutation.mutate()
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && applied) {
            queryClient.invalidateQueries({ queryKey: ["productions"] })
            queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            if (production?.id) {
                queryClient.invalidateQueries({ queryKey: ["production-detail", production.id] })
            }
        }
        onOpenChange(nextOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-[min(96vw,1120px)] !max-w-none flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Đổi ngày lệnh sản xuất
                    </DialogTitle>
                    <DialogDescription>
                        Kiểm tra trước, sau đó đổi ngày thật nếu hợp lệ.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
                    <div className="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <InfoItem label="Lệnh SX" value={production?.production_no || `#${production?.id}`} />
                        <InfoItem label="Trạng thái" value={production?.status || "-"} />
                        <InfoItem label="Ngày hiện tại" value={formatDate(production?.production_date)} />
                        <div className="min-w-0 space-y-2">
                            <label className="text-sm font-medium">Ngày mới</label>
                            <DatePicker
                                value={newDate}
                                onChange={handleDateChange}
                                className="min-w-0 max-w-full"
                                placeholder="Chọn ngày mới"
                                disabled={(date) => date > today}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{"Gi\u1edd m\u1edbi"}</label>
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(event) => handleTimeChange(event.target.value)}
                                />
                            </div>
                            {validationMessage && (
                                <div className="text-xs text-destructive">{validationMessage}</div>
                            )}
                        </div>
                    </div>

                    <ResultBox panel={resultPanel} />
                </div>

                <DialogFooter className="shrink-0 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={checkMutation.isPending || applyMutation.isPending}
                    >
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCheck}
                        disabled={!!validationMessage || checkMutation.isPending || applyMutation.isPending}
                    >
                        {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        disabled={
                            !!validationMessage ||
                            applied ||
                            !checkResult?.success ||
                            checkResult.new_date !== newDate ||
                            applyMutation.isPending ||
                            checkMutation.isPending
                        }
                    >
                        {applyMutation.isPending ? "Đang đổi..." : "Đổi ngày"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ResultBox({ panel }: { panel: ResultPanel }) {
    const Icon =
        panel.type === "success"
            ? CheckCircle2
            : panel.type === "error"
                ? AlertCircle
                : panel.type === "loading"
                    ? Loader2
                    : Info

    return (
        <div
            className={cn(
                "max-w-full overflow-hidden rounded-md border p-4",
                panel.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                panel.type === "error" && "border-red-200 bg-red-50 text-red-950",
                panel.type === "loading" && "border-amber-200 bg-amber-50 text-amber-950",
                panel.type === "info" && "border-slate-200 bg-slate-50 text-slate-950",
            )}
        >
            <div className="flex min-w-0 items-start gap-3">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", panel.type === "loading" && "animate-spin")} />
                <div className="min-w-0 flex-1 space-y-3 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{panel.title}</div>
                        <Badge variant="outline" className="bg-background/60">
                            {panelLabel(panel.type)}
                        </Badge>
                    </div>
                    {panel.message && (
                        <div className="text-sm leading-relaxed">{panel.message}</div>
                    )}
                    {!!panel.summaryRows?.length && <SummaryTable rows={panel.summaryRows} />}
                    {!!panel.conflictRows?.length && <ConflictTable rows={panel.conflictRows} />}
                </div>
            </div>
        </div>
    )
}

function SummaryTable({ rows }: { rows: SummaryRow[] }) {
    return (
        <div className="max-w-full overflow-x-auto rounded-md border border-current/10 bg-background/70">
            <table className="w-full min-w-[640px] table-fixed text-sm">
                <colgroup>
                    <col className="w-[170px]" />
                    <col className="w-[150px]" />
                    <col />
                </colgroup>
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium">Hạng mục</th>
                        <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                        <th className="px-3 py-2 text-left font-medium">Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={`${row.label}-${index}`} className="border-t border-current/10">
                            <td className="px-3 py-2 align-top font-medium">{row.label}</td>
                            <td className="px-3 py-2 align-top">{row.status}</td>
                            <td className="px-3 py-2 align-top">{row.detail}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ConflictTable({ rows }: { rows: ProductionDateChangeDetail[] }) {
    return (
        <div className="space-y-2">
            <div className="text-sm font-semibold">Dòng tồn kho cần kiểm tra</div>
            <div className="max-w-full overflow-x-auto rounded-md border border-current/10 bg-background/70">
                <table className="w-full min-w-[1180px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-[170px]" />
                        <col className="w-[170px]" />
                        <col className="w-[250px]" />
                        <col className="w-[190px]" />
                        <col className="w-[190px]" />
                        <col className="w-[100px]" />
                        <col className="w-[100px]" />
                        <col className="w-[100px]" />
                        <col className="w-[130px]" />
                    </colgroup>
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">Lỗi</th>
                            <th className="px-3 py-2 text-left font-medium">Mã hàng</th>
                            <th className="px-3 py-2 text-left font-medium">Tên hàng</th>
                            <th className="px-3 py-2 text-left font-medium">Kho</th>
                            <th className="px-3 py-2 text-left font-medium">Số lô</th>
                            <th className="px-3 py-2 text-right font-medium">Cần/Xuất</th>
                            <th className="px-3 py-2 text-right font-medium">Có/Nhập</th>
                            <th className="px-3 py-2 text-right font-medium">Tồn sau</th>
                            <th className="px-3 py-2 text-left font-medium">Ngày/CT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.product_code}-${row.lot_code}-${index}`} className="border-t border-current/10">
                                <td className="px-3 py-2 align-top font-medium">{detailTypeLabel(row)}</td>
                                <td className="px-3 py-2 align-top font-medium">{row.product_code || "-"}</td>
                                <td className="px-3 py-2 align-top">{row.product_name || "-"}</td>
                                <td className="px-3 py-2 align-top">
                                    <div>{row.warehouse_name || "-"}</div>
                                    {row.warehouse_code && (
                                        <div className="text-xs text-muted-foreground">{row.warehouse_code}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 align-top">{row.lot_code || "-"}</td>
                                <td className="px-3 py-2 text-right align-top">{formatNumber(row.required_qty ?? row.quantity_out ?? row.outbound_qty_before_new_date)}</td>
                                <td className="px-3 py-2 text-right align-top">{formatNumber(row.available_qty ?? row.quantity_in ?? row.input_qty)}</td>
                                <td className={cn("px-3 py-2 text-right align-top", Number(row.balance_after ?? 0) < 0 && "text-red-700")}>
                                    {formatNumber(row.balance_after)}
                                </td>
                                <td className="px-3 py-2 align-top">
                                    <div>{formatDate(row.negative_date ?? row.first_outbound_date)}</div>
                                    {row.voucher_no && <div className="text-xs text-muted-foreground">{row.voucher_no}</div>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function detailTypeLabel(row: ProductionDateChangeDetail) {
    switch (row.type) {
        case "MATERIAL_SHORTAGE_AT_NEW_DATE":
            return "Thiếu NVL tại ngày mới"
        case "NEGATIVE_HISTORY_AFTER_DATE_CHANGE":
            return "Âm tồn lịch sử"
        default:
            return row.message || "Không hợp lệ"
    }
}

function InfoItem({ label, value }: { label: string; value?: string }) {
    return (
        <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="truncate text-sm font-medium">{value || "-"}</div>
        </div>
    )
}

function initialPanel(): ResultPanel {
    return {
        type: "info",
        title: "Chưa kiểm tra",
        summaryRows: [
            {
                label: "Luồng xử lý",
                status: "Chờ kiểm tra",
                detail: "Chọn ngày mới rồi bấm Kiểm tra. Khi đổi thật, hệ thống cập nhật lệnh, FIFO và chứng từ liên quan trong cùng một giao dịch.",
            },
        ],
    }
}

function buildCheckRows(result: ProductionDateChangeResult): SummaryRow[] {
    const rows: SummaryRow[] = [
        {
            label: "Ngày mới",
            status: result.success ? "Hợp lệ" : "Không hợp lệ",
            detail: formatDate(result.new_date),
        },
        {
            label: "FIFO",
            status: result.fifo_reallocated ? "Sẽ chạy lại" : "Không áp dụng",
            detail: result.fifo_reallocated
                ? "FIFO sẽ được chạy lại theo ngày mới khi đổi thật."
                : "Lệnh chưa ở bước cần chạy lại FIFO.",
        },
        {
            label: "Phiếu xuất NVL",
            status: result.issue_voucher_updated ? "Sẽ cập nhật" : "Không có",
            detail: result.issue_voucher_updated
                ? "Phiếu xuất nguyên liệu sẽ được cập nhật theo ngày mới."
                : "Chưa có phiếu xuất nguyên liệu liên quan.",
        },
        {
            label: "Phiếu nhập TP",
            status: result.receive_voucher_updated ? "Sẽ cập nhật" : "Không có",
            detail: result.receive_voucher_updated
                ? "Phiếu nhập thành phẩm và ngày nhập lô TP sẽ được cập nhật theo ngày mới."
                : "Chưa có phiếu nhập thành phẩm liên quan.",
        },
    ]

    for (const warning of result.warnings ?? []) {
        rows.push({
            label: "Lưu ý",
            status: "Cảnh báo",
            detail: warning,
        })
    }
    return rows
}

function buildApplyRows(result: ProductionDateChangeResult): SummaryRow[] {
    return [
        {
            label: "Ngày lệnh",
            status: "Đã đổi",
            detail: `${formatDate(result.old_date)} -> ${formatDate(result.new_date)}`,
        },
        {
            label: "FIFO",
            status: result.fifo_reallocated ? "Đã chạy lại" : "Không áp dụng",
            detail: result.fifo_reallocated
                ? `${result.allocation_rows ?? 0} dòng phân bổ.`
                : "Lệnh chưa ở bước cần chạy lại FIFO.",
        },
        {
            label: "Phiếu xuất NVL",
            status: result.issue_voucher_updated ? "Đã cập nhật" : "Không có",
            detail: result.issue_voucher_updated
                ? "Ngày phiếu xuất nguyên liệu đã được cập nhật."
                : "Không có phiếu xuất nguyên liệu liên quan.",
        },
        {
            label: "Phiếu nhập TP",
            status: result.receive_voucher_updated ? "Đã cập nhật" : "Không có",
            detail: result.receive_voucher_updated
                ? "Ngày phiếu nhập thành phẩm và ngày nhập lô TP đã được cập nhật."
                : "Không có phiếu nhập thành phẩm liên quan.",
        },
    ]
}

function panelLabel(type: ResultPanel["type"]) {
    switch (type) {
        case "success":
            return "Hợp lệ"
        case "error":
            return "Lỗi"
        case "loading":
            return "Đang chạy"
        default:
            return "Thông tin"
    }
}

function validateDate(newDate?: string, currentDate?: string, newTime?: string, currentTimeValue?: string) {
    if (!newDate) return "Ng\u00e0y m\u1edbi l\u00e0 b\u1eaft bu\u1ed9c"
    if (currentDate && newDate === currentDate && normalizeTime(newTime) === normalizeTime(currentTimeValue)) {
        return "Ng\u00e0y gi\u1edd m\u1edbi kh\u00f4ng \u0111\u01b0\u1ee3c b\u1eb1ng ng\u00e0y gi\u1edd hi\u1ec7n t\u1ea1i c\u1ee7a l\u1ec7nh"
    }
    const date = new Date(newDate)
    if (Number.isNaN(date.getTime())) return "Ng\u00e0y m\u1edbi kh\u00f4ng h\u1ee3p l\u1ec7"
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) return "Ng\u00e0y m\u1edbi kh\u00f4ng \u0111\u01b0\u1ee3c l\u1edbn h\u01a1n ng\u00e0y hi\u1ec7n t\u1ea1i"
    return ""
}
function formatDate(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}

function formatNumber(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "-"
    const number = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(number)) return String(value)
    return number.toLocaleString("vi-VN", { maximumFractionDigits: 3 })
}
