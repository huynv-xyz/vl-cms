import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { Port } from "../data/schema"
import { usePorts } from "./ports-provider"
import { deletePort } from "@/api/purchasing/port"
import { useCrudDelete } from "@/hooks/use-crud-delete"

export function PortRowActions({ row }: { row: Row<Port> }) {
    const { openEdit } = usePorts()
    const { deleteById } = useCrudDelete(
        deletePort,
        ["suppliers"]
    )

    return (
        <CrudRowActions
            row={row.original}
            onEdit={(r) => openEdit(r)}
            onDelete={(r) => deleteById(r.id)}
        />
    )
}