import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, DatabaseZap, Search, ShieldCheck } from "lucide-react"

import {
    applySalesTransactionsVipValidityRepair,
    checkSalesTransactionsVipValidityRepair,
    type SalesTransactionVipValidityRepairPreview,
    type SalesTransactionVipValidityRepairResult,
    type SalesTransactionVipValidityRepairRow,
} from "@/api/sales-transactions-vip-validity-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SalesTransactionsVipValidityRepairToolPage() {
    const [preview, setPreview] = useState<SalesTransactionVipValidityRepairPreview>()
    const [result, setResult] = useState<SalesTransactionVipValidityRepairResult>()
    const [isChecking, setIsChecking] = useState(false)
    const [isApplying, setIsApplying] = useState(false)

    const handleCheck = async () => {
        setResult(undefined)
        try {
            setIsChecking(true)
            const data = await checkSalesTransactionsVipValidityRepair()
            setPreview(data)
            if (data.total_mismatched > 0) {
                toast.warning("Có dòng VIP cần sửa")
            } else {
                toast.success("Không còn dòng lệch")
            }
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra thất bại")
        } finally {
            setIsChecking(false)
        }
    }

    const handleApply = async () => {
        if (!preview || preview.total_mismatched <= 0) {
            toast.error("Chưa có dữ liệu cần update")
            return
        }
        if (preview.need_review > 0) {
            toast.error("Còn dòng cần rà soát, chưa thể update tự động")
            return
        }
        if (!window.confirm("Xác nhận sửa snapshot VIP/private_code và valid_code theo rule hiện tại?")) return

        try {
            setIsApplying(true)
            const data = await applySalesTransactionsVipValidityRepair()
            setResult(data)
            setPreview(data.after)
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.warning(data.message)
            }
        } catch (error: any) {
            toast.error(error?.message || "Update thất bại")
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="space-y-2 border-b pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Sửa dữ liệu hợp lệ VIP</h2>
                        <p className="text-muted-foreground text-sm">
                            Quét sales_transactions bị lệch snapshot VIP, private_code hoặc valid_code theo rule hiện tại.
                        </p>
                    </div>
                    <Badge variant="destructive">Bảo trì dữ liệu</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Kiểm tra và cập nhật
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Summary label="Dòng lệch" value={preview?.total_mismatched ?? "-"} />
                        <Summary label="Có thể sửa" value={preview?.repairable ?? "-"} />
                        <Summary label="Cần rà soát" value={preview?.need_review ?? "-"} />
                        <Summary
                            label="Trạng thái"
                            value={preview ? (preview.total_mismatched > 0 ? "Có dữ liệu cần update" : "Đã sạch") : "-"}
                        />
                    </div>
                    {preview && (
                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                            <Summary label="Thiếu HOP_LE" value={preview.by_change_type.MISSING_HOP_LE ?? 0} />
                            <Summary label="Dư HOP_LE" value={preview.by_change_type.EXTRA_HOP_LE ?? 0} />
                            <Summary label="valid_code lệch" value={preview.by_change_type.VALID_CODE_MISMATCH ?? 0} />
                            <Summary label="Thiếu snapshot" value={preview.by_change_type.SNAPSHOT_MISSING ?? 0} />
                            <Summary label="private_code null" value={preview.by_change_type.PRIVATE_CODE_NULL ?? 0} />
                            <Summary label="Khác" value={preview.by_change_type.OTHER ?? 0} />
                        </div>
                    )}

                    <Separator />

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" onClick={handleCheck} disabled={isChecking || isApplying}>
                            <Search className="mr-2 h-4 w-4" />
                            {isChecking ? "Đang kiểm tra..." : "Kiểm tra"}
                        </Button>
                        <Button
                            onClick={handleApply}
                            disabled={!preview?.total_mismatched || preview.need_review > 0 || isChecking || isApplying}
                        >
                            <DatabaseZap className="mr-2 h-4 w-4" />
                            {isApplying ? "Đang update..." : "Update"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {preview && <PreviewPanel preview={preview} />}
            {result && <ResultPanel result={result} />}
        </Main>
    )
}

