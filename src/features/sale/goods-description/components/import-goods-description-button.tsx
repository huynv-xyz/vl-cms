import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { importGoodsDescriptions } from "@/api/sale/goods-description"
import { Button } from "@/components/ui/button"

export function ImportGoodsDescriptionButton() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setLoading(true)
            const res = await importGoodsDescriptions(file)
            toast.success(`Import thành công ${res?.affected ?? 0} mô tả HH`)
            await queryClient.invalidateQueries({ queryKey: ["goods-descriptions"] })
        } catch (error: any) {
            toast.error(error?.message || "Import file thất bại")
        } finally {
            setLoading(false)
            e.target.value = ""
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                Import Excel
            </Button>
        </>
    )
}
