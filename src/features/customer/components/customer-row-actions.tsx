import { type Row } from "@tanstack/react-table"
import type { Customer } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCustomers } from "./customers-provider"

type CustomerRowActionsProps = {
    row: Row<Customer>
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
    const { openEdit } = useCustomers()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
        />
    )
}