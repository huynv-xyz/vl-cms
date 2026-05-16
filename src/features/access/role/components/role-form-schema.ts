import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const roleSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã vai trò",
            minLength: 1,
            errorMessage: {
                minLength: "Mã vai trò không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên vai trò",
            minLength: 1,
            errorMessage: {
                minLength: "Tên vai trò không được để trống",
            },
        },
    },
    errorMessage: {
        required: {
            code: "Mã vai trò không được để trống",
            name: "Tên vai trò không được để trống",
        },
    },
} as any

export const roleUiSchema: UiSchema = {}
