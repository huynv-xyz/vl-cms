import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    RotateCcw,
    Search,
    ShieldAlert,
} from "lucide-react"

import {
    rollbackSalesExportInventory,
    searchSalesExportInventoryRollback,
    type RollbackToolCandidate,
    type RollbackToolRollbackResult,
    type RollbackToolSearchResult,
} from "@/api/sales-export-inventory-rollback-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const DEFAULT_CUTOFF_DATE = "2026-06-29"

export default function SalesExportInventoryRollbackToolPage() {
    const [cutoffDate, setCutoffDate] = useState(DEFAULT_CUTOFF_DATE)
    const [searchResult, setSearchResult] = useState<RollbackToolSearchResult>()
    const [rollbackResult, setRollbackResult] = useState<RollbackToolRollbackResult>()
    const [selected, setSelected] = useState<number[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isRollingBack, setIsRollingBack] = useState(false)

    const selectedCandidates = useMemo(() => {
        const ids = new Set(selected)
        return searchResult?.candidates.filter((candidate) => candidate.voucher_id && ids.has(candidate.voucher_id)) ?? []
    }, [searchResult?.candidates, selected])

    const allVisibleIds = useMemo(
        () => searchResult?.candidates.map((candidate) => candidate.voucher_id).filter(Boolean) as number[] ?? [],
        [searchResult?.candidates]
    )

    const allChecked = allVisibleIds.length > 0 && selected.length === allVisibleIds.length

    const handleSearch = async () => {
        try {
            setIsSearching(true)
            setRollbackResult(undefined)
            setSelected([])
            const data = await refreshCandidates()
            if (data.candidate_count > 0) {
                toast.success(`Tìm thấy ${formatNumber(data.candidate_count)} phiếu nghi ghi kho trùng`)
            } else {
                toast.info("Không tìm thấy phiếu nghi ghi kho trùng")
            }
        } catch (error: any) {
            toast.error(error?.message || "Tìm dữ liệu thất bại")
        } finally {
            setIsSearching(false)
        }
    }

    const refreshCandidates = async () => {
        const data = await searchSalesExportInventoryRollback({ cutoff_date: cutoffDate })
        setSearchResult(data)
        return data
    }

    const toggleAll = (checked: boolean) => {
        setSelected(checked ? allVisibleIds : [])
    }

    const toggleOne = (id: number, checked: boolean) => {
        setSelected((prev) => {
            if (checked) {
                return prev.includes(id) ? prev : [...prev, id]
            }
            return prev.filter((item) => item !== id)
        })
    }

    const handleRollback = async () => {
        if (!selected.length) {
            toast.error("Chưa chọn phiếu kho cần rollback")
            return
        }

        const names = selectedCandidates.map((candidate) => candidate.voucher_no || `#${candidate.voucher_id}`).join(", ")
        const confirmed = window.confirm(
            `Rollback phần kho của ${selected.length} phiếu đã chọn?\n\n${names}\n\nThao tác sẽ hoàn tồn kho/lô/cost layer, xóa ledger kho và xóa voucher kho sinh trùng. Không thay đổi phiếu xuất, công nợ hoặc dữ liệu bán hàng.`
        )
        if (!confirmed) return

        try {
            setIsRollingBack(true)
            const data = await rollbackSalesExportInventory({
                cutoff_date: cutoffDate,
                voucher_ids: selected,
            })
            setRollbackResult(data)
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.warning(data.message)
            }
            setSelected([])
            await refreshCandidates()
        } catch (error: any) {
            toast.error(error?.message || "Rollback kho thất bại")
        } finally {
            setIsRollingBack(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Tool rollback kho phiếu xuất</h2>
                        <Badge variant="destructive">Tool tạm</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Rà phiếu kho mới sinh từ phiếu xuất đã bị ghi kho trùng với dữ liệu tồn cũ/import.
                    </p>
                </div>
                <Button variant="outline" onClick={handleSearch} disabled={isSearching || isRollingBack}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Tìm phiếu nghi trùng
                </Button>
            </div>

            <Card>
                <CardContent className="pt-4">
                    <div className="grid gap-3 lg:grid-cols-[260px_1fr_auto] lg:items-end">
                        <div className="space-y-2">
                            <Label>Ngày chốt dữ liệu kho cũ</Label>
                            <Input
                                type="date"
                                value={cutoffDate}
                                onChange={(event) => {
                                    setCutoffDate(event.target.value || DEFAULT_CUTOFF_DATE)
                                    setSearchResult(undefined)
                                    setRollbackResult(undefined)
                                    setSelected([])
                                }}
                            />
                        </div>
                        <div className="text-muted-foreground rounded-md border bg-muted/30 px-3 py-2 text-sm">
                            Tool match theo cùng <b>sản phẩm + kho + số lượng</b>. Dòng cũ lấy từ
                            <span className="font-mono"> inventory_ledger</span> chưa có voucher, trước hoặc bằng ngày chốt.
                            Dòng mới lấy từ <span className="font-mono">inventory_vouchers</span> đã POSTED do phiếu xuất bán hàng sinh ra.
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleRollback}
                            disabled={!selected.length || isRollingBack || isSearching}
                        >
                            {isRollingBack ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            Rollback đã chọn ({selected.length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {searchResult && (
                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard label="Doc cũ đã quét" value={searchResult.old_doc_count} />
                    <SummaryCard label="Voucher mới đã quét" value={searchResult.new_voucher_count} />
                    <SummaryCard label="Nghi trùng" value={searchResult.candidate_count} tone="amber" />
                    <SummaryCard label="Cần kiểm tra kỹ" value={searchResult.ambiguous_count} tone="red" />
                    <SummaryCard label="Tổng SL nghi trùng" value={formatNumber(searchResult.total_qty)} tone="teal" />
                </div>
            )}

            {searchResult && (
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            Danh sách phiếu nghi ghi kho trùng
                            <Badge variant="secondary">{formatNumber(searchResult.candidate_count)} phiếu</Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={allChecked}
                                onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                                disabled={!allVisibleIds.length}
                            />
                            <span>Chọn tất cả</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {searchResult.candidates.length ? (
                            searchResult.candidates.map((candidate) => (
                                <CandidateCard
                                    key={candidate.voucher_id}
                                    candidate={candidate}
                                    checked={Boolean(candidate.voucher_id && selected.includes(candidate.voucher_id))}
                                    onCheckedChange={(checked) => {
                                        if (candidate.voucher_id) toggleOne(candidate.voucher_id, checked)
                                    }}
                                />
                            ))
                        ) : (
                            <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center">
                                Chưa có phiếu nghi trùng theo điều kiện hiện tại.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {rollbackResult && <RollbackResultPanel result={rollbackResult} />}
        </Main>
    )
}

function CandidateCard({
    candidate,
    checked,
    onCheckedChange,
}: {
    candidate: RollbackToolCandidate
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <div className="grid gap-3 bg-muted/30 p-3 lg:grid-cols-[32px_1fr_1fr_180px] lg:items-start">
                <div className="pt-1">
                    <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">Phiếu cũ / dữ liệu kho đã có</div>
                        {candidate.ambiguous && (
                            <Badge variant="destructive" className="gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                Có nhiều match
                            </Badge>
                        )}
                    </div>
                    <div className="space-y-1 text-sm">
                        {candidate.old_docs.map((doc) => (
                            <div key={doc.doc_no} className="rounded-md border bg-background px-2 py-1">
                                <span className="font-mono font-semibold">{doc.doc_no || "-"}</span>
                                <span className="text-muted-foreground ml-2">
                                    {formatDate(doc.old_from_date)}
                                    {doc.old_to_date && doc.old_to_date !== doc.old_from_date ? ` - ${formatDate(doc.old_to_date)}` : ""}
                                </span>
                                <span className="ml-2">SL {formatNumber(doc.total_qty)}</span>
                                <span className="text-muted-foreground ml-2">{doc.line_count ?? 0} dòng</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="font-semibold">Phiếu mới / cần rollback kho</div>
                    <div className="rounded-md border bg-background p-2 text-sm">
                        <div>
                            Voucher: <span className="font-mono font-semibold">{candidate.voucher_no || `#${candidate.voucher_id}`}</span>
                            <Badge className="ml-2" variant="secondary">{candidate.voucher_status}</Badge>
                        </div>
                        <div>
                            Phiếu xuất: <span className="font-mono font-semibold">{candidate.export_no || "-"}</span>
                            <span className="text-muted-foreground ml-2">{formatDate(candidate.export_date)}</span>
                        </div>
                        <div>Đơn hàng: <span className="font-mono">{candidate.order_no || "-"}</span></div>
                        <div>
                            Khách hàng: <span className="font-semibold">{candidate.customer_name || "-"}</span>
                            {candidate.customer_code && <span className="text-muted-foreground ml-1">({candidate.customer_code})</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-1">
                    <SmallStat label="SL cũ" value={formatNumber(candidate.old_total_qty)} />
                    <SmallStat label="SL mới" value={formatNumber(candidate.new_total_qty)} />
                    <SmallStat label="Line cũ / mới" value={`${candidate.old_line_count} / ${candidate.new_line_count}`} />
                    <SmallStat label="Match cũ / mới" value={`${candidate.old_match_count} / ${candidate.new_match_count}`} />
                </div>
            </div>

            <details className="border-t">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    Chi tiết sản phẩm, kho và số lượng
                </summary>
                <div className="overflow-x-auto px-3 pb-3">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="border px-2 py-2 text-center">Mã hàng</th>
                                <th className="border px-2 py-2 text-left">Tên hàng</th>
                                <th className="border px-2 py-2 text-center">Mã kho</th>
                                <th className="border px-2 py-2 text-left">Kho</th>
                                <th className="border px-2 py-2 text-right">SL cũ</th>
                                <th className="border px-2 py-2 text-right">SL mới</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidate.lines.map((line, index) => (
                                <tr key={`${line.product_id}-${line.warehouse_id}-${index}`}>
                                    <td className="border px-2 py-2 text-center font-mono">{line.product_code || "-"}</td>
                                    <td className="border px-2 py-2">{line.product_name || "-"}</td>
                                    <td className="border px-2 py-2 text-center font-mono">{line.warehouse_code || "-"}</td>
                                    <td className="border px-2 py-2">{line.warehouse_name || "-"}</td>
                                    <td className="border px-2 py-2 text-right font-semibold">{formatNumber(line.old_qty)}</td>
                                    <td className="border px-2 py-2 text-right font-semibold">{formatNumber(line.new_qty)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    )
}

function RollbackResultPanel({ result }: { result: RollbackToolRollbackResult }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Kết quả rollback
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={result.success ? "text-emerald-700" : "text-amber-700"}>{result.message}</div>
                <Separator />
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left">Voucher</th>
                                <th className="px-3 py-2 text-left">Phiếu xuất</th>
                                <th className="px-3 py-2 text-center">Trạng thái</th>
                                <th className="px-3 py-2 text-left">Kết quả</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((row, index) => (
                                <tr key={`${row.voucher_id}-${index}`} className="border-t">
                                    <td className="px-3 py-2 font-mono">{row.voucher_no || `#${row.voucher_id}`}</td>
                                    <td className="px-3 py-2 font-mono">{row.export_no || "-"}</td>
                                    <td className="px-3 py-2 text-center">
                                        <Badge variant={row.success ? "default" : "destructive"}>
                                            {row.success ? "Thành công" : "Lỗi"}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2">{row.message || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string
    value: string | number
    tone?: "amber" | "red" | "teal"
}) {
    const toneClass =
        tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : tone === "red"
              ? "border-red-200 bg-red-50 text-red-700"
              : tone === "teal"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-900"

    return (
        <div className={`rounded-lg border p-3 shadow-sm ${toneClass}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">{label}</div>
            <div className="mt-1 text-right text-xl font-bold">{value}</div>
        </div>
    )
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md border bg-background p-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="text-right font-semibold">{value}</div>
        </div>
    )
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const [year, month, day] = String(value).substring(0, 10).split("-")
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

function formatNumber(value?: number | string | null) {
    const numberValue = Number(value ?? 0)
    if (!Number.isFinite(numberValue)) return "0"
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 6,
    }).format(numberValue)
}
