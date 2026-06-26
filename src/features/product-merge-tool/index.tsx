import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, RotateCcw, Search, ShieldAlert } from "lucide-react"

import {
    deleteOldMergedProducts,
    executeProductMerge,
    previewProductMerge,
    type DeleteOldProductsResult,
    type ProductMergePair,
    type ProductMergePairPreview,
    type ProductMergePreview,
    type ProductMergeResult,
} from "@/api/product-merge-tool"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProductMergeToolPage() {
    const [oldCodesText, setOldCodesText] = useState("")
    const [newCodesText, setNewCodesText] = useState("")
    const [updateSnapshots, setUpdateSnapshots] = useState(true)
    const [preview, setPreview] = useState<ProductMergePreview>()
    const [result, setResult] = useState<ProductMergeResult>()
    const [deleteResult, setDeleteResult] = useState<DeleteOldProductsResult>()
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [isDeletingOld, setIsDeletingOld] = useState(false)

    const pairs = useMemo(
        () => buildPairs(oldCodesText, newCodesText),
        [oldCodesText, newCodesText]
    )

    const hasMismatchedLines =
        nonEmptyLines(oldCodesText).length !== nonEmptyLines(newCodesText).length

    const handlePreview = async () => {
        setResult(undefined)
        setDeleteResult(undefined)
        if (!pairs.length) {
            toast.error("Chưa có mã để kiểm tra")
            return
        }
        if (hasMismatchedLines) {
            toast.error("Số dòng mã cũ và mã mới đang lệch nhau")
            return
        }
        try {
            setIsPreviewing(true)
            const data = await previewProductMerge(pairs, updateSnapshots)
            setPreview(data)
            if (data.executable) {
                toast.success("Kiểm tra xong, có thể merge")
            } else {
                toast.warning("Kiểm tra xong, còn lỗi cần xử lý")
            }
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra merge thất bại")
        } finally {
            setIsPreviewing(false)
        }
    }

    const handleExecute = async () => {
        if (!preview?.executable) {
            toast.error("Chưa đủ điều kiện merge")
            return
        }

        const confirmed = window.confirm(
            "Xác nhận merge các mã sản phẩm này? Tool sẽ cập nhật product_id của dữ liệu phát sinh và kiểm tra lại sau khi chạy."
        )
        if (!confirmed) return

        try {
            setIsExecuting(true)
            setDeleteResult(undefined)
            const data = await executeProductMerge(pairs, updateSnapshots)
            setResult(data)
            setPreview(data.after)
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.warning(data.message)
            }
        } catch (error: any) {
            toast.error(error?.message || "Merge thất bại")
        } finally {
            setIsExecuting(false)
        }
    }

    const handleDeleteOldProducts = async () => {
        if (!result?.success) {
            toast.error("Chi xoa ma cu sau khi merge thanh cong")
            return
        }

        const confirmed = window.confirm(
            "Xoa cac ma san pham cu da merge xong? Backend se kiem tra lai ma cu khong con phat sinh truoc khi xoa."
        )
        if (!confirmed) return

        try {
            setIsDeletingOld(true)
            const data = await deleteOldMergedProducts(pairs)
            setDeleteResult(data)
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.warning(data.message)
            }
        } catch (error: any) {
            toast.error(error?.message || "Xoa ma cu that bai")
        } finally {
            setIsDeletingOld(false)
        }
    }

    const reset = () => {
        setPreview(undefined)
        setResult(undefined)
        setDeleteResult(undefined)
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Merge mã sản phẩm</h2>
                        <p className="text-muted-foreground text-sm">
                            Công cụ tạm thời để gộp phát sinh từ mã sản phẩm cũ sang mã mới.
                        </p>
                    </div>
                    <Badge variant="destructive">Tool tạm</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Danh sách mã cần merge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Mã cũ</Label>
                            <Textarea
                                value={oldCodesText}
                                onChange={(e) => {
                                    setOldCodesText(e.target.value)
                                    reset()
                                }}
                                rows={12}
                                placeholder={"OLD.CODE.1\nOLD.CODE.2"}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mã mới tương ứng</Label>
                            <Textarea
                                value={newCodesText}
                                onChange={(e) => {
                                    setNewCodesText(e.target.value)
                                    reset()
                                }}
                                rows={12}
                                placeholder={"NEW.CODE.1\nNEW.CODE.2"}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="update-snapshots"
                                checked={updateSnapshots}
                                onCheckedChange={(checked) => {
                                    setUpdateSnapshots(Boolean(checked))
                                    reset()
                                }}
                            />
                            <Label htmlFor="update-snapshots" className="text-sm font-normal">
                                Cập nhật mã/tên/ĐVT snapshot sang mã mới nếu bảng có các cột này
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePreview} disabled={isPreviewing || isExecuting}>
                                <Search className="mr-2 h-4 w-4" />
                                {isPreviewing ? "Đang kiểm tra..." : "Kiểm tra"}
                            </Button>
                            <Button
                                onClick={handleExecute}
                                disabled={!preview?.executable || isPreviewing || isExecuting}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {isExecuting ? "Đang merge..." : "Xác nhận merge"}
                            </Button>
                        </div>
                    </div>

                    <div className="text-muted-foreground text-sm">
                        Đã nhập {pairs.length} cặp mã
                        {hasMismatchedLines && (
                            <span className="ml-2 text-red-600">
                                Số dòng hai danh sách đang lệch nhau.
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {preview && <PreviewPanel preview={preview} />}
            {result && (
                <ResultPanel
                    result={result}
                    onDeleteOldProducts={handleDeleteOldProducts}
                    isDeletingOld={isDeletingOld}
                />
            )}
            {deleteResult && <DeleteOldProductsPanel result={deleteResult} />}
        </Main>
    )
}

