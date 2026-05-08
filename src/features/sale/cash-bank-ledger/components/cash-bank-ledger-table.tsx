import { CrudTable } from "@/components/crud/crud-table"
import type { CashBankLedger } from "../data/schema"
import { cashBankLedgerColumns } from "./cash-bank-ledger-columns"

export function CashBankLedgerTable(props: any) {
    return (
        <CrudTable<CashBankLedger>
            {...props}
            columns={cashBankLedgerColumns}
            entityName="cash-bank-ledger"
            searchPlaceholder="Tìm theo diễn giải, số chứng từ..."
        />
    )
}