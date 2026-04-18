import { CrudDeleteButton } from "@/components/crud/crud-delete-button"
import { deleteVipTier } from "@/api/vip-tier"

type Props = {
    id: number
}

export function DeleteVipTierButton({ id }: Props) {
    return (
        <CrudDeleteButton
            id={id}
            mutationFn={deleteVipTier}
            queryKeyToInvalidate={["vip-tier"]}
            confirmMessage="Bạn có chắc muốn xoá VIP Tier này không?"
            idleText="Xoá"
            loadingText="Đang xoá..."
        />
    )
}