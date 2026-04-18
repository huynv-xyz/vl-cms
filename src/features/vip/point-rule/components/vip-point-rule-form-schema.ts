import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipPointRuleSchema: RJSFSchema = {
    type: "object",
    required: ["vthh_con"],
    properties: {
        vthh_con: {
            type: "string",
            title: "VTHH Con",
            minLength: 1,
            errorMessage: {
                minLength: "VTHH Con không được để trống",
            },
        },
        from_value: {
            type: "number",
            title: "Từ giá trị",
            default: 0,
        },
        to_value: {
            type: "number",
            title: "Đến giá trị",
            default: 0,
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
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            vthh_con: "VTHH Con không được để trống",
        },
    },
} as any

export const vipPointRuleUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
}