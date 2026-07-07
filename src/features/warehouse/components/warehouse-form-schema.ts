
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { getPhysicalWarehouse, listPhysicalWarehouses } from "@/api/physical-warehouse"

export const warehouseSchema: RJSFSchema = {
    type: "object",
    required: ["code", "name", "physical_warehouse_id"],
    properties: {
        code: {
            type: "string",
            title: "Mã kho",
            minLength: 1,
        },
        name: {
            type: "string",
            title: "Tên kho",
            minLength: 1,
        },
        address: {
            type: "string",
            title: "Địa chỉ",
        },
        inventory_account_code: {
            type: "string",
            title: "Tài khoản kho",
        },
        physical_warehouse_id: {
            type: "integer",
            title: "Địa điểm kho",
        },
        status: {
            type: "string",
            title: "Trạng thái",
            oneOf: [
                { const: "ACTIVE", title: "Hoạt động" },
                { const: "INACTIVE", title: "Ngừng" },
            ],
            default: "ACTIVE",
        },
    },
    errorMessage: {
        required: {
            name: "Không được để trống tên kho",
        },
    },
} as any

export const warehouseUiSchema: UiSchema = {
    address: {
        "ui:widget": "textarea",
    },
    status: {
        "ui:widget": "select",
    },
    physical_warehouse_id: {
        "ui:widget": "asyncSelect",
        "ui:options": {
            placeholder: "Chọn địa điểm kho",
            searchPlaceholder: "Tìm mã hoặc tên địa điểm kho...",
            dataSource: {
                getList: listPhysicalWarehouses,
                getById: getPhysicalWarehouse,
                params: { page: 1, size: 20, status: "ACTIVE" },
            },
            mapOption: (w: any) => ({
                value: w.id,
                label: w.name || w.code || `#${w.id}`,
            }),
        },
    },
}
