import { CrudTable } from "@/components/crud/crud-table"
import { goodsDescriptionColumns } from "./goods-description-columns"

export function GoodsDescriptionTable(props: any) {
    return (
        <CrudTable
            {...props}
            columns={goodsDescriptionColumns}
            entityName="mô tả HH"
            searchPlaceholder="Tìm mô tả HH..."
        />
    )
}
