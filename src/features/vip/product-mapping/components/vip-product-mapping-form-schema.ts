import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listCustomers } from "@/api/customer"
import { listProducts } from "@/api/product"

export const vipProductMappingSchema: RJSFSchema = {
    type: "object",
    required: ["product_code"],
    properties: {
        product_code: {
            type: "string",
            title: "Sản phẩm",
            minLength: 1,
            errorMessage: {
                minLength: "Sản phẩm không được để trống",
            },
        },
        customer_code: {
            type: "string",
            title: "Mã khách hàng riêng",
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
            product_code: "Sản phẩm không được để trống",
        },
    },
} as any

export const vipProductMappingUiSchema: UiSchema = {
    product_code: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn sản phẩm",
            searchPlaceholder: "Tìm mã hoặc tên hàng...",
            dataSource: {
                getList: listProducts,
                params: { page: 1, size: 20, status: "1" },
            },
            mapOption: (x: any) => ({
                value: x.code,
                label: `${x.code} - ${x.name ?? ""}`,
            }),
            popoverContentClassName: "w-[520px]",
            optionWrapLabel: true,
            wrapLabel: true,
        },
    },
    customer_code: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Áp dụng mọi khách hàng",
            searchPlaceholder: "Tìm mã hoặc tên khách hàng...",
            emptyText: "Không có khách hàng",
            clearText: "Áp dụng mọi khách hàng",
            dataSource: {
                getList: listCustomers,
                params: { page: 1, size: 20, status: "1" },
            },
            mapOption: (x: any) => ({
                value: x.code,
                label: `${x.code} - ${x.name ?? ""}`,
            }),
            popoverContentClassName: "w-[520px]",
            optionWrapLabel: true,
            wrapLabel: true,
        },
    },
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}
