import { CrudTable } from "@/components/crud/crud-table"
import type { Export } from "../data/schema"
import { useExportColumns } from "./export-columns"

export function ExportTable(props: any) {

    const { columns, dialog } = useExportColumns()

    return (
        <>
            <CrudTable<Export>
                {...props}
                columns={columns}
                entityName="export"
                searchPlaceholder="Tìm theo code hoặc tên..."
            />

            {dialog}
        </>
    )
}