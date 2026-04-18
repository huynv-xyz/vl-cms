import { type ColumnDef } from "@tanstack/react-table"

import type { User } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { UserRowActions } from "./user-row-actions"

export const userColumns: ColumnDef<User>[] = [
    buildIndexColumn<User>(),

    buildTextColumn<User>({
        accessorKey: "email",
        title: "Email",
        width: 260,
        maxWidth: 260,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<User>({
        accessorKey: "name",
        title: "Tên",
        width: 220,
        maxWidth: 220,
    }),

    buildBadgeColumn<User>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 120,
        mapValueToLabel: (value) => (Number(value) === 1 ? "Hoạt động" : "Tắt"),
        mapValueToVariant: (value) => (Number(value) === 1 ? "default" : "outline"),
        mapValueToClassName: (value) =>
            Number(value) === 1 ? "text-xs" : "text-xs text-muted-foreground",
    }),

    buildTextColumn<User>({
        accessorKey: "created_at",
        title: "Ngày tạo",
        width: 180,
    }),

    buildTextColumn<User>({
        accessorKey: "updated_at",
        title: "Cập nhật",
        width: 180,
    }),

    buildActionsColumn<User>({
        renderActions: (_, row) => <UserRowActions row={row} />,
    }),
]