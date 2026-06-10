import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipPointGroupSchema: RJSFSchema = {
    type: "object",
    required: ["group_code"],
    properties: {
        group_code: {
            type: "string",
            title: "Mã nhóm",
            minLength: 1,
            errorMessage: {
                minLength: "Mã nhóm không được để trống",
            },
        },
        group_name: {
            type: "string",
            title: "Tên nhóm",
        },
        unit: {
            type: "string",
            title: "Đơn vị tính",
            enum: ["Tấn", "Kg", "Lít"],
        },
        he_so_mb: {
            type: "number",
            title: "Hệ số MB",
            default: 0,
        },
        he_so_mn: {
            type: "number",
            title: "Hệ số MN",
            default: 0,
        },
        description: {
            type: "string",
            title: "Diễn giải",
        },
        status: {
            type: "boolean",
            title: "Hoạt động",
            default: true,
        },
    },
    errorMessage: {
        required: {
            group_code: "Mã nhóm không được để trống",
        },
    },
} as any

export const vipPointGroupUiSchema: UiSchema = {
    description: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
