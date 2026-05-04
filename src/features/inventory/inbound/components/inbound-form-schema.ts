import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { listProducts, getProduct } from "@/api/product"

const warehouseDataSource = {
    getList: listWarehouses,
    getById: getWarehouse,
}

const productDataSource = {
    getList: listProducts,
    getById: getProduct,
}

export const SOURCE_TYPES = [
    { value: "PRODUCTION", label: "Nhập sản xuất" },
    { value: "ADJUSTMENT", label: "Điều chỉnh" },
]

export const inboundSchema: RJSFSchema = {
    type: "object",
    required: [
        "source_type",
        "inbound_date",
        "warehouse_id",
        "product_id",
        "quantity_in",
    ],
    properties: {
        source_type: {
            type: "string",
            title: "Loại nhập",
            default: "PURCHASE",
            oneOf: SOURCE_TYPES.map((x) => ({
                const: x.value,
                title: x.label,
            })),
        },
        product_id: {
            type: "integer",
            title: "Sản phẩm",
        },
        quantity_in: {
            type: "number",
            title: "Số lượng",
            minimum: 0.001,
        },
        unit_cost: {
            type: "number",
            title: "Đơn giá",
            minimum: 0,
            default: 0,
        },

        source_no: {
            type: "string",
            title: "Mã nguồn / Mã chứng từ",
            description: "Ví dụ: mã lệnh SX, mã phiếu điều chỉnh",
        },

        lot_no: {
            type: "string",
            title: "Số lô nhập kho",
        },

        inbound_date: {
            type: "string",
            title: "Ngày nhập",
        },
        warehouse_id: {
            type: "integer",
            title: "Kho",
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

export const inboundUiSchema: UiSchema = {
    inbound_date: {
        "ui:widget": "date",
    },
    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho",
            dataSource: warehouseDataSource,
        },
    },
    product_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn sản phẩm",
            dataSource: productDataSource,
        },
    },
    unit_cost: {
        "ui:widget": "currency",
    },
    source_type: {
        "ui:widget": "select",
    },
}