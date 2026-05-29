import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { getEmployee, listEmployees } from "@/api/employee"

const employeeDataSource = {
    getList: listEmployees,
    getById: getEmployee,
}

export const customerSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name", "type", "region"],
    properties: {
        code: {
            type: "string",
            title: "Mã khách hàng",
            minLength: 1,
            errorMessage: {
                minLength: "Mã khách hàng không được để trống",
            },
        },
        name: {
            type: "string",
            title: "Tên khách hàng",
            minLength: 1,
            errorMessage: {
                minLength: "Tên khách hàng không được để trống",
            },
        },
        address: {
            type: "string",
            title: "Địa chỉ",
        },
        type: {
            type: "string",
            title: "Loại",
            oneOf: [
                { const: "B2B", title: "B2B" },
                { const: "B2C", title: "B2C" },
            ],
            default: "B2B",
        },
        region: {
            type: "string",
            title: "Khu vực",
            oneOf: [
                { const: "MB", title: "MB" },
                { const: "MN", title: "MN" },
            ],
            default: "MB",
        },
        employee_id: {
            type: "integer",
            title: "Nhân viên phụ trách",
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            code: "Mã khách hàng không được để trống",
            name: "Tên khách hàng không được để trống",
            type: "Loại không được để trống",
            region: "Khu vực không được để trống",
        },
    },
} as any

export const customerUiSchema: UiSchema = {
    employee_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn nhân viên phụ trách",
            dataSource: employeeDataSource,
            mapOption: (x: any) => ({
                value: x.id,
                label: x.code ? `${x.code} - ${x.name}` : x.name,
                raw: x,
            }),
            popoverContentClassName: "w-[420px]",
            optionWrapLabel: true,
            wrapLabel: true,
        },
    },
    address: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 2,
        },
    },
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
}
