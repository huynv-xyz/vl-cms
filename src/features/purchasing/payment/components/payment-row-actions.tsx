import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { usePayments } from "./payment-provider"
import { Payment } from "../data/schema"

export function PaymentRowActions({ row }: { row: Row<Payment> }) {
    const { openEdit } = usePayments()

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
    )
}