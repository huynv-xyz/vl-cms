import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const regionSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã khu vực",
            minLength: 1,
            errorMessage: {
                minLength: "Mã khu vực không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên khu vực",
            minLength: 1,
            errorMessage: {
                minLength: "Tên khu vực không được để trống",
            },
        },
    },
    errorMessage: {
        required: {
            code: "Mã khu vực không được để trống",
            name: "Tên khu vực không được để trống",
        },
    },
} as any

export const regionUiSchema: UiSchema = {}