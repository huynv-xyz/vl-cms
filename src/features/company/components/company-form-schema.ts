import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const companySchema: RJSFSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            title: "Tên công ty",
            minLength: 1,
            errorMessage: {
                minLength: "Tên công ty không được để trống",
            },
        },
        address: {
            type: "string",
            title: "Địa chỉ",
        },
    },
    errorMessage: {
        required: {
            name: "Tên công ty không được để trống",
        },
    },
} as any

export const companyUiSchema: UiSchema = {
    address: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
