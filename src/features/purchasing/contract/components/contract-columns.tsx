import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Contract } from "../data/schema"
import { ContractRowActions } from "./contract-row-actions"
import { Link } from "@tanstack/react-router"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/utils"

export const contractColumns: ColumnDef<Contract>[] = [
    buildIndexColumn(),

    // ===== CODE =====
    buildTextColumn({
        accessorKey: "code",
        title: "Số HĐ",
        render: (row) => (
            <Link
                to="/purchasing/contracts/$id"
                params={{ id: String(row.id) }}
                className="text-primary hover:underline font-medium"
            >
                {row.code}
            </Link>
        ),
    }),

    // ===== SUPPLIER =====
    {
        accessorKey: "supplier_id",
        header: "NCC",
        cell: ({ row }) => {
            const text = row.original.supplier
                ? `${row.original.supplier.name}${row.original.supplier.code
                    ? ` (${row.original.supplier.code})`
                    : ""
                }`
                : "-"

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="block max-w-[180px] truncate text-sm cursor-default">
                                {text}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{text}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },

    buildTextColumn({
        id: "nation",
        title: "Quốc gia",
        accessorFn: (row) => row.supplier?.nation?.name ?? "-",
    }),

    buildTextColumn({
        accessorKey: "signed_date",
        title: "Ngày ký",
    }),

    buildTextColumn({
        accessorKey: "payment_method",
        title: "Phương thức TT",
    }),

    buildTextColumn({
        accessorKey: "term",
        title: "Term",
    }),

    {
        accessorKey: "currency_id",
        header: "Tiền tệ",
        cell: ({ row }) => row.original.currency?.code ?? "-",
    },

    // ===== DEPOSIT =====
    {
        accessorKey: "deposit_rate",
        header: "Tỉ lệ cọc (%)",
        cell: ({ row }) => (
            <span>{row.original.deposit_rate ?? 0}%</span>
        ),
    },

    // ===== VALUE =====
    {
        accessorKey: "total_amount",
        header: "Tổng giá trị",
        cell: ({ row }) => (
            <span className="font-bold">{formatNumber(row.original.total_amount ?? 0)}</span>
        ),
    },

    buildActionsColumn({
        renderActions: (_, row) => <ContractRowActions row={row} />,
    }),
]