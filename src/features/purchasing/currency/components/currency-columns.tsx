import type { ColumnDef } from "@tanstack/react-table"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { formatNumber } from "@/lib/utils"
import type { Currency } from "../data/schema"
import { CurrencyRowActions } from "./currency-row-actions"

export const currencyColumns: ColumnDef<Currency>[] = [
    buildIndexColumn<Currency>(),

    buildTextColumn<Currency>({
        accessorKey: "code",
        title: "Mã tiền tệ",
    }),

    buildTextColumn<Currency>({
        accessorKey: "name",
        title: "Tên tiền tệ",
    }),

    buildTextColumn<Currency>({
        accessorKey: "symbol",
        title: "Ký hiệu",
    }),

    {
        accessorKey: "exchange_rate",
        header: "Tỷ giá mặc định",
        cell: ({ row }) => formatNumber(row.original.exchange_rate ?? 1),
    },

    buildTextColumn<Currency>({
        accessorKey: "updated_at",
        title: "Ngày cập nhật",
    }),

    buildActionsColumn<Currency>({
        renderActions: (_, row) => <CurrencyRowActions row={row} />,
    }),
]
