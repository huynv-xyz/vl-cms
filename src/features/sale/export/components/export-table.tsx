
import { CrudTable } from "@/components/crud/crud-table"
import type { Export } from "../data/schema"
import { exportColumns } from "./export-columns"

export function ExportTable(props: any) {
    return (
        <CrudTable<Export>
            {...props}
            columns={exportColumns}
            entityName="export"
            searchPlaceholder="Tìm theo code hoặc tên..."
        />
    )
}
