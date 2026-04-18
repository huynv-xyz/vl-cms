import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const customerSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name", "type", "region"],
    properties: {
        code: {
            type: "string",
            title: "Mã khách hàng",
            minLength: 1,
            errorMessage: {
                minLength: "Mã khách hàng không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên khách hàng",
            minLength: 1,
            errorMessage: {
                minLength: "Tên khách hàng không được để trống",
            },
        },
        type: {
            type: "string",
            title: "Loại",
            oneOf: [
                { const: "B2B", title: "B2B" },
                { const: "B2C", title: "B2C" },
            ],
            default: "B2B",
        },
        region: {
            type: "string",
            title: "Khu vực",
            oneOf: [
                { const: "MB", title: "MB" },
                { const: "MN", title: "MN" },
            ],
            default: "MB",
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            code: "Mã khách hàng không được để trống",
            name: "Tên khách hàng không được để trống",
            type: "Loại không được để trống",
            region: "Khu vực không được để trống",
        },
    },
} as any

export const customerUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
}