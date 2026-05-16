
import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const warehouseSchema: RJSFSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            title: "Tên kho",
            minLength: 1,
        },
        address: {
            type: "string",
            title: "Địa chỉ",
        },
        status: {
            type: "string",
            title: "Trạng thái",
            oneOf: [
                { const: "ACTIVE", title: "Hoạt động" },
                { const: "INACTIVE", title: "Ngừng" },
            ],
            default: "ACTIVE",
        },
    },
    errorMessage: {
        required: {
            name: "Không được để trống tên kho",
        },
    },
} as any

export const warehouseUiSchema: UiSchema = {
    address: {
        "ui:widget": "textarea",
    },
    status: {
        "ui:widget": "select",
    },
}
