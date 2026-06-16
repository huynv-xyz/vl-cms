import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createPhysicalWarehouse,
    type CreatePhysicalWarehouseRequest,
} from "@/api/physical-warehouse"
import {
    physicalWarehouseSchema,
    physicalWarehouseUiSchema,
} from "./physical-warehouse-form-schema"
import type { PhysicalWarehouseFormValues } from "./types"

export function CreatePhysicalWarehouseDialog({ open, onOpenChange }: any) {
    return (
        <CrudFormDialog<
            PhysicalWarehouseFormValues,
            CreatePhysicalWarehouseRequest,
            unknown
        >
            title="Tạo địa điểm kho"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={physicalWarehouseSchema}
            uiSchema={physicalWarehouseUiSchema}
            defaultValues={{
                code: "",
                name: "",
                address: "",
                status: "ACTIVE",
                note: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["physical-warehouse"]}
            mutationFn={createPhysicalWarehouse}
            mapFormToRequest={(v) => ({
                code: v.code?.trim(),
                name: v.name?.trim(),
                address: v.address?.trim() || "",
                status: v.status ?? "ACTIVE",
                note: v.note?.trim() || "",
            })}
        />
    )
}
