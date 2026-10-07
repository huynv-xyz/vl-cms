import Decimal from "decimal.js-light"
import type { InventoryLedgerReportRow } from "./schema"

const BalanceDecimal = Decimal.clone({ precision: 50 })

export function getLedgerRunningBalance(row: InventoryLedgerReportRow) {
    const closingQuantity = Number(row.balance_quantity || 0)
    const closingValue = Number(row.balance_value || 0)
    return {
        closingQuantity,
        closingValue,
        openingQuantity: new BalanceDecimal(closingQuantity)
            .minus(row.quantity_in || 0).plus(row.quantity_out || 0).toNumber(),
        openingValue: new BalanceDecimal(closingValue).minus(row.amount || 0).toNumber(),
    }
}
