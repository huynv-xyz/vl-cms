import { Badge } from "@/components/ui/badge"
import type { ProductBom } from "../data/schema"

function materialLabel(item: NonNullable<ProductBom["items"]>[number]) {
    const product = item.material_product
    if (!product) return item.material_product_id ? `#${item.material_product_id}` : "-"
    return `${product.code} - ${product.name}`
}

export function BomItemsPreview({ bom }: { bom: ProductBom }) {
    const items = bom.items || []

    if (!items.length) {
        return (
            <div className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                BOM này chưa có dòng vật tư.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <table className="w-full table-fixed text-sm">
                <colgroup>
                    <col className="w-[56%]" />
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                </colgroup>
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                        <Th>Vật tư</Th>
                        <Th>Loại</Th>
                        <Th>Định mức</Th>
                        <Th>Đơn vị</Th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id ?? `${item.material_product_id}-${item.line_no}`} className="border-t">
                            <Td>
                                <div className="truncate font-medium">
                                    {materialLabel(item)}
                                </div>
                            </Td>
                            <Td>
                                <Badge variant="outline">
                                    {item.material_type}
                                </Badge>
                            </Td>
                            <Td className="font-medium">{item.quantity}</Td>
                            <Td>{item.unit || "-"}</Td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={`px-4 py-3 text-left font-medium ${className ?? ""}`} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={`px-4 py-3 align-middle ${className ?? ""}`} {...props} />
}
