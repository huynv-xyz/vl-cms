import { CreateGoodsDescriptionDialog } from "./create-goods-description-dialog"
import { useGoodsDescriptions } from "./goods-descriptions-provider"
import { UpdateGoodsDescriptionDialog } from "./update-goods-description-dialog"

export function GoodsDescriptionDialogs() {
    const { open, currentRow, close } = useGoodsDescriptions()

    return (
        <>
            <CreateGoodsDescriptionDialog
                open={open === "create"}
                onOpenChange={(isOpen) => !isOpen && close()}
            />

            {currentRow && (
                <UpdateGoodsDescriptionDialog
                    item={currentRow}
                    open={open === "edit"}
                    onOpenChange={(isOpen) => !isOpen && close()}
                />
            )}
        </>
    )
}
