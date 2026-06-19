import { Row } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteProduct } from "@/api/product"
import { getMyPermissions } from "@/api/auth/permission"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useProducts } from "./products-provider"
import type { Product } from "../data/schema"

export function ProductRowActions({ row }: { row: Row<Product> }) {
    const { openDetail, openEdit } = useProducts()
    const queryClient = useQueryClient()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canDelete = permissions.some(
        (p) => p.module === "products" && p.action === "delete"
    )

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={
                canDelete
                    ? async (product) => {
                        try {
                            await deleteProduct(product.id)
                            toast.success("Đã xoá sản phẩm")
                            await queryClient.invalidateQueries({ queryKey: ["product"] })
                        } catch (error: any) {
                            const message = error?.message ?? "Xoá sản phẩm thất bại"
                            if (message.includes("tồn tại dữ liệu liên quan")) {
                                toast.error("Không thể xoá sản phẩm", {
                                    description: message,
                                    duration: 12000,
                                })
                            } else {
                                toast.error(message)
                            }
                        }
                    }
                    : undefined
            }
            extraActions={(product) => (
                <DropdownMenuItem onClick={() => openDetail(product)}>
                    Xem chi tiết
                </DropdownMenuItem>
            )}
        />
    )
}
