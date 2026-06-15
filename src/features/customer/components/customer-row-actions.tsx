import { type Row } from "@tanstack/react-table"
import { deleteCustomer } from "@/api/customer"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { Customer } from "../data/schema"
import { useCustomers } from "./customers-provider"

type CustomerRowActionsProps = {
    row: Row<Customer>
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
    const { openEdit } = useCustomers()
    const { deleteById } = useCrudDelete(deleteCustomer, ["customer"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={(customer) => deleteById(customer.id)}
        />
    )
}
