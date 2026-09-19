import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, DatabaseZap, Search } from "lucide-react"

import {
    applySalesTransactionsProductIdRepair,
    checkSalesTransactionsProductIdRepair,
    type SalesTransactionProductIdRepairPreview,
    type SalesTransactionProductIdRepairResult,
    type SalesTransactionProductIdRepairRow,
} from "@/api/sales-transactions-product-id-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

type ApplyMode = "product_id_only" | "sync_snapshots"

export default function SalesTransactionsProductIdRepairToolPage() {
    const [preview, setPreview] = useState<SalesTransactionProductIdRepairPreview>()
    const [result, setResult] = useState<SalesTransactionProductIdRepairResult>()
    const [mode, setMode] = useState<ApplyMode>("product_id_only")
    const [manualCodes, setManualCodes] = useState<Record<number, string>>({})
    const [isChecking, setIsChecking] = useState(false)
    const [isApplying, setIsApplying] = useState(false)

    const handleCheck = async () => {
        setResult(undefined)
        try {
            setIsChecking(true)
            const data = await checkSalesTransactionsProductIdRepair(buildManualMappings(manualCodes))
            setPreview(data)
            if (data.unmappable > 0) {
                toast.warning("Còn dòng không map được product_id")
            } else {
                toast.success("Kiểm tra xong")
            }
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra thất bại")
        } finally {
            setIsChecking(false)
        }
    }

    const handleApply = async () => {
        if (!preview?.executable) {
            toast.error("Còn dòng chưa map được, chưa thể update")
            return
        }

        const syncSnapshots = mode === "sync_snapshots"
        const message = syncSnapshots
            ? "Xác nhận gán product_id và đồng bộ lại mã/tên/ĐVT snapshot cũ theo danh mục sản phẩm hiện tại?"
            : "Xác nhận chỉ gán product_id cho các dòng sales_transactions đang thiếu?"

        if (!window.confirm(message)) return

        try {
            setIsApplying(true)
            const data = await applySalesTransactionsProductIdRepair(syncSnapshots, buildManualMappings(manualCodes))
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
                        <h2 className="text-2xl font-bold tracking-tight">Sửa product_id dữ liệu bán hàng</h2>
                        <p className="text-muted-foreground text-sm">
                            Kiểm tra các dòng sales_transactions thiếu product_id và map thử theo products.code.
                        </p>
                    </div>
                    <Badge variant="destructive">Tool tạm</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Kiểm tra và cập nhật</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Summary label="Thiếu product_id" value={preview?.total_missing ?? "-"} />
                        <Summary label="Map được" value={preview?.mappable ?? "-"} />
                        <Summary label="Không map được" value={preview?.unmappable ?? "-"} />
                        <Summary
                            label="Trạng thái"
                            value={preview ? (preview.executable ? "Có thể update" : "Cần xử lý") : "-"}
                        />
                    </div>

                    <Separator />

                    <RadioGroup value={mode} onValueChange={(value) => setMode(value as ApplyMode)}>
                        <div className="grid gap-3 lg:grid-cols-2">
                            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                                <RadioGroupItem value="product_id_only" id="product-id-only" className="mt-1" />
                                <span className="space-y-1">
                                    <Label htmlFor="product-id-only">Chỉ gán product_id</Label>
                                    <span className="text-muted-foreground block text-sm">
                                        Chỉ cập nhật sales_transactions.product_id cho các dòng đang thiếu và map được.
                                    </span>
                                </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                                <RadioGroupItem value="sync_snapshots" id="sync-snapshots" className="mt-1" />
                                <span className="space-y-1">
                                    <Label htmlFor="sync-snapshots">Gán product_id và đồng bộ snapshot cũ</Label>
                                    <span className="text-muted-foreground block text-sm">
                                        Đồng bộ mã/tên/ĐVT từ products cho sales_transactions, pricing_snapshot_items và inventory_product_period_costs.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </RadioGroup>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" onClick={handleCheck} disabled={isChecking || isApplying}>
                            <Search className="mr-2 h-4 w-4" />
                            {isChecking ? "Đang kiểm tra..." : "Kiểm tra"}
                        </Button>
                        <Button onClick={handleApply} disabled={!preview?.executable || isChecking || isApplying}>
                            <DatabaseZap className="mr-2 h-4 w-4" />
                            {isApplying ? "Đang update..." : "Update"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {preview && (
                <PreviewPanel
                    preview={preview}
                    manualCodes={manualCodes}
                    onManualCodeChange={(id, value) => {
                        setManualCodes((current) => ({ ...current, [id]: value }))
                        setResult(undefined)
                    }}
                />
            )}
            {result && <ResultPanel result={result} />}
        </Main>
    )
}

function PreviewPanel({
    preview,
    manualCodes,
    onManualCodeChange,
}: {
    preview: SalesTransactionProductIdRepairPreview
    manualCodes: Record<number, string>
    onManualCodeChange: (id: number, value: string) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {preview.executable ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Dòng sales_transactions thiếu product_id
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-muted-foreground text-sm">
                    Đang hiển thị tối đa 500 dòng đầu tiên. Với dòng không map được, nhập mã sản phẩm hiện tại rồi bấm Kiểm tra lại.
                </div>
                <RowsTable rows={preview.rows} manualCodes={manualCodes} onManualCodeChange={onManualCodeChange} />
            </CardContent>
        </Card>
    )
}

function RowsTable({
    rows,
    manualCodes,
    onManualCodeChange,
}: {
    rows: SalesTransactionProductIdRepairRow[]
    manualCodes: Record<number, string>
    onManualCodeChange: (id: number, value: string) => void
}) {
    if (!rows.length) {
        return (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Không còn dòng sales_transactions thiếu product_id.
            </div>
        )
    }

    return (
        <div className="overflow-auto rounded-md border">
            <table className="min-w-[1400px] w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">Ngày CT</th>
                        <th className="px-3 py-2 text-left">Số CT</th>
                        <th className="px-3 py-2 text-left">Khách hàng</th>
                        <th className="px-3 py-2 text-left">Snapshot hiện tại</th>
                        <th className="px-3 py-2 text-left">Mã nhập thủ công</th>
                        <th className="px-3 py-2 text-left">Map sang sản phẩm</th>
                        <th className="px-3 py-2 text-left">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t">
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
                            <td className="px-3 py-2">
                                {canManualMap(row) ? (
                                    <Input
                                        value={manualCodes[row.id] ?? row.manual_product_code ?? ""}
                                        onChange={(event) => onManualCodeChange(row.id, event.target.value)}
                                        placeholder="Nhập mã sản phẩm"
                                        className="h-8 font-mono"
                                    />
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                <div>{row.mapped_product_name || "-"}</div>
                                <div className="text-muted-foreground font-mono text-xs">
                                    {row.mapped_product_code || "-"}
                                    {row.mapped_product_id ? ` #${row.mapped_product_id}` : ""}
                                    {row.mapped_unit ? ` / ${row.mapped_unit}` : ""}
                                </div>
                            </td>
                            <td className="px-3 py-2">
                                {row.mappable ? (
                                    <Badge>Map được</Badge>
                                ) : (
                                    <Badge variant="destructive">{row.reason || "Không map được"}</Badge>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ResultPanel({ result }: { result: SalesTransactionProductIdRepairResult }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Kết quả update
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={result.success ? "text-emerald-700" : "text-amber-700"}>{result.message}</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(result.affected).map(([key, value]) => (
                        <Summary key={key} label={key} value={value} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function Summary({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
        </div>
    )
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    return value.replace("T", " ").slice(0, 19)
}

function canManualMap(row: SalesTransactionProductIdRepairRow) {
    return !row.mappable || Boolean(row.manual_product_code)
}

function buildManualMappings(manualCodes: Record<number, string>) {
    return Object.entries(manualCodes)
        .map(([id, code]) => ({
            sales_transaction_id: Number(id),
            product_code: code.trim(),
        }))
        .filter((item) => item.sales_transaction_id > 0 && item.product_code)
}
