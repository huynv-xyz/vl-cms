import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const portSchema: RJSFSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            title: "Tên cảng",
            minLength: 1,
            errorMessage: {
                minLength: "Tên cảng không được để trống",
            },
        },
    },
    errorMessage: {
        required: {
            name: "Tên cảng không được để trống",
        },
    },
} as any

export const portUiSchema: UiSchema = {}