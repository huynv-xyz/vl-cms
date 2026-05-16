import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { listExports, getExport } from "@/api/sale/export"
import { exportOption } from "@/lib/option-mapper"

const exportDataSource = {
    getList: listExports,
    getById: getExport,
}

export const returnSchema = {
    type: "object",
    required: ["export_id"],
    properties: {

        export_id: {
            type: "integer",
            title: "Phiếu xuất",
        },

        reason: {
            type: "string",
            title: "Lý do trả hàng",
        },
    },
} as any

export const returnUiSchema = {

    export_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn phiếu xuất",
            dataSource: {
                getList: listExports,
                getById: getExport,
            },
            mapOption: exportOption,
        },
    },

    status: {
        "ui:widget": "select",
    },

    reason: {
        "ui:widget": "textarea",
        "ui:classNames": "md:col-span-2",
        "ui:options": { rows: 3 },
    },
}
