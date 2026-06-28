import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { getProductGroup, listProductGroups } from "@/api/product-group"
import { pricingGroupsApi } from "@/api/pricing"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { PRODUCT_NATURE_OPTIONS } from "./product-nature"

export const productSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: {
            type: "string",
            title: "Mã sản phẩm",
            minLength: 1,
        },
        name: {
            type: "string",
            title: "Tên sản phẩm",
            minLength: 1,
        },
        quote_name: {
            type: "string",
            title: "Tên báo giá XNK",
        },
        quote_code: {
            type: "string",
            title: "Mã báo giá",
        },
        misa_material_code: {
            type: "string",
            title: "Mã NL MISA",
        },
        unit: {
            type: "string",
            title: "Đơn vị tính",
        },
        nature: {
            type: "string",
            title: "Tính chất",
            oneOf: [
                { const: "Thành phẩm", title: "Thành phẩm" },
                { const: "Nguyên vật liệu", title: "Nguyên vật liệu" },
                { const: "Bao bì", title: "Bao bì" },
                { const: "Công cụ dụng cụ", title: "Công cụ dụng cụ" },
                { const: "Hàng hóa", title: "Hàng hóa" },
            ],
        },
        group_id: {
            type: "integer",
            title: "Nhóm VTHH (con)",
        },
        pricing_group_id: {
            type: "integer",
            title: "Ma nhom bao gia",
        },
        base_unit_code: {
            type: "string",
            title: "Đơn vị chuẩn tính giá",
            oneOf: [
                { const: "KG", title: "KG" },
                { const: "LIT", title: "Lít" },
                { const: "TON", title: "Tấn" },
            ],
            default: "KG",
        },
        sale_unit_code: {
            type: "string",
            title: "Mã đơn vị bán",
        },
        sale_unit_name: {
            type: "string",
            title: "Tên đơn vị bán",
        },
        sale_unit_factor: {
            type: "number",
            title: "Hệ số quy đổi",
            default: 1,
        },
        size_value: {
            type: "number",
            title: "Size/quy cách",
        },
        size_unit_code: {
            type: "string",
            title: "Đơn vị size",
        },
        rounding_mode: {
            type: "string",
            title: "Cách làm tròn",
            oneOf: [
                { const: "KG_STEP", title: "Tròn 500/1.000" },
                { const: "SIGNIFICANT_3", title: "Tròn 3 chữ số" },
                { const: "NONE", title: "Không làm tròn" },
            ],
            default: "KG_STEP",
        },
        rounding_unit: {
            type: "number",
            title: "Đơn vị làm tròn",
            default: 1000,
        },
        vat_rate: {
            type: "number",
            title: "VAT %",
            default: 5,
        },
        default_warehouse_id: {
            type: "integer",
            title: "Kho ngầm định",
        },
        inventory_account_code: {
            type: "string",
            title: "TK kho",
        },
        price_method_override: {
            type: "string",
            title: "Cach lay gia mua",
            oneOf: [
                { const: "WAVG", title: "Binh quan" },
                { const: "LATEST", title: "Gia moi nhat" },
                { const: "FIFO", title: "FIFO" },
                { const: "MANUAL", title: "Nhap tay" },
            ],
        },
        manual_price_vnd: {
            type: "number",
            title: "Gia mua nhap tay",
        },
        description: {
            type: "string",
            title: "Mô tả",
        },
        status: {
            type: "integer",
            title: "Trạng thái",
            oneOf: [
                { const: 1, title: "Hoạt động" },
                { const: 0, title: "Ngừng" },
            ],
            default: 1,
        },
    },
    errorMessage: {
        required: {
            code: "Không được để trống mã",
            name: "Không được để trống tên",
        },
    },
} as any

export const productUiSchema: UiSchema = {
    "ui:options": {
        separatorAfter: "inventory_account_code",
    },
    "ui:order": [
        "code",
        "name",
        "quote_name",
        "nature",
        "group_id",
        "unit",
        "default_warehouse_id",
        "inventory_account_code",
        "quote_code",
        "misa_material_code",
        "pricing_group_id",
        "base_unit_code",
        "sale_unit_code",
        "sale_unit_name",
        "sale_unit_factor",
        "size_value",
        "size_unit_code",
        "rounding_mode",
        "rounding_unit",
        "vat_rate",
        "price_method_override",
        "manual_price_vnd",
        "description",
        "status",
    ],
    status: {
        "ui:widget": "select",
    },
    nature: {
        "ui:widget": "select",
        "ui:placeholder": "Chọn tính chất",
    },
    group_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn Nhóm VTHH (con)",
            searchPlaceholder: "Tìm mã hoặc tên nhóm...",
            dataSource: {
                getList: listProductGroups,
                getById: getProductGroup,
                params: { page: 1, size: 20 },
            },
            mapOption: (g: any) => ({
                value: g.id,
                label: `${g.code || `#${g.id}`} - ${g.name || ""}`,
            }),
        },
    },
    unit: {
        "ui:widget": "textSelect",
        "ui:placeholder": "Nhập hoặc chọn đơn vị tính",
        "ui:options": {
            options: ["Cái", "Kg", "Lít", "m2", "Bộ", "Bao"],
        },
    },
    pricing_group_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chon ma nhom bao gia",
            searchPlaceholder: "Tim ma hoac ten nhom bao gia...",
            dataSource: {
                getList: pricingGroupsApi.list,
                getById: pricingGroupsApi.detail,
                params: { page: 1, size: 20, active: true },
            },
            mapOption: (g: any) => ({
                value: g.id,
                label: `${g.code || `#${g.id}`} - ${g.name || ""}`,
            }),
        },
    },
    base_unit_code: {
        "ui:widget": "select",
    },
    rounding_mode: {
        "ui:widget": "select",
    },
    default_warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho ngầm định",
            dataSource: {
                getList: listWarehouses,
                getById: getWarehouse,
                params: { page: 1, size: 20 },
            },
            mapOption: (w: any) => ({
                value: w.id,
                label: w.name || w.code || `#${w.id}`,
            }),
        },
    },
    description: {
        "ui:classNames": "md:col-span-2 xl:col-span-3",
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}

