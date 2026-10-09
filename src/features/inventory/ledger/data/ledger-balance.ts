import Decimal from "decimal.js-light"
import type { InventoryLedgerReportRow } from "./schema"

const BalanceDecimal = Decimal.clone({ precision: 50 })

export function isFirstTransactionInMonth(row: InventoryLedgerReportRow) {
    return row.is_first_transaction_in_month === true || Number(row.is_first_transaction_in_month) === 1
}

export function isLastTransactionInMonth(row: InventoryLedgerReportRow) {
    return row.is_last_transaction_in_month === true || Number(row.is_last_transaction_in_month) === 1
}

export function getLedgerDisplayedValues(row: InventoryLedgerReportRow) {
    const balance = getLedgerRunningBalance(row)
    const first = isFirstTransactionInMonth(row)
    return {
        openingValue: first ? balance.openingValue : null,
        closingValue: first ? balance.closingValue : null,
        provisionalValue: balance.closingValue,
    }
}

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
