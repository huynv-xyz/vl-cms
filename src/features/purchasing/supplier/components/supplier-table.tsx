import { CrudTable } from "@/components/crud/crud-table"
import type { Supplier } from "../data/schema"
import { supplierColumns } from "./supplier-columns"

export function SupplierTable(props: any) {
    return (
        <CrudTable<Supplier>
            {...props}
            columns={supplierColumns}
            entityName="nhà cung cấp"
            searchPlaceholder="Tìm theo mã hoặc tên..."
        />
    )
}