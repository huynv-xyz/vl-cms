import { CrudTable } from "@/components/crud/crud-table"
import { portColumns } from "./port-columns"

export function PortTable(props: any) {
    return (
        <CrudTable
            {...props}
            columns={portColumns}
            entityName="cảng"
        />
    )
}