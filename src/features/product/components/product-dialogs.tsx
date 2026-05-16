import { CreateProductDialog } from "./create-product-dialog"
import { ProductDetailDialog } from "./product-detail-dialog"
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
                <>
                    <UpdateProductDialog
                        product={currentRow}
                        open={open === "edit"}
                        onOpenChange={(o: any) => !o && close()}
                    />
                    <ProductDetailDialog
                        product={currentRow}
                        open={open === "detail"}
                        onOpenChange={(o) => !o && close()}
                    />
                </>
            )}
        </>
    )
}
