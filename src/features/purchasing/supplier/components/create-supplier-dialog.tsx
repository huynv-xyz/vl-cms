import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createSupplier } from "@/api/purchasing/supplier"
import { supplierSchema, buildSupplierUiSchema } from "./supplier-form-schema"
import type { SupplierFormValues } from "./types"

export function CreateSupplierDialog({ open, onOpenChange }: any) {
    return (
        <CrudFormDialog<SupplierFormValues, any, unknown>
            title="Tạo nhà cung cấp"
            open={open}
            onOpenChange={onOpenChange}
            schema={supplierSchema}
            uiSchema={buildSupplierUiSchema()}
            defaultValues={{
                code: "",
                name: "",
                nationId: undefined,
            }}
            queryKeyToInvalidate={["suppliers"]}
            mutationFn={createSupplier}
            mapFormToRequest={(v) => ({
                code: v.code,
                name: v.name,
                nation_id: v.nationId,
            })}
        />
    )
}