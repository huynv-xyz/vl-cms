import { getPort, listPorts } from "@/api/purchasing/port"
import { RJSFSchema, UiSchema } from "@rjsf/utils"

export const shipmentSchema: RJSFSchema = {
    type: "object",
    required: ["code"],
    properties: {
        code: {
            type: "string",
            title: "Mã lô",
            minLength: 1,
        },

        etd: {
            type: "string",
            title: "Ngày đi",
        },

        eta: {
            type: "string",
            title: "Ngày đến",
        },

        ata: {
            type: "string",
            title: "Ngày đến thực tế",
        },

        warehouse_at: {
            type: "string",
            title: "Ngày về kho",
        },

        container_no: {
            type: "string",
            title: "Số container",
        },

        destination_port_id: {
            type: "integer",
            title: "Cảng đến",
        },

        exchange_rate: {
            type: "number",
            title: "Tỷ giá",
            default: 1,
        },

        status: {
            type: "string",
            title: "Trạng thái",
            oneOf: [
                { const: "PLANNED", title: "Kế hoạch" },
                { const: "IN_TRANSIT", title: "Đang đi" },
                { const: "DONE", title: "Hoàn tất" },
                { const: "CANCELLED", title: "Đã hủy" },
            ],
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

export const shipmentUiSchema: UiSchema = {
    etd: { "ui:widget": "date" },
    eta: { "ui:widget": "date" },
    ata: { "ui:widget": "date" },
    warehouse_at: { "ui:widget": "date" },

    exchange_rate: {
        "ui:widget": "text",
        "ui:options": {
            inputType: "text",
        },
    },

    status: {
        "ui:widget": "select",
    },

    destination_port_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn cảng",
            dataSource: {
                getList: listPorts,
                getById: getPort,
                params: { page: 1, size: 20 },
            },
            mapOption: (p: any) => ({
                value: p.id,
                label: `${p.code ?? ""} - ${p.name}`,
            }),
        },
    },
}