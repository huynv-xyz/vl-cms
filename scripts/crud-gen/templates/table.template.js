export function tableTemplate({ Entity, entity }) {
    return `
import { CrudTable } from "@/components/crud/crud-table"
import type { ${Entity} } from "../data/schema"
import { ${entity}Columns } from "./${entity}-columns"

export function ${Entity}Table(props: any) {
    return (
        <CrudTable<${Entity}>
            {...props}
            columns={${entity}Columns}
            entityName="${entity}"
            searchPlaceholder="Tìm theo code hoặc tên..."
        />
    )
}
`
}