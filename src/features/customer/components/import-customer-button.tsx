import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { importCustomersExcel } from "@/api/customer"
import { Button } from "@/components/ui/button"

export function ImportCustomerButton() {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setLoading(true)
            const affected = await importCustomersExcel(file)
            toast.success(`Import thành công ${affected ?? 0} dòng khách hàng`)
            await queryClient.invalidateQueries({ queryKey: ["customer"] })
        } catch (error: any) {
            toast.error(error?.message || "Import khách hàng thất bại")
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
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
