export type CashBankLedger = {
    id: number

    doc_date: string
    doc_no?: string

    description?: string
    account_code?: string

    debit_amount?: number
    credit_amount?: number

    customer_name?: string
    customer_id?: number
}

export type CashBankLedgerDetail = CashBankLedger