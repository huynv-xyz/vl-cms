import { type Row } from "@tanstack/react-table"
import { ShieldCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { AccessRole } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useAccessRoles } from "./roles-provider"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { deleteAccessRole } from "@/api/auth/role"

type Props = {
    row: Row<AccessRole>
    onAssignPermissions: (role: AccessRole) => void
}

export function RoleRowActions({ row, onAssignPermissions }: Props) {
    const { openEdit } = useAccessRoles()
    const queryClient = useQueryClient()

    return (
        <CrudRowActions<AccessRole>
            row={row.original}
            onEdit={(r) => openEdit(r)}
            onDelete={async (r) => {
                try {
                    await deleteAccessRole(r.id)
                    toast.success("Đã xoá vai trò")
                    queryClient.invalidateQueries({
                        queryKey: ["admin", "access-roles"],
                    })
                } catch (err: any) {
                    toast.error(err?.message ?? "Xoá thất bại")
                }
            }}
            extraActions={(r) => (
                <DropdownMenuItem onClick={() => onAssignPermissions(r)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Quản lý quyền
                </DropdownMenuItem>
            )}
        />
    )
}
