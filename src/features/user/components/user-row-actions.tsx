import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { User } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useUsers } from "./users-provider"
import { deleteUser } from "@/api/user"

type UserRowActionsProps = {
    row: Row<User>
}

export function UserRowActions({ row }: UserRowActionsProps) {
    const { openEdit } = useUsers()
    const queryClient = useQueryClient()

    return (
        <CrudRowActions<User>
            row={row.original}
            onEdit={(r) => openEdit(r)}
            onDelete={async (r) => {
                try {
                    await deleteUser(r.id)
                    toast.success("Đã xoá user")
                    queryClient.invalidateQueries({
                        queryKey: ["admin", "users"],
                    })
                } catch (err: any) {
                    toast.error(err?.message ?? "Xoá thất bại")
                }
            }}
        />
    )
}
