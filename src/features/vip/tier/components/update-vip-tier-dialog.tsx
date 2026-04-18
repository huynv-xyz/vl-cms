import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateVipTier, type UpdateVipTierRequest } from "@/api/vip-tier"

import type { VipTier } from "../data/schema"
import { vipTierSchema, vipTierUiSchema } from "./vip-tier-form-schema"
import type { VipTierFormValues } from "./types"

type Props = {
    tier: VipTier
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipTierDialog({
    tier,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipTierFormValues, UpdateVipTierRequest, unknown>
            title="Chỉnh sửa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipTierSchema}
            uiSchema={vipTierUiSchema}
            defaultValues={{
                name: tier.name,
                mb_b2b_point: tier.mb_b2b_point ?? 0,
                mb_b2b_reward: tier.mb_b2b_reward ?? 0,
                b2c_point: tier.b2c_point ?? 0,
                b2c_reward: tier.b2c_reward ?? 0,
                b2b_point: tier.b2b_point ?? 0,
                b2b_reward: tier.b2b_reward ?? 0,
                sort_order: tier.sort_order ?? 0,
                note: tier.note ?? "",
                status: tier.status === 1,
            }}
            queryKeyToInvalidate={["vip-tier"]}
            mutationFn={updateVipTier}
            dialogClassName="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            mapFormToRequest={(values) => ({
                id: tier.id,
                name: values.name,
                mb_b2b_point: values.mb_b2b_point ?? 0,
                mb_b2b_reward: values.mb_b2b_reward ?? 0,
                b2c_point: values.b2c_point ?? 0,
                b2c_reward: values.b2c_reward ?? 0,
                b2b_point: values.b2b_point ?? 0,
                b2b_reward: values.b2b_reward ?? 0,
                sort_order: values.sort_order ?? 0,
                note: values.note?.trim() ? values.note.trim() : "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}