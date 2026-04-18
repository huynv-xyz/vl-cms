import type { ColumnDef } from "@tanstack/react-table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type BuildTruncateColumnOptions<T> = {
    accessorKey: keyof T & string
    header: string
    width?: number
    emptyText?: string
    className?: string
}

export function buildTruncateColumn<T>({
    accessorKey,
    header,
    width = 150,
    emptyText = "-",
    className,
}: BuildTruncateColumnOptions<T>): ColumnDef<T> {
    return {
        accessorKey,
        header,
        cell: ({ row }) => {
            const value = String(row.getValue(accessorKey) ?? "")

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className="inline-block truncate text-sm"
                                style={{ maxWidth: `${width}px` }}
                            >
                                {value || emptyText}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{value || emptyText}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
        enableSorting: false,
        size: width,
        meta: {
            className: className ?? `w-[${width}px]`,
            tdClassName: `w-[${width}px] overflow-hidden`,
        },
    }
}