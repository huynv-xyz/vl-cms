import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listCustomers } from "@/api/customer"
import type { VipPointGroup } from "@/features/vip/point-rule/data/schema"

export function buildVipProductMappingSchema(groups: VipPointGroup[]): RJSFSchema {
    const groupOptions = [
        { const: "", title: "Không gom nhóm" },
        ...groups.map((group) => ({
            const: group.group_code,
            title: group.group_name
                ? `${group.group_code} - ${group.group_name}`
                : group.group_code,
        })),
    ]

    return {
        type: "object",
        required: ["product_group"],
        properties: {
            product_group: {
                type: "string",
                title: "Mã riêng",
            },
            group_code: {
                type: "string",
                title: "Mã chung",
                oneOf: groupOptions,
                default: "",
            },
            ap_dung: {
                type: "string",
                title: "Vùng áp dụng",
                oneOf: [
                    { const: "", title: "Áp dụng tất cả" },
                    { const: "MB", title: "MB" },
                    { const: "MN", title: "MN" },
                ],
                default: "",
            },
            he_so_hdn: {
                type: "number",
                title: "Hệ số HDN",
                default: 0,
            },
            unit: {
                type: "string",
                title: "Đơn vị tính",
                enum: ["Tấn", "Kg", "Lít"],
            },
            customer_code: {
                type: "string",
                title: "Mã khách hàng riêng",
            },
            note: {
                type: "string",
                title: "Ghi chú",
            },
        },
        errorMessage: {
            required: {
                product_group: "Mã riêng không được để trống",
            },
        },
    } as any
}

export const vipProductMappingSchema = buildVipProductMappingSchema([])

export const vipProductMappingUiSchema: UiSchema = {
    product_group: {
        "ui:placeholder": "VD: 912, SILIC, PT50BSD",
    },
    group_code: {
        "ui:widget": "select",
    },
    ap_dung: {
        "ui:widget": "select",
    },
    he_so_hdn: {
        "ui:widget": "updown",
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
