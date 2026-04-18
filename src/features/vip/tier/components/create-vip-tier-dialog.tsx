import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createVipTier, type CreateVipTierRequest } from "@/api/vip-tier"

import { vipTierSchema, vipTierUiSchema } from "./vip-tier-form-schema"
import type { VipTierFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipTierDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipTierFormValues, CreateVipTierRequest, unknown>
            title="Tạo VIP Tier"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipTierSchema}
            uiSchema={vipTierUiSchema}
            defaultValues={{
                name: "",
                mb_b2b_point: 0,
                mb_b2b_reward: 0,
                b2c_point: 0,
                b2c_reward: 0,
                b2b_point: 0,
                b2b_reward: 0,
                sort_order: 0,
                note: "",
                status: true,
            }}
            submitText="Tạo VIP Tier"
            loadingText="Đang tạo..."
            successMessage="Tạo VIP Tier thành công"
            errorMessage="Tạo VIP Tier thất bại"
            queryKeyToInvalidate={["vip-tier"]}
            mutationFn={createVipTier}
            dialogClassName="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            mapFormToRequest={(values) => ({
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