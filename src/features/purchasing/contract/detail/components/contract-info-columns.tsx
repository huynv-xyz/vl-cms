import type { ColumnDef } from "@tanstack/react-table"

export type ContractInfoRow = {
    label: string
    value: string
}

export const contractInfoColumns: ColumnDef<ContractInfoRow>[] = [
    {
        accessorKey: "label",
        header: "Thông tin",
        cell: ({ row }) => row.original.label,
        meta: {
            thClassName: "w-[240px]",
            tdClassName: "font-medium",
        },
    },
    {
        accessorKey: "value",
        header: "Giá trị",
        cell: ({ row }) => row.original.value || "-",
    },
]