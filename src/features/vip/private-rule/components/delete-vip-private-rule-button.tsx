import { CrudDeleteButton } from "@/components/crud/crud-delete-button"
import { deleteVipPrivateRule } from "@/api/vip-private-rule"

type Props = {
    id: number
}

export function DeleteVipPrivateRuleButton({ id }: Props) {
    return (
        <CrudDeleteButton
            id={id}
            mutationFn={deleteVipPrivateRule}
            queryKeyToInvalidate={["vip-private-rule"]}
            idleText="Xoá"
            loadingText="Đang xoá..."
        />
    )
}