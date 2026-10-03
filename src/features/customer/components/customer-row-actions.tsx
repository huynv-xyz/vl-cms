import { type Row } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { getMyPermissions, hasPermission } from "@/api/auth/permission"
import { deleteCustomer } from "@/api/customer"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { Customer } from "../data/schema"
import { useCustomers } from "./customers-provider"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { CustomerLocationsDialog } from "./customer-locations-dialog"
import { useState } from "react"
import { MapPin } from "lucide-react"

type CustomerRowActionsProps = {
    row: Row<Customer>
}

export function CustomerRowActions({ row }: CustomerRowActionsProps) {
    const [locationsOpen, setLocationsOpen] = useState(false)
    const { openEdit } = useCustomers()
    const { deleteById } = useCrudDelete(deleteCustomer, ["customer"])
    const { data: permissions = [] } = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canUpdate = hasPermission(permissions, "customers", "update")
    return <>
        <CrudRowActions row={row.original} onEdit={canUpdate ? () => openEdit(row.original) : undefined}
            onDelete={canUpdate ? (customer) => deleteById(customer.id) : undefined}
            extraActions={() => <DropdownMenuItem onSelect={() => setLocationsOpen(true)}><MapPin className="mr-2 h-4 w-4" />Địa điểm</DropdownMenuItem>} />
        <CustomerLocationsDialog customer={row.original} open={locationsOpen} onOpenChange={setLocationsOpen} />
    </>
}
