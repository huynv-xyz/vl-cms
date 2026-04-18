import React from "react"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateSupplier } from "@/api/purchasing/supplier"
import { supplierSchema, buildSupplierUiSchema } from "./supplier-form-schema"
import type { SupplierFormValues } from "./types"

export function UpdateSupplierDialog({ supplier, open, onOpenChange }: any) {
    const initialNationOption = supplier?.nation_id
        ? {
            value: Number(supplier.nation_id),
            label: `${supplier.nation?.name ?? ""}${supplier.nation?.code ? ` (${supplier.nation.code})` : ""
                }`,
            raw: supplier.nation,
        }
        : null

    const uiSchema = React.useMemo(
        () => buildSupplierUiSchema(initialNationOption),
        [supplier?.id]
    )

    return (
        <CrudFormDialog<SupplierFormValues, any, unknown>
            key={supplier?.id}
            title="Cập nhật NCC"
            open={open}
            onOpenChange={onOpenChange}
            schema={supplierSchema}
            uiSchema={uiSchema}
            defaultValues={{
                code: supplier.code,
                name: supplier.name,
                nationId: Number(supplier.nation_id),
            }}
            queryKeyToInvalidate={["suppliers"]}
            mutationFn={updateSupplier}
            mapFormToRequest={(v) => ({
                id: supplier.id,
                code: v.code,
                name: v.name,
                nation_id: v.nationId,
            })}
        />
    )
}