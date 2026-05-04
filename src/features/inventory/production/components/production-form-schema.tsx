import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { listProducts, getProduct } from "@/api/product"

export const PRODUCTION_STATUSES = [
    { value: "PLANNED", label: "Kế hoạch" },
    { value: "IN_PROGRESS", label: "Đang sản xuất" },
    { value: "DONE", label: "Hoàn tất" },
    { value: "CANCELLED", label: "Đã hủy" },
]

export const productionSchema: RJSFSchema = {
    type: "object",
    required: [
        "product_id",
        "warehouse_id",
        "production_date",
        "quantity_plan",
        "quantity_done",
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
            title: "Số lượng hoàn thành",
            minimum: 0.001,
        },
        unit_cost: {
            type: "number",
            title: "Giá vốn thành phẩm",
            minimum: 0,
            default: 0,
        },
        status: {
            type: "string",
            title: "Trạng thái",
            default: "PLANNED",
            oneOf: PRODUCTION_STATUSES.map((x) => ({
                const: x.value,
                title: x.label,
            })),
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
            mapOption: (x: any) => ({
                value: x.id,
                label: `${x.code} - ${x.name}`,
            }),
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
            mapOption: (x: any) => ({
                value: x.id,
                label: x.name,
            }),
        },
    },
    production_date: {
        "ui:widget": "date",
    },
    unit_cost: {
        "ui:widget": "currency",
    },
    status: {
        "ui:widget": "select",
    },
}