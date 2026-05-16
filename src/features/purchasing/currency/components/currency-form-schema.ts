import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const currencySchema: RJSFSchema = {
    type: "object",
    required: ["code", "name", "exchange_rate"],
    properties: {
        code: {
            type: "string",
            title: "Mã tiền tệ",
            minLength: 1,
            errorMessage: {
                minLength: "Mã tiền tệ không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên tiền tệ",
            minLength: 1,
            errorMessage: {
                minLength: "Tên tiền tệ không được để trống",
            },
        },
        symbol: {
            type: "string",
            title: "Ký hiệu",
        },
        exchange_rate: {
            type: "number",
            title: "Tỷ giá mặc định",
            exclusiveMinimum: 0,
            default: 1,
            errorMessage: {
                exclusiveMinimum: "Tỷ giá phải lớn hơn 0",
            },
        },
    },
    errorMessage: {
        required: {
            code: "Mã tiền tệ không được để trống",
            name: "Tên tiền tệ không được để trống",
            exchange_rate: "Tỷ giá không được để trống",
        },
    },
} as any

export const currencyUiSchema: UiSchema = {
    code: {
        "ui:placeholder": "USD, VND...",
    },
    name: {
        "ui:placeholder": "Đô la Mỹ, Việt Nam Đồng...",
    },
    symbol: {
        "ui:placeholder": "$, ₫...",
    },
    exchange_rate: {
        "ui:placeholder": "1",
    },
}
