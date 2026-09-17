import { useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FilePenLine, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getMyPermissions } from "@/api/auth/permission"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    applyTransactionUnitPriceImport,
    previewTransactionUnitPriceImport,
    type TransactionUnitPriceImportResult,
    type TransactionUnitPriceImportPreviewRow,
} from "@/api/transactions"

type Props = {
    onApplied?: () => void
}

export function UnitPriceImportUpdateButton({ onApplied }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)
    const [guideOpen, setGuideOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [result, setResult] = useState<TransactionUnitPriceImportResult | null>(null)
    const [previewing, setPreviewing] = useState(false)
    const [applying, setApplying] = useState(false)
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const allowed = permissions.some((permission) =>
        permission.module === "transactions" && permission.action === "correction.change"
    )

    if (!allowed) {
        return null
    }

    const reset = () => {
        setFile(null)
        setResult(null)
        setPreviewing(false)
        setApplying(false)
    }

    const chooseFileFromGuide = () => {
        setGuideOpen(false)
        inputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0]
        event.currentTarget.value = ""
        if (!selected) return

        setFile(selected)
        setOpen(true)
        setPreviewing(true)
        setResult(null)
        try {
            const data = await previewTransactionUnitPriceImport(selected)
            setResult(data)
        } catch (error: any) {
            toast.error(error?.message || "Không đọc được file cập nhật giá")
        } finally {
            setPreviewing(false)
        }
    }

    const handleApply = async () => {
        if (!file) return
        setApplying(true)
        try {
            const data = await applyTransactionUnitPriceImport(file)
            setResult(data)
            toast.success(data.message || "Đã cập nhật đơn giá")
            onApplied?.()
        } catch (error: any) {
            toast.error(error?.message || "Cập nhật đơn giá từ file thất bại")
        } finally {
            setApplying(false)
        }
    }

    const canApply = Boolean(
        file
        && result
        && result.updatable_count > 0
        && result.ambiguous_count === 0
        && result.invalid_count === 0
        && !result.applied
        && !previewing
        && !applying
    )
    const errorRows = result?.rows.filter((row) => row.status !== "UPDATE" && row.status !== "ALREADY_PRICED") ?? []

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => setGuideOpen(true)}>
                <FilePenLine className="size-4" />
                Cập nhật giá
            </Button>

            <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import cập nhật đơn giá theo ĐVC</DialogTitle>
                        <DialogDescription>
                            Chỉ cập nhật giao dịch import có ngày chứng từ đến 30/05/2026 và đang thiếu đơn giá. Dòng đã có giá sẽ được bỏ qua.
                        </DialogDescription>
                    </DialogHeader>
                    <ImportGuideContent />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setGuideOpen(false)}>
                            Đóng
                        </Button>
                        <Button type="button" onClick={chooseFileFromGuide}>
                            <Upload className="mr-2 h-4 w-4" />
                            Chọn file import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value)
                    if (!value) reset()
                }}
            >
                <DialogContent className="max-h-[86vh] overflow-hidden sm:max-w-[980px]">
                    <DialogHeader>
                        <DialogTitle>Import cập nhật đơn giá theo ĐVC</DialogTitle>
                        <DialogDescription>
                            Chỉ cập nhật giao dịch import có ngày chứng từ đến 30/05/2026 và đang thiếu đơn giá. Dòng đã có giá sẽ được bỏ qua.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3 text-sm">
                            <Upload className="size-4 text-muted-foreground" />
                            <span className="font-medium">{file?.name || "Chưa chọn file"}</span>
                            {previewing ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
                        </div>

                        {result ? (
                            <>
                                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                    <SummaryBox label="Tổng dòng" value={result.total_rows} />
                                    <SummaryBox label="Có thể cập nhật" value={result.updatable_count} tone="success" />
                                    <SummaryBox label="Đã có giá" value={result.already_priced_count} />
                                    <SummaryBox label="Không match" value={result.unmatched_count} tone="warning" />
                                    <SummaryBox label="Mơ hồ" value={result.ambiguous_count} tone="danger" />
                                    <SummaryBox label="Lỗi file" value={result.invalid_count} tone="danger" />
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3">
                                    <SummaryBox label="Doanh thu cũ" value={formatMoney(result.old_revenue_total)} />
                                    <SummaryBox label="Doanh thu mới" value={formatMoney(result.new_revenue_total)} />
                                    <SummaryBox label="Chênh lệch" value={formatMoney(result.revenue_delta)} tone={result.revenue_delta >= 0 ? "success" : "danger"} />
                                </div>

                                <div className="rounded-md border">
                                    <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Dòng lỗi cần kiểm tra ({errorRows.length})
                                    </div>
                                    {errorRows.length > 0 ? (
                                        <div className="max-h-[320px] overflow-auto">
                                            <table className="w-full min-w-[920px] border-collapse text-sm">
                                                <thead className="sticky top-0 bg-muted">
                                                    <tr className="border-b">
                                                        <th className="px-3 py-2 text-left">Dòng</th>
                                                        <th className="px-3 py-2 text-left">Trạng thái</th>
                                                        <th className="px-3 py-2 text-left">Chứng từ</th>
                                                        <th className="px-3 py-2 text-left">Mã KH</th>
                                                        <th className="px-3 py-2 text-left">Mã hàng</th>
                                                        <th className="px-3 py-2 text-right">SL bán</th>
                                                        <th className="px-3 py-2 text-right">SL trả</th>
                                                        <th className="px-3 py-2 text-right">Giá file</th>
                                                        <th className="px-3 py-2 text-right">DS bán file</th>
                                                        <th className="px-3 py-2 text-right">DT mới</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {errorRows.map((row, index) => (
                                                        <PreviewRow key={`${row.source_row_no}-${index}`} row={row} />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            Không có dòng lỗi trong file preview.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : previewing ? (
                            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                                Đang đọc file và đối chiếu dữ liệu...
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={applying}>
                            Đóng
                        </Button>
                        <Button type="button" onClick={handleApply} disabled={!canApply}>
                            {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Áp dụng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function ImportGuideContent() {
    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 text-sm font-medium">Tiêu đề cột cần có</div>
                <pre className="max-h-[320px] select-text overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm leading-6 text-foreground">
                    {REQUIRED_FILE_COLUMNS.join("\n")}
                </pre>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
                <p>Business key đối chiếu gồm ngày chứng từ, số chứng từ, mã khách hàng, mã hàng, đơn vị và số lượng tương ứng.</p>
                <p>Cột Doanh số bán chỉ dùng để đối chiếu dòng bán. Dòng trả lại sẽ đối chiếu bằng Giá trị trả lại hoặc Doanh số trả lại nếu file có cột này.</p>
            </div>
        </div>
    )
}

function SummaryBox({
    label,
    value,
    tone,
}: {
    label: string
    value: string | number
    tone?: "success" | "warning" | "danger"
}) {
    const color = tone === "success"
        ? "text-emerald-700"
        : tone === "warning"
            ? "text-amber-700"
            : tone === "danger"
                ? "text-red-700"
                : "text-foreground"
    return (
        <div className="rounded-md border bg-background p-3">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
        </div>
    )
}

function PreviewRow({ row }: { row: TransactionUnitPriceImportPreviewRow }) {
    return (
        <tr className="border-b last:border-0">
            <td className="px-3 py-2">{row.source_row_no}</td>
            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    <StatusBadge status={row.status} />
                    <span className="text-xs text-muted-foreground">{row.message}</span>
                </div>
            </td>
            <td className="px-3 py-2">{row.document_no || "-"}</td>
            <td className="px-3 py-2">{row.customer_code || "-"}</td>
            <td className="px-3 py-2">{row.product_code || "-"}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(row.sale_qty)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(row.return_qty)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.file_unit_price)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.file_sale_revenue == null ? "-" : formatMoney(row.file_sale_revenue)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.new_revenue == null ? "-" : formatMoney(row.new_revenue)}</td>
        </tr>
    )
}

function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABELS[status] ?? status
    const className = status === "UPDATE"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : status === "ALREADY_PRICED"
            ? "bg-slate-50 text-slate-700 border-slate-200"
            : "bg-red-50 text-red-700 border-red-200"
    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    )
}

const STATUS_LABELS: Record<string, string> = {
    UPDATE: "Sẽ cập nhật",
    ALREADY_PRICED: "Đã có giá",
    UNMATCHED: "Không match",
    AMBIGUOUS: "Mơ hồ",
    OUT_OF_SCOPE_DATE: "Ngoài ngày",
    INVALID: "Lỗi file",
}

const REQUIRED_FILE_COLUMNS = [
    "Ngày chứng từ",
    "Số chứng từ",
    "Mã khách hàng",
    "Mã hàng",
    "Đơn vị chính (ĐVC)",
    "Tổng SL bán theo ĐVC",
    "Tổng SL trả lại theo ĐVC",
    "Đơn giá theo ĐVC",
    "Doanh số bán",
]

function formatNumber(value?: number | null) {
    return Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 })
}

function formatMoney(value?: number | null) {
    return Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
}
