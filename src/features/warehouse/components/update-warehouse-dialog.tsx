
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
                name: warehouse.name,
                address: warehouse.address ?? "",
                status: warehouse.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["warehouse"]}
            mutationFn={updateWarehouse}
            mapFormToRequest={(v) => ({
                id: warehouse.id,
                name: v.name,
                address: v.address?.trim() || "",
                status: v.status ?? "ACTIVE",
            })}
        />
    )
}
