import type { RJSFSchema } from "@rjsf/utils"
import type { UiSchema } from "@rjsf/utils"
import { listSuppliers, getSupplier } from "@/api/purchasing/supplier"
import { listCurrencies, getCurrency } from "@/api/purchasing/currency"
import { supplierOption, currencyOption } from "@/lib/option-mapper"

export const contractSchema: RJSFSchema = {
    type: "object",
    required: ["code", "supplier_id", "signed_date", "currency_id"],
    properties: {
        code: {
            type: "string",
            title: "Số hợp đồng",
            minLength: 1,
            errorMessage: {
                minLength: "Số hợp đồng không được để trống",
            },
        },

        supplier_id: {
            type: "integer",
            title: "Nhà cung cấp",
        },

        signed_date: {
            type: "string",
            title: "Ngày ký hợp đồng",
        },

        currency_id: {
            type: "integer",
            title: "Loại tiền",
        },

        deposit_rate: {
            type: "number",
            title: "Tỷ lệ cọc (%)",
            default: 0,
        },
        deposit_date: {
            type: "string",
            title: "Ngày đặt cọc",
        },

        payment_method: {
            type: "string",
            title: "Hình thức thanh toán",
            enum: ["TT", "LC_IMMEDIATE", "LC_60_BL", "DA", "DP"],
            enumNames: [
                "TT",
                "LC trả ngay",
                "LC 60 ngày BL",
                "DA",
                "DP",
            ],
        },

        term: {
            type: "string",
            title: "Incoterm",
        },

        vat_rate: {
            type: "number",
            title: "Thuế VAT (%)",
            default: 0,
        },

        import_tax_rate: {
            type: "number",
            title: "Thuế nhập khẩu (%)",
            default: 0,
        },
    },

    errorMessage: {
        required: {
            code: "Số hợp đồng không được để trống",
            supplier_id: "Nhà cung cấp không được để trống",
            signed_date: "Ngày ký không được để trống",
            currency_id: "Loại tiền không được để trống",
        },
    },
} as any

export const contractUiSchema: UiSchema = {
    supplier_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn nhà cung cấp",
            dataSource: {
                getList: listSuppliers,
                getById: getSupplier,
                params: { page: 1, size: 20 },
            },
            mapOption: supplierOption,
        },
    },

    currency_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn loại tiền",
            dataSource: {
                getList: listCurrencies,
                getById: getCurrency,
                params: { page: 1, size: 20 },
            },
            mapOption: currencyOption,
        },
    },

    signed_date: {
        "ui:widget": "date",
    },

    deposit_rate: {
        "ui:widget": "text",
        "ui:options": {
            step: 0.1,
        },
    },
    deposit_date: {
        "ui:widget": "date",
    },

    payment_method: {
        "ui:widget": "select",
        "ui:placeholder": "Chọn hình thức thanh toán",
    },

    term: {
        "ui:widget": "text",
        "ui:placeholder": "EXW, FOB, CIF...",
    },

    vat_rate: {
        "ui:widget": "text",
        "ui:options": {
            step: 0.1,
        },
    },

    import_tax_rate: {
        "ui:widget": "text",
        "ui:options": {
            step: 0.1,
        },
    },
}