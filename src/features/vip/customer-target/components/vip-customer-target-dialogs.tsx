import { useVipCustomerTargets } from "./vip-customer-target-provider"
import { CreateVipCustomerTargetDialog } from "./create-vip-customer-target-dialog"
import { UpdateVipCustomerTargetDialog } from "./update-vip-customer-target-dialog"

export function VipCustomerTargetDialogs() {
    const { open, currentRow, close } = useVipCustomerTargets()

    return (
        <>
            <CreateVipCustomerTargetDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipCustomerTargetDialog
                    target={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}
