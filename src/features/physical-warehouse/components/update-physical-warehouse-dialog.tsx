import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updatePhysicalWarehouse,
    type UpdatePhysicalWarehouseRequest,
} from "@/api/physical-warehouse"
import {
    physicalWarehouseSchema,
    physicalWarehouseUiSchema,
} from "./physical-warehouse-form-schema"
import type { PhysicalWarehouseFormValues } from "./types"
import type { PhysicalWarehouse } from "../data/schema"

export function UpdatePhysicalWarehouseDialog({
    physicalWarehouse,
    open,
    onOpenChange,
}: {
    physicalWarehouse: PhysicalWarehouse
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <CrudFormDialog<
            PhysicalWarehouseFormValues,
            UpdatePhysicalWarehouseRequest,
            unknown
        >
            title="Cập nhật địa điểm kho"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={physicalWarehouseSchema}
            uiSchema={physicalWarehouseUiSchema}
            defaultValues={{
                code: physicalWarehouse.code ?? "",
                name: physicalWarehouse.name ?? "",
                address: physicalWarehouse.address ?? "",
                status:
                    physicalWarehouse.status === "INACTIVE"
                        ? "INACTIVE"
                        : "ACTIVE",
                note: physicalWarehouse.note ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["physical-warehouse"]}
            mutationFn={updatePhysicalWarehouse}
            mapFormToRequest={(v) => ({
                id: physicalWarehouse.id,
                code: v.code?.trim(),
                name: v.name?.trim(),
                address: v.address?.trim() || "",
                status: v.status ?? "ACTIVE",
                note: v.note?.trim() || "",
            })}
        />
    )
}
