import type { ColumnDef } from "@tanstack/react-table"
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import { formatNumber } from "@/lib/utils"
import type { Currency } from "../data/schema"
import { CurrencyRowActions } from "./currency-row-actions"

export const currencyColumns: ColumnDef<Currency>[] = [
    buildMasterIndexColumn<Currency>(),

    buildTextColumn<Currency>({
        accessorKey: "code",
        title: "Mã tiền tệ",
        width: 160,
        className: `w-[160px] ${masterCenterCell}`,
        render: (row) => (
            <MasterOneLineText value={row.code} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn<Currency>({
        accessorKey: "name",
        title: "Tên tiền tệ",
        width: 300,
        className: `w-[300px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),

    buildTextColumn<Currency>({
        accessorKey: "symbol",
        title: "Ký hiệu",
        width: 120,
        className: `w-[120px] ${masterCenterCell}`,
        render: (row) => <MasterOneLineText value={row.symbol} className="text-center text-sm" />,
    }),

    {
        accessorKey: "exchange_rate",
        header: "Tỷ giá mặc định",
        cell: ({ row }) => (
            <span className="block text-right text-sm tabular-nums">
                {formatNumber(row.original.exchange_rate ?? 1)}
            </span>
        ),
        size: 180,
        meta: {
            thClassName: `w-[180px] whitespace-nowrap ${masterCenterCell}`,
            tdClassName: `w-[180px] whitespace-nowrap ${masterGridCell}`,
        },
    },

    buildTextColumn<Currency>({
        accessorKey: "updated_at",
        title: "Ngày cập nhật",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => <MasterOneLineText value={row.updated_at} className="text-center text-sm" />,
    }),

    buildMasterActionsColumn<Currency>({
        renderActions: (_, row) => <CurrencyRowActions row={row} />,
    }),
]
