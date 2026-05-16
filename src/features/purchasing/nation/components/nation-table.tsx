import { CrudTable } from "@/components/crud/crud-table"
import { nationColumns } from "./nation-columns"

export function NationTable(props: any) {
    return (
        <CrudTable
            {...props}
            columns={nationColumns}
            entityName="quốc gia"
            searchPlaceholder="Tìm theo mã hoặc tên quốc gia..."
        />
    )
}
