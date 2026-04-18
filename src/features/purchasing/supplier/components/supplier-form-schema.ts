import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listNations, getNation } from "@/api/purchasing/nation"
import { nationOption } from "@/lib/option-mapper"

export const supplierSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: { type: "string", title: "Mã NCC", minLength: 1 },
        name: { type: "string", title: "Tên NCC", minLength: 1 },
        nationId: { type: "integer", title: "Quốc gia" },
    },
} as any

export const buildSupplierUiSchema = (initialOption?: any): UiSchema => ({
    nationId: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn quốc gia",
            initialOption,

            dataSource: {
                getList: listNations,
                getById: getNation,
                params: { page: 1, size: 20 },
            },

            mapOption: nationOption,
        },
    },
})