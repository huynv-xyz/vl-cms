import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listOrders, getOrder } from "@/api/sale/order"
import { orderOption } from "@/lib/option-mapper"

import {
    listCashBankLedgers,
    getCashBankLedger,
} from "@/api/sale/cash-bank-ledger"

const orderDataSource = {
    getList: listOrders,
    getById: getOrder,
}

const ledgerDataSource = {
    getList: (params: any) =>
        listCashBankLedgers({
            ...params,
            type: "IN", // chỉ lấy thu tiền
        }),
    getById: getCashBankLedger,
}

export const receiptSchema: RJSFSchema = {
    type: "object",
    required: ["order_id", "amount", "method"],
    properties: {
        order_id: {
            type: "integer",
            title: "Đơn hàng",
        },

        customer_id: {
            type: "integer",
        },

        receipt_date: {
            type: "string",
            title: "Ngày thu",
        },

        cash_bank_ledger_id: {
            type: "integer",
            title: "Giao dịch",
        },

        amount: {
            type: "number",
            title: "Số tiền",
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
}

export const receiptUiSchema: UiSchema = {
    order_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn đơn hàng",
            dataSource: orderDataSource,
            mapOption: orderOption,
        },
    },

    customer_id: {
        "ui:widget": "hidden",
    },

    receipt_date: {
        "ui:widget": "date",
    },

    amount: {
        "ui:widget": "currency",
    },

    method: {
        "ui:widget": "select",
    },

    cash_bank_ledger_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn giao dịch",
            dataSource: ledgerDataSource,
            mapOption: (x: any) => ({
                value: x.id,
                label: `${x.doc_date} - ${x.debit_amount?.toLocaleString()
                    } - ${x.description ?? ""}`,
            }),
        },

        "ui:condition": (formData: any) => formData?.method === "BANK",
    },

    note: {
        "ui:widget": "textarea",
    },
}