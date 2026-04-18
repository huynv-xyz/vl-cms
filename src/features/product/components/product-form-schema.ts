import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const productSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã sản phẩm",
            minLength: 1,
        },
        name: {
            type: "string",
            title: "Tên sản phẩm",
            minLength: 1,
        },
        unit: {
            type: "string",
            title: "Đơn vị tính",
        },
        status: {
            type: "integer",
            title: "Trạng thái",
            oneOf: [
                { const: 1, title: "Hoạt động" },
                { const: 0, title: "Ngừng" },
            ],
            default: 1,
        },
    },
    errorMessage: {
        required: {
            code: "Không được để trống mã",
            name: "Không được để trống tên",
        },
    },
} as any

export const productUiSchema: UiSchema = {
    status: {
        "ui:widget": "select",
    },
}