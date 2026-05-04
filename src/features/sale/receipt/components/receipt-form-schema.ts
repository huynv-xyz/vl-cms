import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listOrders, getOrder } from "@/api/sale/order"
import { orderOption } from "@/lib/option-mapper"

const orderDataSource = {
    getList: listOrders,
    getById: getOrder,
}

export const receiptSchema: RJSFSchema = {
    type: "object",
    required: ["order_id", "amount"],
    properties: {
        order_id: {
            type: "integer",
            title: "Đơn hàng",
        },

        customer_id: {
            type: "integer",
        },

        amount: {
            type: "number",
            title: "Số tiền",
        },

        receipt_date: {
            type: "string",
            title: "Ngày thu",
        },

        method: {
            type: "string",
            title: "Hình thức",
            default: "CASH",
            oneOf: [
                { const: "CASH", title: "Tiền mặt" },
                { const: "BANK", title: "Chuyển khoản" },
            ],
        },

        status: {
            type: "string",
            title: "Trạng thái",
            default: "DONE",
            oneOf: [
                { const: "DONE", title: "Hoàn thành" },
                { const: "CANCELLED", title: "Huỷ" },
            ],
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

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

    status: {
        "ui:widget": "select",
    },

    note: {
        "ui:widget": "textarea",
    },
}