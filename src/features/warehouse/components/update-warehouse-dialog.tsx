
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateWarehouse, type UpdateWarehouseRequest } from "@/api/warehouse"
import { warehouseSchema, warehouseUiSchema } from "./warehouse-form-schema"
import type { WarehouseFormValues } from "./types"

export function UpdateWarehouseDialog({ warehouse, open, onOpenChange }: any) {
    return (
        <CrudFormDialog<WarehouseFormValues, UpdateWarehouseRequest, unknown>
            title="Cập nhật kho"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={warehouseSchema}
            uiSchema={warehouseUiSchema}
            defaultValues={{
                code: warehouse.code ?? "",
                name: warehouse.name,
                address: warehouse.address ?? "",
                physical_warehouse_id: warehouse.physical_warehouse_id,
                status: warehouse.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["warehouse"]}
            mutationFn={updateWarehouse}
            mapFormToRequest={(v) => ({
                id: warehouse.id,
                code: v.code?.trim(),
                name: v.name?.trim(),
                address: v.address?.trim() || "",
                physical_warehouse_id: v.physical_warehouse_id,
                status: v.status ?? "ACTIVE",
            })}
        />
    )
}
