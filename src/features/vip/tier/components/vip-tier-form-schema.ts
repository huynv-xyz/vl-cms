import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipTierSchema: RJSFSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            title: "Tên hạng",
            minLength: 1,
            errorMessage: {
                minLength: "Tên hạng không được để trống",
            },
        },
        mb_b2b_point: {
            type: "number",
            title: "MB B2B Point",
            default: 0,
        },
        mb_b2b_reward: {
            type: "number",
            title: "MB B2B Reward",
            default: 0,
        },
        b2c_point: {
            type: "number",
            title: "B2C Point",
            default: 0,
        },
        b2c_reward: {
            type: "number",
            title: "B2C Reward",
            default: 0,
        },
        b2b_point: {
            type: "number",
            title: "B2B Point",
            default: 0,
        },
        b2b_reward: {
            type: "number",
            title: "B2B Reward",
            default: 0,
        },
        sort_order: {
            type: "integer",
            title: "Thứ tự sắp xếp",
            default: 0,
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            name: "Tên hạng không được để trống",
        },
    },
} as any

export const vipTierUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
}
