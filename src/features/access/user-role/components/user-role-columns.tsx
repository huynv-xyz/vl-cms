import { type ColumnDef } from "@tanstack/react-table"
import { Key } from "lucide-react"

import type { User } from "@/features/user/data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { Button } from "@/components/ui/button"

export function buildUserRoleColumns(
    onAssign: (user: User) => void,
): ColumnDef<User>[] {
    return [
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
            mapValueToLabel: (value) =>
                Number(value) === 1 ? "Hoạt động" : "Tắt",
            mapValueToVariant: (value) =>
                Number(value) === 1 ? "default" : "outline",
            mapValueToClassName: () => "text-xs",
        }),

        buildActionsColumn<User>({
            renderActions: (_, row) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssign(row.original)}
                >
                    <Key className="mr-2 h-4 w-4" />
                    Phân quyền
                </Button>
            ),
        }),
    ]
}
