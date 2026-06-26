import { SalesTargetDialogForm } from "./sales-target-dialog-form"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateSalesTargetDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <SalesTargetDialogForm
            mode="create"
            open={open}
            onOpenChange={onOpenChange}
        />
    )
}
