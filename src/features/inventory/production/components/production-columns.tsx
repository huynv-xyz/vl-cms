import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProductions } from "./productions-provider"
import type { ProductionOrder } from "../data/schema"

function getStatusLabel(status?: string) {
    switch (status) {
        case "PLANNED":
            return { label: "Kế hoạch", variant: "secondary" }
        case "IN_PROGRESS":
            return { label: "Đang SX", variant: "default" }
        case "DONE":
            return { label: "Hoàn tất", variant: "success" as any }
        case "CANCELLED":
            return { label: "Đã hủy", variant: "destructive" }
        default:
            return { label: status || "-", variant: "outline" }
    }
}

export const productionColumns: ColumnDef<ProductionOrder>[] = [
    {
        accessorKey: "code",
        header: "Mã lệnh",
    },
    {
        accessorKey: "production_date",
        header: "Ngày SX",
    },
    {
        accessorKey: "product_name",
        header: "Thành phẩm",
    },
    {
        accessorKey: "warehouse_name",
        header: "Kho",
    },
    {
        accessorKey: "quantity_plan",
        header: "KH",
    },
    {
        accessorKey: "quantity_done",
        header: "Thực tế",
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const s = getStatusLabel(row.original.status)
            return <Badge variant={s.variant}>{s.label}</Badge>
        },
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => {
            const { openEdit } = useProductions()

            return (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row.original)}
                    >
                        Sửa
                    </Button>
                </div>
            )
        },
    },
]