import { type Row } from "@tanstack/react-table"
import type { SalesTarget } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useSalesTargets } from "./sales-targets-provider"

type SalesTargetRowActionsProps = {
    row: Row<SalesTarget>
}

export function SalesTargetRowActions({
    row,
}: SalesTargetRowActionsProps) {
    const { openEdit } = useSalesTargets()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
        />
    )
}