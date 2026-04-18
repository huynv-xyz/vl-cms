import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { Port } from "../data/schema"
import { usePorts } from "./ports-provider"

export function PortRowActions({ row }: { row: Row<Port> }) {
    const { openEdit } = usePorts()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={(r) => openEdit(r)}
        />
    )
}