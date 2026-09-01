import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, RefreshCcw, SearchCheck } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import {
    applyCustomerHistoricalSync,
    applyCustomerHistoricalSyncMappings,
    checkCustomerHistoricalSync,
    getCustomer,
    listCustomers,
    type CustomerHistoricalSyncCheckResult,
    type CustomerHistoricalSyncSample,
    type CustomerHistoricalSyncTable,
    type CustomerUnknownCodeGroup,
} from "@/api/customer"
import { Button } from "@/components/ui/button"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { formatNumber } from "@/lib/utils"

export function CustomerHistoricalSyncButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [mappingOpen, setMappingOpen] = useState(false)
    const [result, setResult] = useState<CustomerHistoricalSyncCheckResult | null>(null)
    const [mappings, setMappings] = useState<Record<string, number | undefined>>({})

    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })

    const canUse = useMemo(
        () => hasPermission(permissions, "customers", "data-admin"),
        [permissions],
    )

    const checkMutation = useMutation({
        mutationFn: checkCustomerHistoricalSync,
        onSuccess: (data) => {
            setResult(data)
            setMappings({})
            setOpen(true)
            if (data.total_issue_count > 0) {
                toast.warning(`Có ${formatNumber(data.total_issue_count)} dòng dữ liệu khách hàng chưa đồng bộ`)
            } else {
                toast.success("Dữ liệu khách hàng đang đồng bộ")
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không kiểm tra được dữ liệu khách hàng")
        },
    })

    const applyMutation = useMutation({
        mutationFn: applyCustomerHistoricalSync,
        onSuccess: async (data) => {
            setResult(data.remaining)
            await queryClient.invalidateQueries({ queryKey: ["customer"] })
            await queryClient.invalidateQueries({ queryKey: ["customer-summary"] })
            const updated = Object.values(data.updated ?? {}).reduce((sum, value) => sum + Number(value || 0), 0)
            toast.success(`Đã đồng bộ ${formatNumber(updated)} dòng dữ liệu khách hàng`)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Đồng bộ dữ liệu khách hàng thất bại")
        },
    })

    const mappingMutation = useMutation({
        mutationFn: () => applyCustomerHistoricalSyncMappings(
            Object.entries(mappings)
                .filter((entry): entry is [string, number] => Boolean(entry[0]) && typeof entry[1] === "number")
                .map(([oldCode, customerId]) => ({ old_code: oldCode, customer_id: customerId })),
        ),
        onSuccess: async (data) => {
            setResult(data.remaining)
            setMappings({})
            setMappingOpen(false)
            await queryClient.invalidateQueries({ queryKey: ["customer"] })
            await queryClient.invalidateQueries({ queryKey: ["customer-summary"] })
            const updated = Object.values(data.updated ?? {}).reduce((sum, value) => sum + Number(value || 0), 0)
            toast.success(`Đã áp dụng mapping cho ${formatNumber(updated)} dòng dữ liệu khách hàng`)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Áp dụng mapping khách hàng thất bại")
        },
    })

    if (!canUse) return null

    const busy = checkMutation.isPending || applyMutation.isPending || mappingMutation.isPending
    const syncableCount = result?.syncable_count ?? 0
    const mappedCount = Object.values(mappings).filter((value) => typeof value === "number").length

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => checkMutation.mutate()}
            >
                {checkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <SearchCheck className="h-4 w-4" />
                )}
                Kiểm tra đồng bộ
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1180px,calc(100vw-2rem))] max-w-[min(1180px,calc(100vw-2rem))] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-2rem))]">
                    <DialogHeader>
                        <DialogTitle>Kiểm tra đồng bộ khách hàng</DialogTitle>
                        <DialogDescription>
                            Đối chiếu mã và tên khách hàng trong các bảng phát sinh với danh mục khách hàng hiện tại.
                        </DialogDescription>
                    </DialogHeader>

                    {result ? (
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                            <div className="grid gap-2 md:grid-cols-3">
                                <Metric label="Có thể đồng bộ" value={result.syncable_count} tone={result.syncable_count ? "warn" : "good"} />
                                <Metric label="Mã không còn trong danh mục" value={result.unknown_code_count} tone={result.unknown_code_count ? "warn" : "neutral"} />
                                <Metric label="Tổng vấn đề" value={result.total_issue_count} tone={result.total_issue_count ? "warn" : "good"} />
                            </div>

                            {result.total_issue_count === 0 ? (
                                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Không phát hiện dòng lệch mã/tên khách hàng.
                                </div>
                            ) : null}

                            {result.unknown_code_count > 0 ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    <div className="flex min-w-0 items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                            Có mã khách không còn tồn tại trong danh mục. Mở mapping thủ công để chọn khách hàng đúng cho từng mã cũ.
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() => setMappingOpen(true)}
                                    >
                                        Mapping thủ công
                                    </Button>
                                </div>
                            ) : null}

                            <div className="max-h-[min(420px,calc(100vh-22rem))] overflow-auto rounded-md border">
                                <table className="w-full min-w-[1060px] text-sm">
                                    <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600">
                                        <tr>
                                            <th className="border-b px-3 py-2 text-left">Bảng</th>
                                            <th className="border-b px-3 py-2 text-right">Có thể sync</th>
                                            <th className="border-b px-3 py-2 text-right">Mã lạ</th>
                                            <th className="border-b px-3 py-2 text-left">Mẫu dữ liệu lệch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.tables.map((table) => (
                                            <TableIssueRow key={table.table} table={table} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                            Đóng
                        </Button>
                        <Button
                            type="button"
                            disabled={busy || syncableCount === 0}
                            onClick={() => applyMutation.mutate()}
                        >
                            {applyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Đồng bộ dữ liệu cũ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ManualMappingDialog
                open={mappingOpen}
                onOpenChange={setMappingOpen}
                codes={result?.unknown_codes ?? []}
                mappings={mappings}
                disabled={busy}
                mappedCount={mappedCount}
                isApplying={mappingMutation.isPending}
                onChange={(oldCode, customerId) =>
                    setMappings((current) => ({
                        ...current,
                        [oldCode]: customerId,
                    }))
                }
                onApply={() => mappingMutation.mutate()}
            />
        </>
    )
}

function ManualMappingDialog({
    open,
    onOpenChange,
    codes,
    mappings,
    disabled,
    mappedCount,
    isApplying,
    onChange,
    onApply,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    codes: CustomerUnknownCodeGroup[]
    mappings: Record<string, number | undefined>
    disabled?: boolean
    mappedCount: number
    isApplying: boolean
    onChange: (oldCode: string, customerId: number | undefined) => void
    onApply: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1180px,calc(100vw-2rem))] max-w-[min(1180px,calc(100vw-2rem))] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-2rem))]">
                <DialogHeader>
                    <DialogTitle>Mapping thủ công</DialogTitle>
                    <DialogDescription>
                        Chọn khách hàng đúng để đổi mã cũ trong dữ liệu phát sinh sang mã/tên hiện tại.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    <div className="text-xs text-muted-foreground">
                        Đang hiển thị {formatNumber(codes.length)} mã cũ cần gán lại khách hàng đúng.
                    </div>

                    <div className="max-h-[calc(100vh-15rem)] overflow-auto rounded-md border">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600">
                                <tr>
                                    <th className="border-b px-3 py-2 text-left">Mã cũ</th>
                                    <th className="border-b px-3 py-2 text-left">Tên đang lưu</th>
                                    <th className="border-b px-3 py-2 text-left">Bảng liên quan</th>
                                    <th className="border-b px-3 py-2 text-right">Số dòng</th>
                                    <th className="border-b px-3 py-2 text-left">Khách hàng đúng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.map((item) => (
                                    <tr key={item.customer_code} className="border-b align-top last:border-b-0">
                                        <td className="px-3 py-3 font-mono text-xs">{item.customer_code}</td>
                                        <td className="max-w-[260px] px-3 py-3 text-xs">
                                            <span className="line-clamp-3">{item.current_names || "-"}</span>
                                        </td>
                                        <td className="max-w-[240px] px-3 py-3 font-mono text-xs text-muted-foreground">
                                            <span className="line-clamp-3">{item.tables}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono">{formatNumber(item.row_count)}</td>
                                        <td className="w-[320px] px-3 py-3">
                                            <AsyncSelect
                                                value={mappings[item.customer_code]}
                                                onChange={(value: number | undefined) => onChange(item.customer_code, value)}
                                                placeholder="Chọn khách hàng"
                                                searchPlaceholder="Tìm mã hoặc tên khách..."
                                                disabled={disabled}
                                                dataSource={{
                                                    getList: listCustomers,
                                                    getById: getCustomer,
                                                    params: { page: 1, size: 20, keyword_scope: "code_name" },
                                                }}
                                                mapOption={(customer: { id: number; code?: string; name: string }) => ({
                                                    value: customer.id,
                                                    label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
                                                })}
                                                popoverContentClassName="w-[420px]"
                                                optionWrapLabel
                                                wrapLabel
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={disabled} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        disabled={disabled || mappedCount === 0}
                        onClick={onApply}
                    >
                        {isApplying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="h-4 w-4" />
                        )}
                        Áp dụng mapping
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function TableIssueRow({ table }: { table: CustomerHistoricalSyncTable }) {
    const visibleSamples = [...table.samples, ...table.unknown_samples].slice(0, 4)

    return (
        <tr className="border-b align-top last:border-b-0">
            <td className="px-3 py-3">
                <div className="font-medium">{table.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{table.table}</div>
            </td>
            <td className="px-3 py-3 text-right font-mono">{formatNumber(table.syncable_count)}</td>
            <td className="px-3 py-3 text-right font-mono">{formatNumber(table.unknown_code_count)}</td>
            <td className="px-3 py-3">
                {visibleSamples.length ? (
                    <div className="space-y-2">
                        {visibleSamples.map((sample) => (
                            <SampleLine key={`${table.table}-${sample.record_id}-${sample.customer_code ?? ""}`} sample={sample} />
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground">Không có dòng lệch</span>
                )}
            </td>
        </tr>
    )
}

function SampleLine({ sample }: { sample: CustomerHistoricalSyncSample }) {
    return (
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground">#{sample.record_id}</span>
                <span className="font-mono text-xs">{sample.customer_code || "Không có mã"}</span>
            </div>
            <div className="mt-1 grid gap-1 text-xs md:grid-cols-2">
                <span>
                    Hiện tại: <span className="font-medium">{sample.current_name || "-"}</span>
                </span>
                <span>
                    Đúng: <span className="font-medium text-emerald-700">{sample.expected_name || "Không tìm thấy khách hàng"}</span>
                </span>
            </div>
        </div>
    )
}

function Metric({
    label,
    value,
    tone = "neutral",
}: {
    label: string
    value: number
    tone?: "neutral" | "good" | "warn"
}) {
    const toneClass = {
        neutral: "border-slate-200 bg-slate-50 text-slate-700",
        good: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warn: "border-amber-200 bg-amber-50 text-amber-800",
    }[tone]

    return (
        <div className={`rounded-md border p-3 ${toneClass}`}>
            <div className="text-xs font-medium uppercase">{label}</div>
            <div className="mt-1 text-right text-lg font-semibold tabular-nums">{formatNumber(value)}</div>
        </div>
    )
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) =>
        (permission.module === module && permission.action === action)
        || permission.module === "*"
        || permission.action === "*",
    )
}
