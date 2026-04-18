import { useVipPrivateRules } from "./vip-private-rules-provider"
import { CreateVipPrivateRuleDialog } from "./create-vip-private-rule-dialog"
import { UpdateVipPrivateRuleDialog } from "./update-vip-private-rule-dialog"

export function VipPrivateRuleDialogs() {
    const { open, currentRow, close } = useVipPrivateRules()

    return (
        <>
            <CreateVipPrivateRuleDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipPrivateRuleDialog
                    rule={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}