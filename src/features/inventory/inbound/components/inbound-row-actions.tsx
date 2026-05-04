import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { InventoryInbound } from "../data/schema"
import { useInventoryInbounds } from "./inbounds-provider"

export function InboundRowActions({ row }: { row: Row<InventoryInbound> }) {
    const { openEdit } = useInventoryInbounds()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
        />
    )
}