import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const physicalWarehouseSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã địa điểm kho",
            minLength: 1,
        },
        name: {
            type: "string",
            title: "Tên địa điểm kho",
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
            code: "Không được để trống mã địa điểm kho",
            name: "Không được để trống tên địa điểm kho",
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
