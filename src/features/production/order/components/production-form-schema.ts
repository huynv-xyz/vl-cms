import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { productOption, warehouseOption } from "@/lib/option-mapper"

export const productionSchema: RJSFSchema = {
    type: "object",
    required: [
        "product_id",
        "warehouse_id",
        "production_date",
        "quantity_plan",
    ],
    properties: {
        product_id: {
            type: "integer",
            title: "Thành phẩm",
        },

        warehouse_id: {
            type: "integer",
            title: "Kho",
        },

        production_date: {
            type: "string",
            title: "Ngày sản xuất",
        },

        quantity_plan: {
            type: "number",
            title: "Số lượng kế hoạch",
            minimum: 0.001,
        },

        quantity_done: {
            type: "number",
            title: "Số lượng thực tế",
            default: 0,
        },

        status: {
            type: "string",
            title: "Trạng thái",
            default: "PLANNED",
            oneOf: [
                { const: "PLANNED", title: "Kế hoạch" },
                { const: "READY", title: "Sẵn sàng" },
                { const: "DONE", title: "Hoàn tất" },
                { const: "CANCELLED", title: "Đã huỷ" },
            ],
        },
    },

    errorMessage: {
        required: {
            product_id: "Thành phẩm không được để trống",
            warehouse_id: "Kho không được để trống",
            production_date: "Ngày sản xuất không được để trống",
            quantity_plan: "Số lượng kế hoạch không được để trống",
        },
    },
} as any

export const productionUiSchema: UiSchema = {
    product_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn thành phẩm",
            dataSource: {
                getList: listProducts,
                getById: getProduct,
                params: { page: 1, size: 20 },
            },
            mapOption: productOption,
        },
    },

    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho",
            dataSource: {
                getList: listWarehouses,
                getById: getWarehouse,
                params: { page: 1, size: 20 },
            },
            mapOption: warehouseOption,
        },
    },

    production_date: {
        "ui:widget": "date",
    },

    quantity_plan: {
        "ui:widget": "text",
    },

    quantity_done: {
        "ui:widget": "text",
    },

    status: {
        "ui:widget": "select",
    },
}