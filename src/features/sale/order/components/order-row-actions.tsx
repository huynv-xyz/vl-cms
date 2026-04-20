import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Order } from "../data/schema"
import { useOrders } from "./orders-provider"

export function OrderRowActions({ row }: { row: Row<Order> }) {
    const { openEdit } = useOrders()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
        />
    )
}