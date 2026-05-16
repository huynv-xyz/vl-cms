import { Layers3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { ProductBom } from "../data/schema"
import { BomItemsPreview } from "./bom-items-preview"

type Props = {
    bom: ProductBom
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BomDetailDialog({ bom, open, onOpenChange }: Props) {
    const active = bom.active ?? bom.is_active ?? false

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] !max-w-4xl flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <DialogTitle className="flex items-center gap-2">
                                <Layers3 className="h-5 w-5 text-muted-foreground" />
                                Chi tiết định mức BOM
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {bom.product?.code || `#${bom.product_id}`} - {bom.product?.name || "Thành phẩm"}
                            </DialogDescription>
                        </div>

                        <Badge variant={active ? "secondary" : "outline"}>
                            {active ? "Đang dùng" : "Ngưng dùng"}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                        <Info label="Phiên bản" value={bom.version || "-"} />
                        <Info label="Hiệu lực từ" value={formatDate(bom.valid_from)} />
                        <Info label="Hiệu lực đến" value={formatDate(bom.valid_to)} />
                    </div>

                    {bom.note && (
                        <div className="mb-4 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                            {bom.note}
                        </div>
                    )}

                    <BomItemsPreview bom={bom} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-md border px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}
