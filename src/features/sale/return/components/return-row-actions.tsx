import { Row } from "@tanstack/react-table"

import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useReturns } from "./returns-provider"
import type { Return } from "../data/schema"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deleteReturn } from "@/api/sale/return"

export function ReturnRowActions({ row }: { row: Row<Return> }) {
    const { openEdit } = useReturns()
    const { deleteById } = useCrudDelete(
        deleteReturn,
        ["returns"]
    )

    return (
        <>
            <CrudRowActions
                row={row.original}
                onEdit={() => {
                    openEdit(row.original)
                }}
                onDelete={(r) => deleteById(r.id)}
            />
        </>
    )
}