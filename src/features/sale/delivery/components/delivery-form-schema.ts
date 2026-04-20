import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listOrders, getOrder } from "@/api/sale/order"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { listCompanies, getCompany } from "@/api/company"

import {
    orderOption,
    warehouseOption,
    companyOption,
} from "@/lib/option-mapper"

const orderDataSource = {
    getList: listOrders,
    getById: getOrder,
}

const warehouseDataSource = {
    getList: listWarehouses,
    getById: getWarehouse,
}

const companyDataSource = {
    getList: listCompanies,
    getById: getCompany,
}

export const deliverySchema: RJSFSchema = {
    type: "object",
    required: ["order_id", "delivery_date"],
    properties: {
        order_id: {
            type: "integer",
            title: "Đơn hàng",
        },

        delivery_date: {
            type: "string",
            title: "Ngày giao",
        },

        warehouse_id: {
            type: "integer",
            title: "Kho",
        },

        company_id: {
            type: "integer",
            title: "Công ty xuất",
        },

        delivery_address: {
            type: "string",
            title: "Địa chỉ giao",
        },

        status: {
            type: "string",
            title: "Trạng thái",
            default: "NEW",
            oneOf: [
                { const: "NEW", title: "Mới" },
                { const: "DELIVERING", title: "Đang giao" },
                { const: "DONE", title: "Hoàn thành" },
                { const: "CANCELLED", title: "Hủy" },
            ],
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

export const deliveryUiSchema: UiSchema = {
    order_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn đơn hàng",
            dataSource: orderDataSource,
            mapOption: orderOption,
        },
    },

    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho",
            dataSource: warehouseDataSource,
            mapOption: warehouseOption,
        },
    },

    company_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn công ty xuất",
            dataSource: companyDataSource,
            mapOption: companyOption,
        },
    },

    delivery_date: {
        "ui:widget": "date",
    },

    delivery_address: {
        "ui:widget": "textarea",
    },

    status: {
        "ui:widget": "select",
    },

    note: {
        "ui:widget": "textarea",
    },
}