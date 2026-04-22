import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { importProducts } from "@/api/product"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function ImportProductButton() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handlePickFile = () => {
        inputRef.current?.click()
    }

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setLoading(true)

            const res = await importProducts(file)

            toast.success(`Import thành công ${res?.affected ?? 0} sản phẩm`)

            await queryClient.invalidateQueries({
                queryKey: ["product"],
            })
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
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
            />

            <Button
                type="button"
                variant="outline"
                onClick={handlePickFile}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                Import CSV
            </Button>
        </>
    )
}