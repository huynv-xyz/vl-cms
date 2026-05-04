import { formatNumber } from "@/lib/utils"
import type { ProductBomDetail } from "../data/schema"

type Props = {
    bom?: ProductBomDetail
    quantityPlan?: number
    isLoading?: boolean
}

export function BomPreview({
    bom,
    quantityPlan = 0,
    isLoading,
}: Props) {
    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Đang tải định mức...</div>
    }

    if (!bom) {
        return (
            <div className="rounded border p-3 text-sm text-muted-foreground">
                Chọn thành phẩm để xem định mức.
            </div>
        )
    }

    if (!bom.items?.length) {
        return (
            <div className="rounded border p-3 text-sm text-muted-foreground">
                Thành phẩm này chưa có định mức.
            </div>
        )
    }

    return (
        <div className="rounded border p-3">
            <div className="mb-2 font-semibold">Định mức chuẩn</div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-2 text-left">Mã vật tư</th>
                        <th className="p-2 text-left">Tên vật tư</th>
                        <th className="p-2 text-right">Định mức / 1 TP</th>
                        <th className="p-2 text-right">SL cần</th>
                    </tr>
                </thead>

                <tbody>
                    {bom.items.map((i) => {
                        const qty = Number(i.quantity ?? 0)
                        const required = qty * Number(quantityPlan ?? 0)

                        return (
                            <tr key={i.id} className="border-b">
                                <td className="p-2">
                                    {i.material_product?.code ?? "-"}
                                </td>
                                <td className="p-2">
                                    {i.material_product?.name ?? "-"}
                                </td>
                                <td className="p-2 text-right">
                                    {formatNumber(qty)}
                                </td>
                                <td className="p-2 text-right font-medium">
                                    {formatNumber(required)}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}