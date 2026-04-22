import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useContracts } from "./contracts-provider"
import type { Contract } from "../data/schema"

import { deleteContract } from "@/api/purchasing/contract"
import { useCrudDelete } from "@/hooks/use-crud-delete"

export function ContractRowActions({ row }: { row: Row<Contract> }) {

    const { openEdit } = useContracts()

    const { deleteById } = useCrudDelete(
        deleteContract,
        ["contracts"]
    )

    return (
        <CrudRowActions
            row={row.original}

            onEdit={() => openEdit(row.original)}

            onDelete={(r) => deleteById(r.id)}   // 👈 thêm dòng này là xong
        />
    )
}