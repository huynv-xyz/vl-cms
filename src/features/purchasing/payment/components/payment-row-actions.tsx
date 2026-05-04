import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { usePayments } from "./payment-provider"
import { Payment } from "../data/schema"
import { deletePayment } from "@/api/purchasing/payment"
import { useCrudDelete } from "@/hooks/use-crud-delete"

export function PaymentRowActions({ row }: { row: Row<Payment> }) {
    const { openEdit } = usePayments()

    const { deleteById } = useCrudDelete(
        deletePayment,
        ["payments"]
    )

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} onDelete={(r) => deleteById(r.id)} />
    )
}