import { type Row } from "@tanstack/react-table"
import type { SalesActual } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useSalesActuals } from "./sales-actuals-provider"

type Props = {
    row: Row<SalesActual>
}

export function SalesActualRowActions({ row }: Props) {
    const { openEdit } = useSalesActuals()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
        />
    )
}