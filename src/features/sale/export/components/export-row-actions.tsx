import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Export } from "../data/schema"

export function ExportRowActions({ row }: { row: Row<Export> }) {
    const data = row.original

    return (
        <CrudRowActions
            row={data}

        />
    )
}