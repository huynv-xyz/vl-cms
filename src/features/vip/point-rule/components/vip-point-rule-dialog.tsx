import { CreateVipPointRuleDialog } from "./create-vip-point-rule-dialog"
import { UpdateVipPointRuleDialog } from "./update-vip-point-rule-dialog"
import { useVipPointRules } from "./vip-point-rules-provider"

export function VipPointRuleDiaLog() {
    const { open, currentRow, close } = useVipPointRules()

    return (
        <>
            <CreateVipPointRuleDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipPointRuleDialog
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