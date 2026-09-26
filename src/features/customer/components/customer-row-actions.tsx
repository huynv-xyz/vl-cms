import { type Row } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { deleteCustomer } from "@/api/customer"
import { getMyPermissions, hasPermission } from "@/api/auth/permission"
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
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const permissions = permissionsQuery.data ?? []
    const canViewLocations = hasPermission(permissions, "customer-locations", "view")
    const canUpdateLocations = hasPermission(permissions, "customer-locations", "update")

    return <>
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)}
            onDelete={(customer) => deleteById(customer.id)}
            extraActions={canViewLocations ? () => <DropdownMenuItem onSelect={() => setLocationsOpen(true)}><MapPin className="mr-2 h-4 w-4" />Địa điểm</DropdownMenuItem> : undefined} />
        {canViewLocations && <CustomerLocationsDialog customer={row.original} open={locationsOpen} onOpenChange={setLocationsOpen} canUpdate={canUpdateLocations} />}
    </>
}
