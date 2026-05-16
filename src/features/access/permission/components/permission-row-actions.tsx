import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { PermissionRow } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useAccessPermissions } from "./permissions-provider"
import { deletePermission } from "@/api/auth/permission"

type Props = { row: Row<PermissionRow> }

export function PermissionRowActions({ row }: Props) {
    const { openEdit } = useAccessPermissions()
    const queryClient = useQueryClient()

    return (
        <CrudRowActions<PermissionRow>
            row={row.original}
            onEdit={(r) => openEdit(r)}
            onDelete={async (r) => {
                try {
                    await deletePermission(r.id)
                    toast.success("Đã xoá quyền")
                    queryClient.invalidateQueries({
                        queryKey: ["admin", "permissions"],
                    })
                } catch (err: any) {
                    toast.error(err?.message ?? "Xoá thất bại")
                }
            }}
        />
    )
}
