import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { getEmployee, listEmployees } from "@/api/employee"

const employeeDataSource = {
    getList: ({ keyword = "" }: { keyword?: string }) =>
        listEmployees({ page: 1, size: 50, keyword, status: "1" }),
    getById: getEmployee,
}

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
        employee_id: {
            type: "integer",
            title: "Nhân viên sale",
            description: "Nếu chọn, tài khoản chỉ được đặt và xem đơn của nhân viên này.",
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
    employee_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn nhân viên sale",
            searchPlaceholder: "Tìm mã hoặc tên nhân viên...",
            emptyText: "Không tìm thấy nhân viên",
            clearText: "Bỏ gán nhân viên",
            dataSource: employeeDataSource,
            mapOption: (x: any) => ({
                value: x.id,
                label: x.code ? `${x.code} - ${x.name}` : x.name,
                raw: x,
            }),
        },
    },
}

const { password: _passwordProperty, ...updateProperties } =
    userSchema.properties ?? {}
const { password: _passwordUi, ...updateUiSchema } = userUiSchema

export const updateUserSchema: RJSFSchema = {
    ...userSchema,
    properties: updateProperties,
}

export const updateUserUiSchema: UiSchema = updateUiSchema
