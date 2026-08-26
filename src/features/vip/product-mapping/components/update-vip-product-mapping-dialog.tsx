import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipProductMapping,
    type UpdateVipProductMappingRequest,
} from "@/api/vip-product-mapping"
import { listVipPointGroups } from "@/api/vip-point-group"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import type { VipProductMapping } from "../data/schema"
import { buildVipProductMappingSchema, vipProductMappingUiSchema } from "./vip-product-mapping-form-schema"
import { validateProductMappingGroupFactor } from "./vip-product-mapping-group-sync"
import type { VipProductMappingFormValues } from "./types"

type Props = {
    mapping: VipProductMapping
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipProductMappingDialog({
    mapping,
    open,
    onOpenChange,
}: Props) {
    const { data: groups = [] } = useQuery({
        queryKey: ["vip-point-group", "product-mapping-form"],
        queryFn: async () => {
            const res = await listVipPointGroups({ page: 1, size: 500, status: 1 })
            return res.items ?? []
        },
        enabled: open,
    })

    return (
        <CrudFormDialog<VipProductMappingFormValues, UpdateVipProductMappingRequest, unknown>
            title="Cập nhật quy tắc điểm hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={buildVipProductMappingSchema(groups)}
            uiSchema={vipProductMappingUiSchema}
            defaultValues={{
                product_group: mapping.product_group ?? "",
                group_code: mapping.group_code ?? "",
                ap_dung: mapping.ap_dung ?? "",
                he_so_hdn: mapping.he_so_hdn ?? 0,
                unit: mapping.unit ?? "",
                customer_code: mapping.customer_code ?? "",
                note: mapping.note ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang cập nhật..."
            successMessage="Cập nhật quy tắc điểm hàng hóa thành công"
            errorMessage="Cập nhật quy tắc điểm hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={updateVipProductMapping}
            beforeSubmit={(values) => {
                const error = validateProductMappingGroupFactor(values, groups)
                if (error) {
                    toast.error(error)
                    return false
                }
                return true
            }}
            mapFormToRequest={(values) => ({
                id: mapping.id,
                product_group: values.product_group ?? "",
                group_code: values.group_code ?? "",
                ap_dung: values.ap_dung ?? "",
                he_so_hdn: values.he_so_hdn ?? 0,
                unit: values.unit ?? "",
                customer_code: values.customer_code ?? "",
                note: values.note ?? "",
            })}
        />
    )
}
