import { CrudTable } from "@/components/crud/crud-table"
import type { Region } from "../data/schema"
import { regionColumns } from "./region-columns"

export function RegionTable(props: any) {
    return (
        <CrudTable<Region>
            {...props}
            columns={regionColumns}
            entityName="khu vực"
            searchPlaceholder="Tìm theo mã hoặc tên khu vực..."
        />
    )
}