import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Production } from "../data/schema"
import { useProductions } from "../components/productions-provider"
import { deleteProduction } from "@/api/production/order"
import { useCrudDelete } from "@/hooks/use-crud-delete"

type Props = {
    row: Row<Production>
}

export function ProductionRowActions({ row }: Props) {

    const { openEdit } = useProductions()

    const { deleteById } = useCrudDelete(
        deleteProduction,
        ["productions"]
    )

    return (
        <CrudRowActions
            row={row.original}

            onEdit={() => openEdit(row.original)}

            onDelete={(r) => deleteById(r.id)}
        />
    )
}