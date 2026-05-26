import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipProductMapping,
    type UpdateVipProductMappingRequest,
} from "@/api/vip-product-mapping"

import type { VipProductMapping } from "../data/schema"
import { vipProductMappingSchema, vipProductMappingUiSchema } from "./vip-product-mapping-form-schema"
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
    return (
        <CrudFormDialog<VipProductMappingFormValues, UpdateVipProductMappingRequest, unknown>
            title="Cập nhật Mapping hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipProductMappingSchema}
            uiSchema={vipProductMappingUiSchema}
            defaultValues={{
                misa_code: mapping.misa_code,
                product_sub_code: mapping.product_sub_code,
                group_code: mapping.group_code ?? "",
                product_group: mapping.product_group ?? "",
                product_name: mapping.product_name ?? "",
                unit: mapping.unit ?? "",
                conversion_factor: mapping.conversion_factor ?? 1,
                calc_point: mapping.calc_point ?? 1,
                calc_reward: mapping.calc_reward ?? 1,
                is_promotion: mapping.is_promotion ?? 0,
                note: mapping.note ?? "",
                status: mapping.status === 1,
            }}
            submitText="Lưu"
            loadingText="Đang cập nhật..."
            successMessage="Cập nhật mapping hàng hóa thành công"
            errorMessage="Cập nhật mapping hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={updateVipProductMapping}
            mapFormToRequest={(values) => ({
                id: mapping.id,
                misa_code: values.misa_code,
                product_sub_code: values.product_sub_code,
                group_code: values.group_code ?? "",
                product_group: values.product_group ?? "",
                product_name: values.product_name ?? "",
                unit: values.unit ?? "",
                conversion_factor: values.conversion_factor ?? 1,
                calc_point: values.calc_point ?? 1,
                calc_reward: values.calc_reward ?? 1,
                is_promotion: values.is_promotion ?? 0,
                note: values.note ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
