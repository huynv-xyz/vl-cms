import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useReceipts } from "./receipts-provider"
import type { Receipt } from "../data/schema"
import { deleteReceipt } from "@/api/sale/receipt"
import { useCrudDelete } from "@/hooks/use-crud-delete"

export function ReceiptRowActions({ row }: { row: Row<Receipt> }) {

    const { openEdit } = useReceipts()

    const { deleteById } = useCrudDelete(
        deleteReceipt,
        ["receipts"]
    )

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={(r) => deleteById(r.id)}
        />
    )
}