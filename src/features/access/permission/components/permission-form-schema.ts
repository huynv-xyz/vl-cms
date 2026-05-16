import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const permissionSchema: RJSFSchema = {
    type: "object",
    required: ["module", "action"],
    properties: {
        module: {
            type: "string",
            title: "Module",
            minLength: 1,
            errorMessage: { minLength: "Module không được để trống" },
        },
        action: {
            type: "string",
            title: "Hành động",
            minLength: 1,
            errorMessage: { minLength: "Hành động không được để trống" },
        },
        name: {
            type: "string",
            title: "Tên hiển thị",
        },
    },
    errorMessage: {
        required: {
            module: "Module không được để trống",
            action: "Hành động không được để trống",
        },
    },
} as any

export const permissionUiSchema: UiSchema = {}
