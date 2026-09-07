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

        production_date: {
            type: "string",
            title: "Ngày sản xuất",
        },

        expiry_date: {
            type: "string",
            title: "Hạn sử dụng",
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
    code: {
        "ui:classNames": "md:col-span-1",
    },
    warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:classNames": "md:col-span-1",
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
    etd: {
        "ui:widget": "dateFilterInput",
        "ui:classNames": "md:col-span-1",
        "ui:options": { "aria-label": "Ngày đi" },
    },
    eta: {
        "ui:widget": "dateFilterInput",
        "ui:classNames": "md:col-span-1",
        "ui:options": { "aria-label": "Ngày đến" },
    },
    warehouse_at: {
        "ui:widget": "dateFilterInput",
        "ui:classNames": "md:col-span-1",
        "ui:options": { "aria-label": "Ngày về kho" },
    },
    production_date: {
        "ui:widget": "dateFilterInput",
        "ui:classNames": "md:col-span-1",
        "ui:options": { "aria-label": "Ngày sản xuất" },
    },
    expiry_date: {
        "ui:widget": "dateFilterInput",
        "ui:classNames": "md:col-span-1",
        "ui:options": { "aria-label": "Hạn sử dụng" },
    },

    container_no: {
        "ui:classNames": "md:col-span-1",
    },

    exchange_rate: {
        "ui:widget": "text",
        "ui:classNames": "md:col-span-1",
        "ui:options": {
            inputType: "text",
        },
    },

    status: {
        "ui:widget": "select",
        "ui:classNames": "md:col-span-1",
    },

    destination_port_id: {
        "ui:widget": "asyncSelect",
        "ui:classNames": "md:col-span-1",
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

    note: {
        "ui:classNames": "md:col-span-2 xl:col-span-4",
    },
}
