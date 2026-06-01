import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const employeeSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã nhân viên",
            minLength: 1,
            errorMessage: {
                minLength: "Mã nhân viên không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên nhân viên",
            minLength: 1,
            errorMessage: {
                minLength: "Tên nhân viên không được để trống",
            },
        },
        birth_date: {
            type: "string",
            title: "Ngày sinh",
        },
        permanent_address: {
            type: "string",
            title: "Địa chỉ thường trú",
        },
        identity_no: {
            type: "string",
            title: "CMND/CCCD",
        },
        identity_issue_date: {
            type: "string",
            title: "Ngày cấp",
        },
        identity_issue_place: {
            type: "string",
            title: "Nơi cấp",
        },
        status: {
            type: "integer",
            title: "Trạng thái",
            oneOf: [
                { const: 1, title: "Còn làm" },
                { const: 0, title: "Đã nghỉ" },
            ],
            default: 1,
        },
    },
    errorMessage: {
        required: {
            code: "Mã nhân viên không được để trống",
            name: "Tên nhân viên không được để trống",
        },
    },
} as any

export const employeeUiSchema: UiSchema = {
    birth_date: {
        "ui:widget": "date",
    },
    permanent_address: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
    identity_issue_date: {
        "ui:widget": "date",
    },
    status: {
        "ui:widget": "select",
    },
}
