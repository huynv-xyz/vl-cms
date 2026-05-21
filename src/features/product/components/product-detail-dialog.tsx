import { Box, Building2, Hash, Layers3, Warehouse } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { Product } from "../data/schema"

type ProductDetailDialogProps = {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProductDetailDialog({
    product,
    open,
    onOpenChange,
}: ProductDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-start gap-3 pr-8">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                            <Box className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-2xl">
                                {product.code}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-base">
                                {product.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-3">
                    <InfoCard
                        icon={<Layers3 className="h-4 w-4" />}
                        label="Tính chất"
                        value={product.nature || "-"}
                    />
                    <InfoCard
                        icon={<Building2 className="h-4 w-4" />}
                        label="Nhóm sản phẩm"
                        value={product.group?.name || product.group_name || "-"}
                        subValue={product.group?.code || product.group_code}
                    />
                    <InfoCard
                        icon={<Warehouse className="h-4 w-4" />}
                        label="Kho ngầm định"
                        value={product.default_warehouse?.name || "-"}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <InfoCard label="Tên báo giá XNK" value={product.quote_name || "-"} />
                    <InfoCard label="Mã báo giá" value={product.quote_code || "-"} />
                    <InfoCard label="Mã NL MISA" value={product.misa_material_code || "-"} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <InfoCard label="Đơn vị tính" value={product.unit || "-"} />
                    <InfoCard
                        icon={<Hash className="h-4 w-4" />}
                        label="TK kho"
                        value={product.inventory_account_code || "-"}
                    />
                    <div className="rounded-md border bg-background px-4 py-3">
                        <div className="text-sm font-medium text-muted-foreground">
                            Trạng thái
                        </div>
                        <div className="mt-2">
                            <Badge variant={Number(product.status) === 1 ? "default" : "secondary"}>
                                {Number(product.status) === 1 ? "Hoạt động" : "Ngừng"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border bg-background px-4 py-3">
                    <div className="text-sm font-medium text-muted-foreground">Mô tả</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm">
                        {product.description || "-"}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InfoCard({
    icon,
    label,
    value,
    subValue,
}: {
    icon?: ReactNode
    label: string
    value: ReactNode
    subValue?: ReactNode
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-2 text-lg font-semibold">{value}</div>
            {subValue && (
                <div className="mt-1 truncate text-sm text-muted-foreground">
                    {subValue}
                </div>
            )}
        </div>
    )
}
