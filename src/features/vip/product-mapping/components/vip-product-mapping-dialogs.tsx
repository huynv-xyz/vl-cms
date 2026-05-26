import { useVipProductMappings } from "./vip-product-mapping-provider"
import { CreateVipProductMappingDialog } from "./create-vip-product-mapping-dialog"
import { UpdateVipProductMappingDialog } from "./update-vip-product-mapping-dialog"

export function VipProductMappingDialogs() {
    const { open, currentRow, close } = useVipProductMappings()

    return (
        <>
            <CreateVipProductMappingDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateVipProductMappingDialog
                    mapping={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}
