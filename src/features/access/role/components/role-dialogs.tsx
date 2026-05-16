import { CreateRoleDialog } from "./create-role-dialog"
import { UpdateRoleDialog } from "./update-role-dialog"
import { useAccessRoles } from "./roles-provider"

export function RoleDialogs() {
    const { open, currentRow, close } = useAccessRoles()

    return (
        <>
            <CreateRoleDialog
                open={open === "create"}
                onOpenChange={(next) => {
                    if (!next) close()
                }}
            />

            {currentRow && (
                <UpdateRoleDialog
                    role={currentRow}
                    open={open === "edit"}
                    onOpenChange={(next) => {
                        if (!next) close()
                    }}
                />
            )}
        </>
    )
}
