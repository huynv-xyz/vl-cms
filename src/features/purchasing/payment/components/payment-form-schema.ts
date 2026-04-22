import { getShipment, listShipments } from "@/api/purchasing/shipment"
import { shipmentOption } from "@/lib/option-mapper"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"


export const paymentSchema: RJSFSchema = {
    type: "object",
    required: ["paid_at", "amount", "type"],
    properties: {
        shipment_id: {
            type: "integer",
            title: "Lô hàng",
        },

        paid_at: {
            type: "string",
            title: "Ngày thanh toán",
        },

        amount: {
            type: "number",
            title: "Số tiền",
            default: 0,
        },

        exchange_rate: {
            type: "number",
            title: "Tỷ giá",
            default: 1,
        },

        type: {
            type: "string",
            title: "Loại thanh toán",
            oneOf: [
                { const: "DEPOSIT", title: "Cọc" },
                { const: "PAYMENT", title: "Thanh toán" },
                { const: "FEE", title: "Phí" },
            ],
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

export const buildPaymentUiSchema = (
    contractId?: number,
    initialShipment?: any
): UiSchema => ({
    shipment_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn lô hàng",
            initialOption: initialShipment,
            dataSource: {
                getList: listShipments,
                getById: getShipment,
                params: {
                    page: 1,
                    size: 20,
                    contract_id: contractId,
                },
            },
            mapOption: shipmentOption,
        },
    },

    paid_at: {
        "ui:widget": "date",
    },

    amount: {
        "ui:widget": "text",
        "ui:options": {
            inputType: "text",
        },
    },

    exchange_rate: {
        "ui:widget": "text",
        "ui:options": {
            inputType: "text",
        },
    },

    type: {
        "ui:widget": "select",
    },
})