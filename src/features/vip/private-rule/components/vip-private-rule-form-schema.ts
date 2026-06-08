import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipPrivateRuleSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã",
            minLength: 1,
            errorMessage: {
                minLength: "Mã không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên",
            minLength: 1,
            errorMessage: {
                minLength: "Tên không được để trống",
            },
        },
        amount: {
            type: "number",
            title: "Số tiền",
            default: 0,
        },
        unit: {
            type: "string",
            title: "Đơn vị tính",
            enum: ["Tấn", "Kg", "Lít"],
        },
        note: {
            type: "string",
            title: "Ghi chú",
        }
    },
    errorMessage: {
        required: {
            code: "Mã không được để trống",
            name: "Tên không được để trống",
        },
    },
} as any

export const vipPrivateRuleUiSchema: UiSchema = {
    unit: {
        "ui:widget": "select",
    },
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
}
