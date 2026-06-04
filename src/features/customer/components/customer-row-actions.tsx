import { type Row } from "@tanstack/react-table"
import type { Customer } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCustomers } from "./customers-provider"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { deleteCustomer } from "@/api/customer"
import { useCrudDelete } from "@/hooks/use-crud-delete"

type CustomerRowActionsProps = {
    row: Row<Customer>
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
    const { openEdit, openDetail } = useCustomers()
    const { deleteById } = useCrudDelete(deleteCustomer, ["customer"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={(customer) => deleteById(customer.id)}
            extraActions={(customer) => (
                <DropdownMenuItem onClick={() => openDetail(customer)}>
                    ID_B / Alias
                </DropdownMenuItem>
            )}
        />
    )
}
