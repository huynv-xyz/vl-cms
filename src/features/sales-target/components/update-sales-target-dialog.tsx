import type { SalesTarget } from "../data/schema"
import { SalesTargetDialogForm } from "./sales-target-dialog-form"

type Props = {
    salesTarget: SalesTarget
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateSalesTargetDialog({
    salesTarget,
    open,
    onOpenChange,
}: Props) {
    return (
        <SalesTargetDialogForm
            mode="edit"
            salesTarget={salesTarget}
            open={open}
            onOpenChange={onOpenChange}
        />
    )
}
