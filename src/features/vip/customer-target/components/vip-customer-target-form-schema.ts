import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipCustomerTargetSchema: RJSFSchema = {
    type: "object",
    required: ["calc_year", "customer_code"],
    properties: {
        calc_year: {
            type: "integer",
            title: "Năm tính",
            default: new Date().getFullYear(),
        },
        customer_code: {
            type: "string",
            title: "Mã khách hàng",
            minLength: 1,
            errorMessage: {
                minLength: "Mã khách hàng không được để trống",
            },
        },
        customer_name: {
            type: "string",
            title: "Tên khách hàng",
        },
        target_tier_code: {
            type: "string",
            title: "Hạng mục tiêu",
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            calc_year: "Năm tính không được để trống",
            customer_code: "Mã khách hàng không được để trống",
        },
    },
} as any

export const vipCustomerTargetUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
