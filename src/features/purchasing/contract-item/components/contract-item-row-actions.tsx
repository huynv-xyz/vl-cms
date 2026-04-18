import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useContractItems } from "./contract-items-provider"
import { ContractItem } from "../data/schema"

export function ContractItemRowActions({ row }: { row: Row<ContractItem> }) {
    const { openEdit } = useContractItems()

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
    )
}