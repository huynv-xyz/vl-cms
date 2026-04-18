import { type Row } from "@tanstack/react-table"
import type { User } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useUsers } from "./users-provider"

type UserRowActionsProps = {
    row: Row<User>
}

export function UserRowActions({ row }: UserRowActionsProps) {
    const { openEdit } = useUsers()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
        />
    )
}