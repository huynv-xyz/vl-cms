import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import type { VipPointGroup } from "../data/schema"

export function buildVipPointRuleSchema(groups: VipPointGroup[]): RJSFSchema {
    const groupOptions = groups.map((group) => ({
        const: group.group_code,
        title: group.group_name
            ? `${group.group_code} - ${group.group_name}`
            : group.group_code,
    }))

    return {
        type: "object",
        required: ["vthh_con", "group_code"],
        properties: {
            vthh_con: {
                type: "string",
                title: "VTHH Con",
                minLength: 1,
                errorMessage: {
                    minLength: "VTHH Con không được để trống",
                },
            },
            from_value: {
                type: "number",
                title: "Từ giá trị",
                default: 0,
            },
            to_value: {
                type: "number",
                title: "Đến giá trị",
                default: 0,
            },
            group_code: {
                type: "string",
                title: "Mã chung",
                oneOf: groupOptions,
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
            nhom_tinh_diem: {
                type: "string",
                title: "Nhóm tính điểm",
            },
            unit: {
                type: "string",
                title: "Đơn vị tính",
                enum: ["Tấn", "Kg", "Lít"],
            },
            description: {
                type: "string",
                title: "Diễn giải",
            },
            note: {
                type: "string",
                title: "Ghi chú",
            },
        },
        errorMessage: {
            required: {
                vthh_con: "VTHH Con không được để trống",
                group_code: "Mã chung không được để trống",
            },
        },
    } as any
}

export const vipPointRuleSchema = buildVipPointRuleSchema([])

export const vipPointRuleUiSchema: UiSchema = {
    he_so_mb: {
        "ui:disabled": true,
    },
    he_so_mn: {
        "ui:disabled": true,
    },
    unit: {
        "ui:disabled": true,
    },
    note: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 4,
        },
    },
    description: {
        "ui:widget": "textarea",
        "ui:options": {
            rows: 2,
        },
    },
}
