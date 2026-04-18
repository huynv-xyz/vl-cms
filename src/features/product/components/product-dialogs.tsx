import { CreateProductDialog } from "./create-product-dialog"
import { UpdateProductDialog } from "./update-product-dialog"
import { useProducts } from "./products-provider"

export function ProductDialogs() {
    const { open, currentRow, close } = useProducts()

    return (
        <>
            <CreateProductDialog
                open={open === "create"}
                onOpenChange={(o: any) => !o && close()}
            />

            {currentRow && (
                <UpdateProductDialog
                    product={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o: any) => !o && close()}
                />
            )}
        </>
    )
}