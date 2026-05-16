import type { Row } from "@tanstack/react-table"
import { deleteNation } from "@/api/purchasing/nation"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { Nation } from "../data/schema"
import { useNations } from "./nations-provider"

export function NationRowActions({ row }: { row: Row<Nation> }) {
    const { openEdit } = useNations()
    const { deleteById } = useCrudDelete(deleteNation, ["nations"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={(nation) => openEdit(nation)}
            onDelete={(nation) => deleteById(nation.id)}
        />
    )
}
