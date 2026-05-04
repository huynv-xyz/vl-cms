import { CrudTable } from "@/components/crud/crud-table"
import { arLedgerColumns } from "./ar-ledger-columns"
import type { ArLedger } from "../data/schema"

export function ArLedgerTable(props: any) {
    return (
        <CrudTable<ArLedger>
            {...props}
            columns={arLedgerColumns}
            entityName="ar-ledger"
            searchPlaceholder="Tìm chứng từ..."
        />
    )
}