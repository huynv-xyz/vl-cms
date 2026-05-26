import { CrudDeleteButton } from "@/components/crud/crud-delete-button"
import { deleteVipPointRule } from "@/api/vip-point-rule"

type Props = {
    id: number
}

export function DeleteVipPointRuleButton({ id }: Props) {
    return (
        <CrudDeleteButton
            id={id}
            mutationFn={deleteVipPointRule}
            queryKeyToInvalidate={["vip-point-rule"]}
            idleText="Xoá"
            loadingText="Đang xoá..."
        />
    )
}