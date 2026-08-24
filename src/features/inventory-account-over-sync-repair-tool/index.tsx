import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, DatabaseBackup, Loader2, RotateCcw, Search } from "lucide-react"

import {
    applyInventoryAccountOverSyncRepair,
    checkInventoryAccountOverSyncRepair,
    type AccountRepairLedgerSample,
    type AccountRepairProductSample,
    type AccountRepairResult,
} from "@/api/inventory-account-over-sync-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"

export default function InventoryAccountOverSyncRepairToolPage() {
    const [result, setResult] = useState<AccountRepairResult>()
    const [checking, setChecking] = useState(false)
    const [applying, setApplying] = useState(false)

    const busy = checking || applying
    const canApply = Boolean(result && !result.applied && result.missing_warehouse_count === 0 && !busy)
    const productCandidates = result?.product_final_candidates ?? result?.product_restore_candidates ?? 0
    const ledgerCandidates = result?.ledger_final_candidates ?? result?.ledger_restore_candidates ?? 0
    const productsUpdated = result?.products_updated ?? result?.products_restored ?? 0
    const ledgerUpdated = result?.ledger_updated ?? result?.ledger_restored ?? 0

    const handleCheck = async () => {
        try {
            setChecking(true)
            const data = await checkInventoryAccountOverSyncRepair()
            setResult(data)
            toast.success("Đã kiểm tra phạm vi sửa TK kho")
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra thất bại")
        } finally {
            setChecking(false)
        }
    }

    const handleApply = async () => {
        if (!result) {
            toast.error("Cần kiểm tra trước khi chạy")
            return
        }
        const confirmed = window.confirm(
            "Chạy tool sửa TK kho quá tay?\n\nTool sẽ tính TK cuối kỳ vọng cho products/inventory_ledger từ DB vlife_ss và mapping kho hard-code, rồi update một lần các dòng đang khác kỳ vọng. Toàn bộ thao tác chạy trong một transaction."
        )
        if (!confirmed) return

        try {
            setApplying(true)
            const data = await applyInventoryAccountOverSyncRepair()
            setResult(data)
            toast.success("Đã chạy xong tool sửa TK kho")
        } catch (error: any) {
            toast.error(error?.message || "Chạy tool thất bại, dữ liệu đã rollback")
        } finally {
            setApplying(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Sửa TK kho sync quá tay</h2>
                        <Badge variant="destructive">Tool tạm</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Tính TK cuối kỳ vọng từ DB <span className="font-mono">vlife_ss</span> và danh sách kho hard-code, rồi cập nhật một lần các dòng còn lệch.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCheck} disabled={busy}>
                        {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Kiểm tra
                    </Button>
                    <Button variant="destructive" onClick={handleApply} disabled={!canApply}>
                        {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        Cập nhật TK kỳ vọng
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Tool này không chạy lại rules toàn hệ thống. Ngoài mapping bên dưới thì dữ liệu quay về TK trong vlife_ss; ledger chỉ áp TK mapping cho vế có rule <b>PRODUCT_ACCOUNT</b> và kho thực tế nằm trong mapping.
            </div>

            {result ? (
                <>
                    <div className="grid gap-3 md:grid-cols-3">
                        <SummaryCard title="Cần cập nhật theo kỳ vọng" rows={[
                            ["Sản phẩm", productCandidates],
                            ["Dòng sổ kho", ledgerCandidates],
                        ]} />
                        <SummaryCard title="Kết quả đã chạy" rows={[
                            ["SP cập nhật", productsUpdated],
                            ["Ledger cập nhật", ledgerUpdated],
                        ]} />
                        <SummaryCard title="Hậu kiểm sau chạy" rows={[
                            ["SP còn lệch", result.applied ? productCandidates : 0],
                            ["Ledger còn lệch", result.applied ? ledgerCandidates : 0],
                        ]} />
                    </div>

                    {result.missing_warehouse_count > 0 ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            <AlertTriangle className="mr-2 inline h-4 w-4" />
                            Thiếu {formatNumber(result.missing_warehouse_count)} kho trong DB hiện tại, tool chưa cho chạy.
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DatabaseBackup className="h-4 w-4" />
                                Mapping kho áp dụng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto rounded-md border">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="border px-2 py-1 text-left">Mã kho</th>
                                            <th className="border px-2 py-1 text-left">Tên kho</th>
                                            <th className="border px-2 py-1 text-left">TK đúng</th>
                                            <th className="border px-2 py-1 text-left">TK kho hiện tại</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.warehouses.map((item) => (
                                            <tr key={item.warehouse_code || ""}>
                                                <td className="border px-2 py-1 font-mono">{item.warehouse_code || "-"}</td>
                                                <td className="border px-2 py-1">{item.warehouse_name || "-"}</td>
                                                <td className="border px-2 py-1 font-mono">{item.account_code || "-"}</td>
                                                <td className="border px-2 py-1 font-mono">{item.warehouse_current_account || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <SampleSection
                        title="Sample sản phẩm sẽ cập nhật tới TK kỳ vọng"
                        rows={result.product_restore_samples}
                        type="product"
                    />
                    <SampleSection
                        title="Sample ledger sẽ cập nhật tới TK kỳ vọng"
                        rows={result.ledger_restore_samples}
                        type="ledger-restore"
                    />
                </>
            ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                    Bấm “Kiểm tra” để xem phạm vi cập nhật trước khi chạy.
                </div>
            )}
        </Main>
    )
}

function SummaryCard({ title, rows }: { title: string; rows: Array<[string, number]> }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{formatNumber(value)}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function SampleSection({
    title,
    rows,
    type,
}: {
    title: string
    rows: AccountRepairProductSample[] | AccountRepairLedgerSample[]
    type: "product" | "ledger-restore" | "ledger-apply"
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length ? (
                    <div className="max-h-80 overflow-auto rounded-md border">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="sticky top-0 bg-muted/50">
                                {type === "product" ? (
                                    <tr>
                                        <th className="border px-2 py-1 text-left">Mã hàng</th>
                                        <th className="border px-2 py-1 text-left">Tên hàng</th>
                                        <th className="border px-2 py-1 text-left">Kho</th>
                                        <th className="border px-2 py-1 text-left">TK hiện tại</th>
                                        <th className="border px-2 py-1 text-left">TK vlife_ss</th>
                                        <th className="border px-2 py-1 text-left">TK kỳ vọng</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="border px-2 py-1 text-left">Ledger</th>
                                        <th className="border px-2 py-1 text-left">Chứng từ</th>
                                        <th className="border px-2 py-1 text-left">Loại</th>
                                        <th className="border px-2 py-1 text-left">Kho</th>
                                        <th className="border px-2 py-1 text-left">Mã hàng</th>
                                        <th className="border px-2 py-1 text-left">TK Nợ</th>
                                        <th className="border px-2 py-1 text-left">TK Có</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    type === "product"
                                        ? <ProductSampleRow key={index} row={row as AccountRepairProductSample} />
                                        : <LedgerSampleRow key={index} row={row as AccountRepairLedgerSample} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                        Không có sample.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function ProductSampleRow({ row }: { row: AccountRepairProductSample }) {
    return (
        <tr>
            <td className="border px-2 py-1 font-mono">{row.product_code || "-"}</td>
            <td className="border px-2 py-1">{row.product_name || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.warehouse_code || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.current_account || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.snapshot_account || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.target_account || "-"}</td>
        </tr>
    )
}

function LedgerSampleRow({ row }: { row: AccountRepairLedgerSample }) {
    return (
        <tr>
            <td className="border px-2 py-1 font-mono">{row.ledger_id || "-"}</td>
            <td className="border px-2 py-1">{row.doc_no || "-"}</td>
            <td className="border px-2 py-1">{row.doc_type || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.warehouse_code || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.product_code || "-"}</td>
            <td className="border px-2 py-1 font-mono">
                {row.current_tk_no || "-"} → {row.target_tk_no || "-"}
            </td>
            <td className="border px-2 py-1 font-mono">
                {row.current_tk_co || "-"} → {row.target_tk_co || "-"}
            </td>
        </tr>
    )
}
