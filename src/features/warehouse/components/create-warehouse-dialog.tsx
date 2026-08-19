
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createWarehouse, type CreateWarehouseRequest } from "@/api/warehouse"
import { warehouseSchema, warehouseUiSchema } from "./warehouse-form-schema"
import type { WarehouseFormValues } from "./types"

export function CreateWarehouseDialog({ open, onOpenChange }: any) {
    return (
        <CrudFormDialog<WarehouseFormValues, CreateWarehouseRequest, unknown>
            title="Tạo kho"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={warehouseSchema}
            uiSchema={warehouseUiSchema}
            defaultValues={{
                code: "",
                name: "",
                address: "",
                inventory_account_code: "",
                visible_in_sales_inventory_summary: true,
                physical_warehouse_id: undefined,
                status: "ACTIVE",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["warehouse"]}
            mutationFn={createWarehouse}
            mapFormToRequest={(v) => ({
                code: v.code?.trim(),
                name: v.name?.trim(),
                address: v.address?.trim() || "",
                inventory_account_code: v.inventory_account_code?.trim() || undefined,
                visible_in_sales_inventory_summary: v.visible_in_sales_inventory_summary !== false,
                physical_warehouse_id: v.physical_warehouse_id,
                status: v.status ?? "ACTIVE",
            })}
        />
    )
}
