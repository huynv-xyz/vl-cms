
import { CrudTable } from "@/components/crud/crud-table"
import type { Province } from "../data/schema"
import { provinceColumns } from "./province-columns"

export function ProvinceTable(props: any) {
    return (
        <CrudTable<Province>
            {...props}
            columns={provinceColumns}
            entityName="province"
            searchPlaceholder="Tìm theo code hoặc tên..."
        />
    )
}
