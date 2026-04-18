export function rowActionsTemplate({ Entity, entity }) {
    return `
import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { use${Entity}s } from "./${entity}s-provider"
import type { ${Entity} } from "../data/schema"

export function ${Entity}RowActions({ row }: { row: Row<${Entity}> }) {
    const { openEdit } = use${Entity}s()

    return (
        <CrudRowActions onEdit={() => openEdit(row.original)} />
    )
}
`
}