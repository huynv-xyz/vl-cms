import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useContractItems } from "./contract-items-provider"
import { ContractItem } from "../data/schema"

import { deleteContractItem } from "@/api/purchasing/contract-item"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { ContractItemPriceHistoryDialog } from "./contract-item-price-history-dialog"

export function ContractItemRowActions({ row }: { row: Row<ContractItem> }) {

    const [historyOpen, setHistoryOpen] = useState(false)

    const { openEdit } = useContractItems()

    const { deleteById, isDeleting } = useCrudDelete(
        deleteContractItem,
        ["contract-items"]
    )

    return (
        <>
            <CrudRowActions
                row={row.original}

                onEdit={() => openEdit(row.original)}

                onDelete={(r) => deleteById(r.id)}

                extraActions={() => (
                    <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
                        Lịch sử sửa giá
                    </DropdownMenuItem>
                )}
            />
            <ContractItemPriceHistoryDialog
                item={row.original}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
            />
        </>
    )
}
