import { type ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"

export const shipmentColumns: ColumnDef<any>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã lô",
    }),

    buildTextColumn({
        accessorKey: "shipment_date",
        title: "Ngày lô hàng",
    }),

    buildTextColumn({
        accessorKey: "status",
        title: "Trạng thái",
    }),

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
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