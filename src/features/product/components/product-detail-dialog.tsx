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
import { formatProductNature } from "./product-nature"

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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
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

                <InfoGrid>
                    <InfoCard icon={<Layers3 className="h-4 w-4" />} label="Tinh chat" value={formatProductNature(product.nature)} />
                    <InfoCard
                        icon={<Building2 className="h-4 w-4" />}
                        label="Nhom san pham"
                        value={product.group?.name || product.group_name || "-"}
                        subValue={product.group?.code || product.group_code}
                    />
                    <InfoCard
                        icon={<Warehouse className="h-4 w-4" />}
                        label="Kho ngam dinh"
                        value={product.default_warehouse?.name || "-"}
                    />
                </InfoGrid>

                <InfoGrid>
                    <InfoCard
                        label="Ma nhom bao gia"
                        value={product.pricing_group?.name || "-"}
                        subValue={product.pricing_group?.code}
                    />
                    <InfoCard label="Cach lay gia mua" value={product.price_method_override || "-"} />
                    <InfoCard label="Gia mua nhap tay" value={formatNumber(product.manual_price_vnd)} />
                </InfoGrid>

                <InfoGrid>
                    <InfoCard label="Ten bao gia XNK" value={product.quote_name || "-"} />
                    <InfoCard label="Ma bao gia" value={product.quote_code || "-"} />
                    <InfoCard label="Ma NL MISA" value={product.misa_material_code || "-"} />
                </InfoGrid>

                <InfoGrid>
                    <InfoCard label="Don vi tinh" value={product.unit || "-"} />
                    <InfoCard label="Don vi ban" value={product.sale_unit_name || product.sale_unit_code || "-"} />
                    <InfoCard label="He so quy doi" value={formatNumber(product.sale_unit_factor)} />
                </InfoGrid>

                <InfoGrid>
                    <InfoCard label="Don vi chuan" value={product.base_unit_code || "-"} />
                    <InfoCard label="Size/quy cach" value={formatSize(product)} />
                    <InfoCard label="VAT %" value={formatNumber(product.vat_rate)} />
                </InfoGrid>

                <InfoGrid>
                    <InfoCard label="Cach lam tron" value={product.rounding_mode || "-"} />
                    <InfoCard label="Don vi lam tron" value={formatNumber(product.rounding_unit)} />
                    <InfoCard icon={<Hash className="h-4 w-4" />} label="TK kho" value={product.inventory_account_code || "-"} />
                </InfoGrid>

                <div className="rounded-md border bg-background px-4 py-3">
                    <div className="text-sm font-medium text-muted-foreground">Trang thai</div>
                    <div className="mt-2">
                        <Badge variant={Number(product.status) === 1 ? "default" : "secondary"}>
                            {Number(product.status) === 1 ? "Hoat dong" : "Ngung"}
                        </Badge>
                    </div>
                </div>

                <div className="rounded-md border bg-background px-4 py-3">
                    <div className="text-sm font-medium text-muted-foreground">Mo ta</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm">
                        {product.description || "-"}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InfoGrid({ children }: { children: ReactNode }) {
    return <div className="grid gap-3 md:grid-cols-3">{children}</div>
}

function formatNumber(value?: number) {
    if (value === undefined || value === null) return "-"
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(Number(value))
}

function formatSize(product: Product) {
    if (product.size_value === undefined || product.size_value === null) return "-"
    return `${formatNumber(product.size_value)} ${product.size_unit_code || ""}`.trim()
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
