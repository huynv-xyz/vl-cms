import { getPort, listPorts } from "@/api/purchasing/port"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { RJSFSchema, UiSchema } from "@rjsf/utils"
import { SHIPMENT_STATUS_FORM_OPTIONS } from "../data/shipment-status"

export const shipmentSchema: RJSFSchema = {
    type: "object",
    required: ["code", "warehouse_id"],
    properties: {
        code: {
            type: "string",
            title: "Mã lô",
            minLength: 1,
        },

        warehouse_id: {
            type: "integer",
            title: "Kho",
        },

        etd: {
            type: "string",
            title: "Ngày đi",
        },

        eta: {
            type: "string",
            title: "Ngày đến",
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
            oneOf: SHIPMENT_STATUS_FORM_OPTIONS,
        },

        note: {
            type: "string",
            title: "Ghi chú",
        },
    },
} as any

export const shipmentUiSchema: UiSchema = {
    etd: {
        "ui:widget": "datePicker",
        "ui:options": { placeholder: "Chọn ngày đi" },
    },
    eta: {
        "ui:widget": "datePicker",
        "ui:options": { placeholder: "Chọn ngày đến" },
    },
    warehouse_at: {
        "ui:widget": "datePicker",
        "ui:options": { placeholder: "Chọn ngày về kho" },
    },

    exchange_rate: {
        "ui:widget": "text",
        "ui:options": {
            inputType: "text",
        },
    },

    status: {
        "ui:widget": "select",
    },

    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn kho",
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
