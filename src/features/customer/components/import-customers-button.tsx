import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { importCustomersExcel } from "@/api/customer"
import { Button } from "@/components/ui/button"

const IMPORT_MESSAGE =
    "Import danh mục khách hàng, file tối thiểu có các cột: Mã khách hàng, Tên khách hàng, Địa chỉ, Loại KH, MÃ NV, NV phụ trách"

export function ImportCustomersButton() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handlePickFile = () => {
        if (window.confirm(IMPORT_MESSAGE)) {
            inputRef.current?.click()
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setLoading(true)
            const count = await importCustomersExcel(file)
            await queryClient.invalidateQueries({ queryKey: ["customer"] })
            toast.success(`Import thành công ${count ?? 0} khách hàng`)
        } catch (error: any) {
            toast.error(error?.message || "Import danh mục KH thất bại")
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
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
            />
            <Button type="button" variant="outline" disabled={loading} onClick={handlePickFile}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {loading ? "Đang import..." : "Import danh mục KH"}
            </Button>
        </>
    )
}
