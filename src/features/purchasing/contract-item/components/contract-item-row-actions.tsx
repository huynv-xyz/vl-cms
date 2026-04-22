import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useContractItems } from "./contract-items-provider"
import { ContractItem } from "../data/schema"

import { deleteContractItem } from "@/api/purchasing/contract-item"
import { useCrudDelete } from "@/hooks/use-crud-delete"

export function ContractItemRowActions({ row }: { row: Row<ContractItem> }) {

    const { openEdit } = useContractItems()

    const { deleteById, isDeleting } = useCrudDelete(
        deleteContractItem,
        ["contract-items"]
    )

    return (
        <CrudRowActions
            row={row.original}

            onEdit={() => openEdit(row.original)}

            onDelete={(r) => deleteById(r.id)}   // 👈 đây là delete

        />
    )
}