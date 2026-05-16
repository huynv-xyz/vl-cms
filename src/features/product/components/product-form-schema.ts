import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listProductGroups } from "@/api/product-group"
import { getWarehouse, listWarehouses } from "@/api/warehouse"

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
        group_code: {
            type: "string",
            title: "Nhóm sản phẩm",
        },
        default_warehouse_id: {
            type: "integer",
            title: "Kho ngầm định",
        },
        inventory_account_code: {
            type: "string",
            title: "TK kho",
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
    "ui:order": [
        "code",
        "name",
        "unit",
        "nature",
        "group_code",
        "default_warehouse_id",
        "inventory_account_code",
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
    group_code: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn nhóm sản phẩm",
            searchPlaceholder: "Tìm mã hoặc tên nhóm...",
            dataSource: {
                getList: listProductGroups,
                getById: getProductGroupByCode,
                params: { page: 1, size: 20 },
            },
            mapOption: (g: any) => ({
                value: g.code,
                label: `${g.code || `#${g.id}`} - ${g.name || ""}`,
            }),
        },
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
                label: w.name,
            }),
        },
    },
    description: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 3,
        },
    },
}

async function getProductGroupByCode(code: string) {
    const res: any = await listProductGroups({ page: 1, size: 20, keyword: code })
    const items = res?.items ?? res?.data?.items ?? []
    return items.find((item: any) => String(item.code) === String(code)) ?? items[0]
}
