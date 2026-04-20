import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listCustomers } from "@/api/customer"
import { getCustomerVipDetail } from "@/api/customer-vip"
import { getEmployee, listEmployees } from "@/api/employee"
import { ORDER_STATUSES } from "./order-status"

const customerDataSource = {
    getList: listCustomers,
    getById: getCustomerVipDetail,
}

const employeeDataSource = {
    getList: listEmployees,
    getById: getEmployee,
}

export const orderSchema: RJSFSchema = {
    type: "object",
    required: ["customer_id", "order_date"],
    properties: {
        customer_id: {
            type: "integer",
            title: "Khách hàng",
        },

        employee_id: {
            type: "integer",
            title: "Nhân viên",
        },

        order_date: {
            type: "string",
            title: "Ngày đặt hàng",
        },

        status: {
            type: "string",
            title: "Trạng thái",
            default: "NEW",
            oneOf: ORDER_STATUSES.map((x) => ({
                const: x.value,
                title: x.label,
            })),
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

// ========================
// UI SCHEMA
// ========================
export const orderUiSchema: UiSchema = {
    customer_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn khách hàng",
            dataSource: customerDataSource,
        },
    },

    employee_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn nhân viên",
            dataSource: employeeDataSource,
        },
    },

    order_date: {
        "ui:widget": "date",
    },

    status: {
        "ui:widget": "select",
    },

    note: {
        "ui:widget": "textarea",
    },
}