import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const vipProductMappingSchema: RJSFSchema = {
    type: "object",
    required: ["misa_code", "product_sub_code"],
    properties: {
        misa_code: {
            type: "string",
            title: "Mã MISA",
            minLength: 1,
            errorMessage: {
                minLength: "Mã MISA không được để trống",
            },
        },
        product_sub_code: {
            type: "string",
            title: "VTHH Con",
            minLength: 1,
            errorMessage: {
                minLength: "VTHH Con không được để trống",
            },
        },
        customer_code: {
            type: "string",
            title: "Mã khách hàng riêng",
        },
        group_code: {
            type: "string",
            title: "Mã chung",
        },
        product_group: {
            type: "string",
            title: "Nhóm mã VTHH",
        },
        product_name: {
            type: "string",
            title: "Tên sản phẩm",
        },
        unit: {
            type: "string",
            title: "Đơn vị tính",
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
        calc_point: {
            type: "integer",
            title: "Tính điểm",
            default: 1,
            enum: [0, 1],
            enumNames: ["Không", "Có"],
        },
        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
    errorMessage: {
        required: {
            misa_code: "Mã MISA không được để trống",
            product_sub_code: "VTHH Con không được để trống",
        },
    },
} as any

export const vipProductMappingUiSchema: UiSchema = {
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
