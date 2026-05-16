import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { importVthhBoms } from "@/api/production/bom"
import { Button } from "@/components/ui/button"

function stat(result: Record<string, any>, snakeKey: string, camelKey: string) {
    return Number(result[snakeKey] ?? result[camelKey] ?? 0)
}

export function ImportVthhBomButton() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            toast.error("Vui lòng chọn file Excel .xlsx")
            event.target.value = ""
            return
        }

        try {
            setLoading(true)
            const result = await importVthhBoms(file, {
                version: "VTHH-IMPORT-20260515",
                valid_from: "2026-01-01",
                replace: true,
            })

            const importedBoms = stat(result, "imported_boms", "importedBoms")
            const importedBomItems = stat(result, "imported_bom_items", "importedBomItems")
            const createdProducts = stat(result, "created_products", "createdProducts")
            const updatedProducts = stat(result, "updated_products", "updatedProducts")

            toast.success(
                `Import thành công ${importedBoms} BOM, ${importedBomItems} dòng vật tư. Sản phẩm: +${createdProducts}, cập nhật ${updatedProducts}`
            )

            await queryClient.invalidateQueries({
                queryKey: ["product-boms"],
                refetchType: "active",
            })
            await queryClient.invalidateQueries({
                queryKey: ["product"],
                refetchType: "active",
            })
        } catch (error: any) {
            toast.error(error?.message || "Import Excel thất bại")
        } finally {
            setLoading(false)
            event.target.value = ""
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileChange}
            />

            <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                Import Excel
            </Button>
        </>
    )
}