function PreviewPanel({ preview }: { preview: SalesTransactionVipValidityRepairPreview }) {
    const clean = preview.rows.length === 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {clean ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Dòng sales_transactions lệch dữ liệu VIP
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-muted-foreground text-sm">
                    Đang hiển thị tối đa 500 dòng đầu tiên. Tool chỉ sửa theo rule hiện tại, không tính lại điểm VIP.
                </div>
                <RowsTable rows={preview.rows} />
            </CardContent>
        </Card>
    )
}

function RowsTable({ rows }: { rows: SalesTransactionVipValidityRepairRow[] }) {
    if (!rows.length) {
        return <div className="rounded-md border p-4 text-sm text-muted-foreground">Không còn dòng lệch dữ liệu VIP.</div>
    }

    return (
        <div className="overflow-auto rounded-md border">
            <table className="w-full min-w-[1700px] text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">Ngày CT</th>
                        <th className="px-3 py-2 text-left">Số CT</th>
                        <th className="px-3 py-2 text-left">Khách hàng</th>
                        <th className="px-3 py-2 text-left">Sản phẩm</th>
                        <th className="px-3 py-2 text-right">SL HDN</th>
                        <th className="px-3 py-2 text-left">VTHH con</th>
                        <th className="px-3 py-2 text-left">Nhóm VTHH</th>
                        <th className="px-3 py-2 text-left">Mã riêng</th>
                        <th className="px-3 py-2 text-left">valid_code</th>
                        <th className="px-3 py-2 text-left">Nhóm lỗi</th>
                        <th className="px-3 py-2 text-left">Lý do</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t align-top">
                            <td className="px-3 py-2 font-mono">{row.id}</td>
                            <td className="px-3 py-2">{formatDate(row.document_date)}</td>
                            <td className="px-3 py-2 font-mono">{row.document_no || "-"}</td>
                            <td className="px-3 py-2">
                                <div>{row.customer_name || "-"}</div>
                                <div className="text-muted-foreground font-mono text-xs">{row.customer_code || "-"}</div>
                            </td>
                            <td className="px-3 py-2">
                                <div>{row.product_name || "-"}</div>
                                <div className="text-muted-foreground font-mono text-xs">
                                    {row.product_code || "-"}{row.unit ? ` / ${row.unit}` : ""}
                                </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{formatNumber(row.sl_hdn)}</td>
                            <CompareCell current={row.vthh_con} expected={row.expected_vthh_con} />
                            <CompareCell current={row.vthh_group_name} expected={row.expected_vthh_group_name} />
                            <CompareCell current={row.private_code} expected={row.expected_private_code} />
                            <CompareCell current={row.valid_code} expected={row.expected_valid_code} />
                            <td className="px-3 py-2">{changeTypeLabel(row.change_type)}</td>
                            <td className="px-3 py-2">{row.reason || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function CompareCell({ current, expected }: { current?: string | null; expected?: string | null }) {
    const currentText = emptyText(current)
    const expectedText = emptyText(expected)
    const changed = currentText !== expectedText

    return (
        <td className="px-3 py-2">
            <div className={changed ? "font-mono text-red-600" : "font-mono"}>{currentText}</div>
            {changed && <div className="font-mono text-xs text-emerald-700">-&gt; {expectedText}</div>}
        </td>
    )
}

function ResultPanel({ result }: { result: SalesTransactionVipValidityRepairResult }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Kết quả update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-sm">{result.message}</div>
                <div className="grid gap-3 md:grid-cols-3">
                    {Object.entries(result.affected || {}).map(([key, value]) => (
                        <Summary key={key} label={key} value={value} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function Summary({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-muted-foreground text-xs font-semibold uppercase">{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
    )
}

function emptyText(value?: string | null) {
    return value == null || String(value).trim() === "" ? "-" : String(value)
}

function changeTypeLabel(value?: string | null) {
    switch (value) {
        case "MISSING_HOP_LE":
            return "Thiếu HOP_LE"
        case "EXTRA_HOP_LE":
            return "Dư HOP_LE"
        case "VALID_CODE_MISMATCH":
            return "valid_code lệch"
        case "SNAPSHOT_MISSING":
            return "Thiếu snapshot"
        case "PRIVATE_CODE_NULL":
            return "private_code null"
        default:
            return value || "-"
    }
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    return String(value).slice(0, 10)
}

function formatNumber(value?: number | null) {
    if (value == null) return "-"
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
}
