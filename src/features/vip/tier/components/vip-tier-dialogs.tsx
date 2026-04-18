import { useVipTiers } from "./vip-tiers-provider"
import { CreateVipTierDialog } from "./create-vip-tier-dialog"
import { UpdateVipTierDialog } from "./update-vip-tier-dialog"

export function VipTierDialogs() {
    const { open, currentRow, close } = useVipTiers()

    return (
        <>
            <CreateVipTierDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipTierDialog
                    tier={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}