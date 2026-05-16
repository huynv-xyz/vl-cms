import type { Row } from "@tanstack/react-table"
import { deleteCurrency } from "@/api/purchasing/currency"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { Currency } from "../data/schema"
import { useCurrencies } from "./currencies-provider"

export function CurrencyRowActions({ row }: { row: Row<Currency> }) {
    const { openEdit } = useCurrencies()
    const { deleteById } = useCrudDelete(deleteCurrency, ["currencies"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={(currency) => openEdit(currency)}
            onDelete={(currency) => deleteById(currency.id)}
        />
    )
}
