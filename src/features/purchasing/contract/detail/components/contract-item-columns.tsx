import { type ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"

export const contractItemColumns: ColumnDef<any>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "product_code",
        title: "Mã hàng",
    }),

    buildTextColumn({
        accessorKey: "product_name",
        title: "Tên hàng",
    }),

    buildTextColumn({
        accessorKey: "unit",
        title: "Đơn vị",
    }),

    buildTextColumn({
        accessorKey: "quantity",
        title: "Số lượng",
    }),

    buildTextColumn({
        accessorKey: "unit_price",
        title: "Đơn giá",
    }),

    buildActionsColumn({
        renderActions: () => (
            <div className="flex items-center gap-2">
                <button className="text-sm text-primary">Sửa</button>
                <button className="text-sm text-destructive">Xóa</button>
            </div>
        ),
    }),
]