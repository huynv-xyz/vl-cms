import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const provinceSchema: RJSFSchema = {
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
        regionId: {
            type: "integer",
            title: "Vùng",
        },
        status: {
            type: "integer",
            title: "Trạng thái",
            oneOf: [
                { const: 1, title: "Hoạt động" },
                { const: 0, title: "Ngưng hoạt động" },
            ],
            default: 1,
        },
    },
    errorMessage: {
        required: {
            code: "Mã khu vực không được để trống",
            name: "Tên khu vực không được để trống",
        },
    },
} as any

export const provinceUiSchema: UiSchema = {
    regionId: {
        "ui:widget": "select",
    },
    status: {
        "ui:widget": "select",
    },
}