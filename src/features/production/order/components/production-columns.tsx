import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Production } from "../data/schema"
import { Link } from "@tanstack/react-router"
import { formatNumber } from "@/lib/utils"
import { ProductionRowActions } from "./production-row-actions"

export const productionColumns: ColumnDef<Production>[] = [
    buildIndexColumn(),

    // ===== PRODUCTION NO =====
    buildTextColumn({
        accessorKey: "production_no",
        title: "Lệnh SX",
        render: (row) => row?.production_no
        ,
    }),


    // ===== STATUS =====
    buildTextColumn({
        accessorKey: "status",
        title: "Trạng thái",
    }),

    // ===== DATE =====
    buildTextColumn({
        accessorKey: "production_date",
        title: "Ngày SX",
    }),

    buildTextColumn({
        accessorKey: "created_at",
        title: "Ngày tạo",
    }),

    buildActionsColumn({
        renderActions: (_, row) => (
            <ProductionRowActions row={row} />
        ),
    }),
]