import { useState } from "react"
import { toast } from "sonner"
import { DatabaseZap, Loader2, RotateCcw, Search } from "lucide-react"

import {
    applySalesTransactionsUnitRepair,
    checkSalesTransactionsUnitRepair,
    type SalesTransactionUnitRepairResult,
    type SalesTransactionUnitRepairRow,
    type ProductUnitRepairRow,
} from "@/api/sales-transactions-unit-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"

export default function SalesTransactionsUnitRepairToolPage() {
    const [result, setResult] = useState<SalesTransactionUnitRepairResult>()
    const [checking, setChecking] = useState(false)
    const [applying, setApplying] = useState(false)

    const busy = checking || applying
    const canApply = Boolean(result && result.total_mismatch > 0 && !busy)
    const productRows = result?.product_rows ?? []
    const salesRows = result?.rows ?? []

    const handleCheck = async () => {
        try {
            setChecking(true)
            const data = await checkSalesTransactionsUnitRepair()
            setResult(data)
            toast.success("Đã kiểm tra ĐVT sản phẩm và giao dịch")
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
            "Fill products.unit và cập nhật ĐVT sales_transactions theo snapshot sản phẩm?\n\nTool chỉ fill products.unit khi rỗng, sau đó đồng bộ sales_transactions.unit. Các trường unit khác của sản phẩm không bị thay đổi. Sau khi cập nhật cần chạy lại tính điểm VIP để số điểm dùng ĐVT mới."
        )
        if (!confirmed) return

        try {
            setApplying(true)
            const data = await applySalesTransactionsUnitRepair()
            setResult(data)
            toast.success("Đã cập nhật ĐVT sản phẩm và giao dịch")
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
                        <h2 className="text-2xl font-bold tracking-tight">Sửa ĐVT giao dịch bán hàng</h2>
                        <Badge variant="destructive">Bảo trì dữ liệu</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quét và fill lại products.unit, sau đó đồng bộ ĐVT của sales_transactions theo snapshot sản phẩm có fallback.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCheck} disabled={busy}>
                        {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Kiểm tra
                    </Button>
                    <Button onClick={handleApply} disabled={!canApply}>
                        {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                        Cập nhật ĐVT
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Tool này chỉ cập nhật products.unit và snapshot giao dịch, không tự chạy lại điểm VIP. Sau khi update, chạy lại job tính VIP để số điểm được quy đổi theo ĐVT mới.
            </div>

            {result ? (
                <>
                    <div className="grid gap-3 md:grid-cols-4">
                        <SummaryCard label="Tổng lệch" value={result.total_mismatch} />
                        <SummaryCard label="Sản phẩm cần fill" value={result.product_mismatch || 0} />
                        <SummaryCard label="Giao dịch cần sửa" value={result.sales_transaction_mismatch || 0} />
                        <SummaryCard label={result.applied ? "Đã cập nhật" : "Sẽ cập nhật"} value={result.applied ? result.updated : result.total_mismatch} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DatabaseZap className="h-4 w-4" />
                                Sản phẩm thiếu products.unit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {productRows.length ? (
                                <div className="max-h-[360px] overflow-auto rounded-md border">
                                    <table className="w-full min-w-[1100px] text-sm">
                                        <thead className="sticky top-0 bg-muted/50">
                                            <tr>
                                                <th className="border px-2 py-1 text-left">ID</th>
                                                <th className="border px-2 py-1 text-left">Sản phẩm</th>
                                                <th className="border px-2 py-1 text-left">products.unit</th>
                                                <th className="border px-2 py-1 text-left">base_unit_code</th>
                                                <th className="border px-2 py-1 text-left">Nhóm SP</th>
                                                <th className="border px-2 py-1 text-left">ĐVT sẽ set</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productRows.map((row) => (
                                                <ProductSampleRow key={row.id} row={row} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                                    Không có sản phẩm thiếu products.unit.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DatabaseZap className="h-4 w-4" />
                                Dòng sales_transactions lệch ĐVT
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salesRows.length ? (
                                <div className="max-h-[520px] overflow-auto rounded-md border">
                                    <table className="w-full min-w-[1200px] text-sm">
                                        <thead className="sticky top-0 bg-muted/50">
                                            <tr>
                                                <th className="border px-2 py-1 text-left">ID</th>
                                                <th className="border px-2 py-1 text-left">Chứng từ</th>
                                                <th className="border px-2 py-1 text-left">Khách hàng</th>
                                                <th className="border px-2 py-1 text-left">Sản phẩm</th>
                                                <th className="border px-2 py-1 text-left">ĐVT hiện tại</th>
                                                <th className="border px-2 py-1 text-left">products.unit</th>
                                                <th className="border px-2 py-1 text-left">base_unit_code</th>
                                                <th className="border px-2 py-1 text-left">Nhóm SP</th>
                                                <th className="border px-2 py-1 text-left">ĐVT sẽ set</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesRows.map((row) => (
                                                <SampleRow key={row.id} row={row} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                                    Không có dòng lệch ĐVT.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                    Bấm “Kiểm tra” để xem phạm vi cập nhật trước khi chạy.
                </div>
            )}
        </Main>
    )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className="text-xl font-bold tabular-nums">{formatNumber(value)}</span>
            </CardContent>
        </Card>
    )
}

function ProductSampleRow({ row }: { row: ProductUnitRepairRow }) {
    return (
        <tr>
            <td className="border px-2 py-1 font-mono">{row.id}</td>
            <td className="border px-2 py-1">
                <div className="font-mono">{row.code || "-"}</div>
                <div className="text-muted-foreground text-xs">{row.name || "-"}</div>
            </td>
            <td className="border px-2 py-1 font-mono text-red-600">{row.current_unit || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.base_unit_code || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.product_group_unit || "-"}</td>
            <td className="border px-2 py-1 font-mono text-primary">{row.expected_unit || "-"}</td>
        </tr>
    )
}

function SampleRow({ row }: { row: SalesTransactionUnitRepairRow }) {
    return (
        <tr>
            <td className="border px-2 py-1 font-mono">{row.id}</td>
            <td className="border px-2 py-1">
                <div className="font-mono">{row.document_no || "-"}</div>
                <div className="text-muted-foreground text-xs">{row.document_date || "-"}</div>
            </td>
            <td className="border px-2 py-1">
                <div className="font-mono">{row.customer_code || "-"}</div>
                <div className="text-muted-foreground text-xs">{row.customer_name || "-"}</div>
            </td>
            <td className="border px-2 py-1">
                <div className="font-mono">{row.product_code || "-"}</div>
                <div className="text-muted-foreground text-xs">{row.product_name || "-"}</div>
            </td>
            <td className="border px-2 py-1 font-mono text-red-600">{row.current_unit || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.product_unit || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.base_unit_code || "-"}</td>
            <td className="border px-2 py-1 font-mono">{row.product_group_unit || "-"}</td>
            <td className="border px-2 py-1 font-mono text-primary">{row.expected_unit || "-"}</td>
        </tr>
    )
}
