import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const goodsDescriptionSchema: RJSFSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            title: "Mô tả HH",
            minLength: 1,
            errorMessage: {
                minLength: "Mô tả HH không được để trống",
            },
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
        active: {
            type: "number",
            title: "Trạng thái",
            oneOf: [
                { const: 1, title: "Đang dùng" },
                { const: 0, title: "Ngưng dùng" },
            ],
        },
    },
    errorMessage: {
        required: {
            name: "Mô tả HH không được để trống",
        },
    },
} as any

export const goodsDescriptionUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
