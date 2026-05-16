import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const nationSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã quốc gia",
            minLength: 1,
            errorMessage: {
                minLength: "Mã quốc gia không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên quốc gia",
            minLength: 1,
            errorMessage: {
                minLength: "Tên quốc gia không được để trống",
            },
        },
    },
    errorMessage: {
        required: {
            code: "Mã quốc gia không được để trống",
            name: "Tên quốc gia không được để trống",
        },
    },
} as any

export const nationUiSchema: UiSchema = {}
