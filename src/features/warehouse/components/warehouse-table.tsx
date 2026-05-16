
import { CrudTable } from "@/components/crud/crud-table"
import type { Warehouse } from "../data/schema"
import { warehouseColumns } from "./warehouse-columns"

export function WarehouseTable(props: any) {
    return (
        <CrudTable<Warehouse>
            {...props}
            columns={warehouseColumns}
            entityName="kho"
            searchPlaceholder="Tìm theo tên hoặc địa chỉ..."
        />
    )
}