function PreviewPanel({ preview }: { preview: ProductMergePreview }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {preview.executable ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                    )}
                    Kết quả kiểm tra
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                    <Summary label="Cặp hợp lệ" value={preview.valid_count} />
                    <Summary label="Dòng phát sinh mã cũ" value={preview.total_rows} />
                    <Summary label="Conflict" value={preview.conflict_count} />
                    <Summary label="Trạng thái" value={preview.executable ? "Có thể merge" : "Chưa thể merge"} />
                </div>

                <Separator />

                <div className="space-y-3">
                    {preview.pairs.map((pair, index) => (
                        <PairPreviewCard key={`${pair.old_code}-${pair.new_code}-${index}`} pair={pair} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function PairPreviewCard({ pair }: { pair: ProductMergePairPreview }) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold">
                        {pair.old_code || "-"} → {pair.new_code || "-"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                        {productLabel(pair.old_product)} → {productLabel(pair.new_product)}
                    </div>
                </div>
                <Badge variant={pair.valid && !pair.conflicts.length ? "default" : "destructive"}>
                    {pair.valid && !pair.conflicts.length ? "OK" : "Cần xử lý"}
                </Badge>
            </div>

            {!!pair.errors.length && (
                <div className="mt-3 space-y-1 text-sm text-red-600">
                    {pair.errors.map((error) => (
                        <div key={error}>- {error}</div>
                    ))}
                </div>
            )}

            {!!pair.conflicts.length && (
                <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Conflict cần xử lý trước khi merge
                    </div>
                    {pair.conflicts.map((conflict) => (
                        <div key={conflict.key}>
                            {conflict.label} [{conflict.key}]: {conflict.count} nhóm
                        </div>
                    ))}
                </div>
            )}

            {!!pair.usage.length ? (
                <div className="mt-3 overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left">Chức năng / bảng</th>
                                <th className="w-28 px-3 py-2 text-right">Số dòng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pair.usage.map((row) => (
                                <tr key={row.key} className="border-t">
                                    <td className="px-3 py-2">
                                        {row.label}
                                        <div className="text-muted-foreground font-mono text-xs">{row.key}</div>
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">{row.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                pair.valid && (
                    <div className="text-muted-foreground mt-3 text-sm">
                        Mã cũ không còn phát sinh theo product_id.
                    </div>
                )
            )}
        </div>
    )
}

function ResultPanel({
    result,
    onDeleteOldProducts,
    isDeletingOld,
}: {
    result: ProductMergeResult
    onDeleteOldProducts: () => void
    isDeletingOld: boolean
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <RotateCcw className="h-5 w-5 text-amber-600" />
                    )}
                    Kết quả thực hiện
                </CardTitle>
                <Button
                    className="mt-3"
                    variant="destructive"
                    onClick={onDeleteOldProducts}
                    disabled={!result.success || isDeletingOld}
                >
                    {isDeletingOld ? "Dang xoa ma cu..." : "Xoa ma cu"}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={result.success ? "text-emerald-700" : "text-amber-700"}>
                    {result.message}
                </div>
                {result.executions.map((execution) => (
                    <div key={`${execution.old_code}-${execution.new_code}`} className="rounded-md border p-3">
                        <div className="font-mono text-sm font-semibold">
                            {execution.old_code} → {execution.new_code}
                        </div>
                        <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                            {Object.entries(execution.affected)
                                .filter(([, value]) => value > 0)
                                .map(([key, value]) => (
                                    <div key={key} className="flex justify-between gap-3">
                                        <span className="text-muted-foreground font-mono">{key}</span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function DeleteOldProductsPanel({ result }: { result: DeleteOldProductsResult }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                    )}
                    Ket qua xoa ma cu
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={result.success ? "text-emerald-700" : "text-amber-700"}>
                    {result.message}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <Summary label="Da xoa" value={result.deleted_count} />
                    <Summary label="Bi chan" value={result.blocked_count} />
                </div>
                <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left">Ma cu</th>
                                <th className="px-3 py-2 text-left">Trang thai</th>
                                <th className="px-3 py-2 text-left">Ghi chu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((row) => (
                                <tr key={row.old_code} className="border-t">
                                    <td className="px-3 py-2 font-mono">{row.old_code}</td>
                                    <td className="px-3 py-2">
                                        <Badge variant={row.deleted ? "default" : "destructive"}>
                                            {row.deleted ? "Da xoa" : "Chua xoa"}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                        {row.message}
                                        {!!Object.keys(row.usage || {}).length && (
                                            <div className="text-muted-foreground mt-1 font-mono text-xs">
                                                {Object.entries(row.usage)
                                                    .map(([key, value]) => `${key}: ${value}`)
                                                    .join(", ")}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

function buildPairs(oldText: string, newText: string): ProductMergePair[] {
    const oldLines = nonEmptyLines(oldText)
    const newLines = nonEmptyLines(newText)
    const max = Math.max(oldLines.length, newLines.length)
    const pairs: ProductMergePair[] = []

    for (let i = 0; i < max; i++) {
        pairs.push({
            oldCode: oldLines[i],
            newCode: newLines[i],
        })
    }

    return pairs.filter((pair) => pair.oldCode || pair.newCode)
}

function nonEmptyLines(text: string) {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
}

function productLabel(product?: { code?: string; name?: string; unit?: string }) {
    if (!product) return "Không tìm thấy"
    return `${product.code} - ${product.name || "-"}${product.unit ? ` (${product.unit})` : ""}`
}
