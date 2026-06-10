import { CreateVipPointGroupDialog } from "./create-vip-point-group-dialog"
import { UpdateVipPointGroupDialog } from "./update-vip-point-group-dialog"
import { useVipPointGroups } from "./vip-point-groups-provider"

export function VipPointGroupDialog() {
    const { open, currentRow, close } = useVipPointGroups()

    return (
        <>
            <CreateVipPointGroupDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipPointGroupDialog
                    group={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}
