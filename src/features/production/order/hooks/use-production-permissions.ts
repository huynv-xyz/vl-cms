import { useQuery } from "@tanstack/react-query"
import { getMyPermissions, type Permission } from "@/api/auth/permission"

/**
 * Phân quyền theo 3 vai trò KT mô tả trong BA Spec (BR-07):
 *   - KT Kho (kt-kho)            : nhập SL hàng hóa, công cụ. KHÔNG nhập giá trị
 *   - KT Thanh toán (kt-tt)      : nhập giá trị công cụ, chi phí mua hàng
 *   - KT Văn phòng (kt-vp)       : nhập giá trị hàng hóa, chi phí mua hàng
 *
 * Trong hệ thống permission, dùng module "production" với các action:
 *   - production.materials.quantity.update    -> KT Kho
 *   - production.materials.price.update       -> KT TT / KT VP
 *   - production.cost.update                  -> KT TT / KT VP
 *   - production.post                         -> POST chứng từ
 *   - production.unpost                       -> UNPOST chứng từ (admin / sếp)
 *   - production.cancel                       -> Hủy lệnh
 *
 * Nếu user có quyền "production.*" (admin) thì được mở tất cả field.
 */
export type ProductionPermissions = {
    /** Sửa lô, kho, số lượng kế hoạch, số lượng nhập TP */
    canEditQuantity: boolean
    /** Sửa đơn giá, giá thành, chi phí */
    canEditCost: boolean
    /** Thêm, sửa, xóa danh sách vật tư cuối cùng của lệnh SX */
    canAdjustMaterials: boolean
    /** Chỉ định lô ưu tiên (preferred lot) */
    canPickLot: boolean
    /** POST các chứng từ phái sinh */
    canPost: boolean
    /** UNPOST CT đã POSTED để sửa lại */
    canUnpost: boolean
    /** Hủy LSX */
    canCancel: boolean
    /** Loading flag */
    isLoading: boolean
}

const PROD = "production"

function has(permissions: Permission[], action: string) {
    return permissions.some(
        (p) =>
            p.module === PROD &&
            (p.action === action || p.action === "*"),
    )
}

function hasAny(permissions: Permission[], actions: string[]) {
    return actions.some((a) => has(permissions, a))
}

export function useProductionPermissions(): ProductionPermissions {
    const { data: permissions = [], isLoading } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
        staleTime: 5 * 60 * 1000,
    })

    const isAdmin = has(permissions, "*")

    return {
        canEditQuantity:
            isAdmin ||
            hasAny(permissions, [
                "materials.quantity.update",
                "update",
            ]),
        canEditCost:
            isAdmin ||
            hasAny(permissions, [
                "materials.price.update",
                "cost.update",
                "update",
            ]),
        canAdjustMaterials:
            isAdmin ||
            hasAny(permissions, [
                "materials.quantity.update",
                "materials.adjust",
                "update",
            ]),
        canPickLot:
            isAdmin ||
            hasAny(permissions, [
                "materials.quantity.update",
                "materials.pick-lot",
                "update",
            ]),
        canPost: isAdmin || has(permissions, "post"),
        canUnpost: isAdmin || has(permissions, "unpost"),
        canCancel: isAdmin || has(permissions, "cancel"),
        isLoading,
    }
}
