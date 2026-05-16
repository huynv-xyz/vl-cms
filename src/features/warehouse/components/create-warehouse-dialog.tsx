
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
                name: "",
                address: "",
                status: "ACTIVE",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["warehouse"]}
            mutationFn={createWarehouse}
            mapFormToRequest={(v) => ({
                name: v.name,
                address: v.address?.trim() || "",
                status: v.status ?? "ACTIVE",
            })}
        />
    )
}
