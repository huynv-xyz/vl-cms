import { CrudTable } from "@/components/crud/crud-table"
import type { Product } from "../data/schema"
import { productColumns } from "./product-columns"

export function ProductTable(props: any) {
    return (
        <CrudTable<Product>
            {...props}
            columns={productColumns}
            entityName="sản phẩm"
            searchPlaceholder="Tìm theo mã hoặc tên..."
        />
    )
}