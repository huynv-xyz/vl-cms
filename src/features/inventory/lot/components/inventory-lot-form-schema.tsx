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
    { value: "OPENING", label: "Tồn đầu kỳ" },
    { value: "PURCHASE", label: "Nhập mua hàng" },
    { value: "PRODUCTION", label: "Nhập sản xuất" },
    { value: "ADJUSTMENT", label: "Điều chỉnh" },
]

export const inventoryLotSchema: RJSFSchema = {
    type: "object",
    required: [
        "product_id",
        "warehouse_id",
        "inbound_date",
        "source_type",
        "quantity_in",
    ],
    properties: {
        product_id: {
            type: "integer",
            title: "Sản phẩm",
        },

        warehouse_id: {
            type: "integer",
            title: "Kho",
        },

        lot_no: {
            type: "string",
            title: "Số lô",
        },

        inbound_date: {
            type: "string",
            title: "Ngày nhập",
        },

        source_type: {
            type: "string",
            title: "Nguồn",
            oneOf: SOURCE_TYPES.map((x) => ({
                const: x.value,
                title: x.label,
            })),
        },

        source_id: {
            type: "integer",
            title: "ID chứng từ nguồn",
        },

        source_no: {
            type: "string",
            title: "Số chứng từ nguồn",
        },

        quantity_in: {
            type: "number",
            title: "Số lượng nhập",
            minimum: 0.001,
        },

        unit_cost: {
            type: "number",
            title: "Giá vốn gồm PLH",
            minimum: 0,
            default: 0,
        },
    },
}

export const inventoryLotUiSchema: UiSchema = {
    inbound_date: {
        "ui:widget": "date",
    },

    product_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn sản phẩm",
            dataSource: {
                getList: listProducts,
                getById: getProduct,
            },
        },
    },

    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho",
            dataSource: {
                getList: listWarehouses,
                getById: getWarehouse,
            },
        },
    },

    source_type: {
        "ui:widget": "select",
    },
}
