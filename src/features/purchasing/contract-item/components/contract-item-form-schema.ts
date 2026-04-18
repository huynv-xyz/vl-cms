import type { RJSFSchema } from "@rjsf/utils"
import type { UiSchema } from "@rjsf/utils"
import { listProducts, getProduct } from "@/api/product"
import { productOption } from "@/lib/option-mapper"

export const contractItemSchema: RJSFSchema = {
    type: "object",
    required: ["product_id", "quantity", "unit_price"],
    properties: {
        product_id: {
            type: "integer",
            title: "Sản phẩm",
        },

        quantity: {
            type: "number",
            title: "Số lượng",
            default: 0,
        },

        unit_price: {
            type: "number",
            title: "Đơn giá",
            default: 0,
        },

        discount_amount: {
            type: "number",
            title: "Chiết khấu",
            default: 0,
        },

        packaging_price: {
            type: "number",
            title: "Giá bao bì",
            default: 0,
        },

        freight_price: {
            type: "number",
            title: "Giá vận chuyển",
            default: 0,
        },
    },

    errorMessage: {
        required: {
            product_id: "Sản phẩm không được để trống",
            quantity: "Số lượng không được để trống",
            unit_price: "Đơn giá không được để trống",
        },
    },
} as any

export const buildContractItemUiSchema = (initialOption?: any): UiSchema => ({
    product_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn sản phẩm",
            initialOption,
            dataSource: {
                getList: listProducts,
                getById: getProduct,
                params: { page: 1, size: 20 },
            },
            mapOption: productOption,
        },
    },

    quantity: {
        "ui:widget": "updown",
    },

    unit_price: {
        "ui:widget": "updown",
    },

    discount_amount: {
        "ui:widget": "updown",
    },

    packaging_price: {
        "ui:widget": "updown",
    },

    freight_price: {
        "ui:widget": "updown",
    },
})