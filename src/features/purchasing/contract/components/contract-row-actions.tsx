import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useContracts } from "./contracts-provider"
import type { Contract } from "../data/schema"

export function ContractRowActions({ row }: { row: Row<Contract> }) {
    const { openEdit } = useContracts()

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
    )
}