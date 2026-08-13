import { useState } from "react"
import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, Play, Search, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import {
    executePurchasingShipmentContractItemBackfill,
    previewPurchasingShipmentContractItemBackfill,
    type BackfillIssue,
    type BackfillPreview,
    type BackfillResult,
} from "@/api/purchasing-shipment-contract-item-backfill-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PurchasingShipmentContractItemBackfillToolPage() {
    const [preview, setPreview] = useState<BackfillPreview>()
    const [result, setResult] = useState<BackfillResult>()
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)

    const handlePreview = async () => {
        try {
            setIsPreviewing(true)
            setResult(undefined)
            const data = await previewPurchasingShipmentContractItemBackfill()
            setPreview(data)
            if (data.executable) {
                toast.success("Kiểm tra xong, có thể chạy backfill")
            } else {
                toast.warning("Còn dòng cần kiểm tra thủ công")
            }
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra thất bại")
        } finally {
            setIsPreviewing(false)
        }
    }

    const handleExecute = async () => {
        if (!preview?.executable) {
            toast.error("Chưa đủ điều kiện chạy backfill")
            return
        }

        const confirmed = window.confirm(
            "Chạy backfill contract_item_id cho chi tiết lô hàng? Backend sẽ chạy trong transaction và tự rollback nếu hậu kiểm phát hiện lỗi."
        )
        if (!confirmed) return

        try {
            setIsExecuting(true)
            const data = await executePurchasingShipmentContractItemBackfill()
            setResult(data)
            setPreview(data.after)
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.warning(data.message)
            }
        } catch (error: any) {
            toast.error(error?.message || "Backfill thất bại")
        } finally {
            setIsExecuting(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Backfill liên kết chi tiết lô hàng với chi tiết hợp đồng
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Công cụ tạm để gán shipment_items.contract_item_id từ dữ liệu hợp đồng cũ.
                        </p>
                    </div>
                    <Badge variant="destructive">Tool tạm</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Thao tác</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={handlePreview} disabled={isPreviewing || isExecuting}>
                        <Search className="mr-2 h-4 w-4" />
                        {isPreviewing ? "Đang kiểm tra..." : "Kiểm tra dữ liệu"}
                    </Button>
                    <Button onClick={handleExecute} disabled={!preview?.executable || isPreviewing || isExecuting}>
                        <Play className="mr-2 h-4 w-4" />
                        {isExecuting ? "Đang backfill..." : "Chạy backfill"}
                    </Button>
                    <div className="text-muted-foreground text-sm">
                        Chỉ tự động gán khi mỗi dòng chi tiết lô hàng khớp đúng một dòng chi tiết hợp đồng.
                    </div>
                </CardContent>
            </Card>

            {preview && <PreviewPanel preview={preview} />}
            {result && <ResultPanel result={result} />}
        </Main>
    )
}

function PreviewPanel({ preview }: { preview: BackfillPreview }) {
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
                    <Summary label="Tổng dòng chi tiết lô hàng" value={preview.total_items} />
                    <Summary label="Đã có liên kết hợp đồng" value={preview.linked_count} />
                    <Summary label="Cần gán liên kết" value={preview.missing_count} />
                    <Summary label="Có thể tự động gán" value={preview.backfillable_count} />
                    <Summary label="Liên kết sai" value={preview.invalid_link_count} />
                    <Summary label="Không tìm thấy dòng hợp đồng" value={preview.missing_contract_item_count} />
                    <Summary label="Không xác định duy nhất" value={preview.ambiguous_count} />
                    <Summary label="Trạng thái" value={preview.executable ? "Có thể chạy" : "Bị chặn"} />
                </div>

                <IssueSection title="Dòng đang liên kết sai" rows={preview.invalid_links} />
                <IssueSection title="Dòng không tìm thấy chi tiết hợp đồng phù hợp" rows={preview.missing_contract_items} />
                <IssueSection title="Dòng bị mơ hồ do trùng mã hàng trong hợp đồng" rows={preview.ambiguous_items} />
            </CardContent>
        </Card>
    )
}

function ResultPanel({ result }: { result: BackfillResult }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    Kết quả backfill
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className={result.success ? "text-emerald-700" : "text-amber-700"}>
                    {result.message}
                </div>
                <Summary label="Số dòng đã cập nhật" value={result.updated_count} />
            </CardContent>
        </Card>
    )
}

function IssueSection({ title, rows }: { title: string; rows?: BackfillIssue[] }) {
    const safeRows = rows ?? []

    if (!safeRows.length) return null

    return (
        <div className="overflow-hidden rounded-md border">
            <div className="bg-muted/50 px-3 py-2 text-sm font-medium">{title}</div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-t">
                        <th className="px-3 py-2 text-left">Dòng lô hàng</th>
                        <th className="px-3 py-2 text-left">Lô hàng</th>
                        <th className="px-3 py-2 text-left">Hợp đồng</th>
                        <th className="px-3 py-2 text-left">Mã hàng</th>
                        <th className="px-3 py-2 text-right">Số dòng hợp đồng khớp</th>
                        <th className="px-3 py-2 text-left">Lý do</th>
                    </tr>
                </thead>
                <tbody>
                    {safeRows.map((row) => (
                        <tr key={`${row.reason}-${row.shipment_item_id}`} className="border-t">
                            <td className="px-3 py-2 font-mono">{row.shipment_item_id}</td>
                            <td className="px-3 py-2">
                                <div className="font-mono">{row.shipment_id}</div>
                                <div className="text-muted-foreground">{row.shipment_code || "-"}</div>
                            </td>
                            <td className="px-3 py-2">
                                <div className="font-mono">{row.contract_id}</div>
                                <div className="text-muted-foreground">{row.contract_code || "-"}</div>
                            </td>
                            <td className="px-3 py-2">
                                <div className="font-mono">{row.product_id}</div>
                                <div className="text-muted-foreground">{row.product_code || "-"}</div>
                            </td>
                            <td className="px-3 py-2 text-right">{row.match_count}</td>
                            <td className="px-3 py-2">{formatReason(row.reason)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="text-muted-foreground border-t px-3 py-2 text-xs">
                Chỉ hiển thị tối đa 200 dòng mỗi nhóm.
            </div>
        </div>
    )
}

function formatReason(reason: string) {
    switch (reason) {
        case "INVALID_LINK":
            return "Đã có contract_item_id nhưng không khớp hợp đồng hoặc mã hàng"
        case "NO_CONTRACT_ITEM":
            return "Không có dòng chi tiết hợp đồng nào khớp mã hàng này"
        case "AMBIGUOUS_CONTRACT_ITEM":
            return "Có nhiều dòng chi tiết hợp đồng cùng mã hàng, cần chọn thủ công"
        default:
            return reason || "-"
    }
}

function Summary({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
        </div>
    )
}
