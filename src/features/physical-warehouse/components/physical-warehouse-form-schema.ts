import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const physicalWarehouseSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã kho vật lý",
            minLength: 1,
        },
        name: {
            type: "string",
            title: "Tên kho vật lý",
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
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            code: "Không được để trống mã kho vật lý",
            name: "Không được để trống tên kho vật lý",
        },
    },
} as any

export const physicalWarehouseUiSchema: UiSchema = {
    address: {
        "ui:widget": "textarea",
    },
    status: {
        "ui:widget": "select",
    },
    note: {
        "ui:widget": "textarea",
    },
}
