import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const userSchema: RJSFSchema = {
    type: "object",
    required: ["email", "name"],
    properties: {
        email: {
            type: "string",
            title: "Email",
            minLength: 1,
            format: "email",
            errorMessage: {
                minLength: "Email không được để trống",
                format: "Email không đúng định dạng",
            },
        },
        name: {
            type: "string",
            title: "Tên",
            minLength: 1,
            errorMessage: {
                minLength: "Tên không được để trống",
            },
        },
        password: {
            type: "string",
            title: "Mật khẩu",
            minLength: 6,
            errorMessage: {
                minLength: "Mật khẩu phải có ít nhất 6 ký tự",
            },
        },
    },
    errorMessage: {
        required: {
            email: "Email không được để trống",
            name: "Tên không được để trống",
        },
    },
} as any

export const userUiSchema: UiSchema = {
    password: {
        "ui:widget": "password",
    },
}