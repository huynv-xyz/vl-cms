import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { importInvoiceCustomerAliasesExcel } from "@/api/customer-alias"
import { Button } from "@/components/ui/button"

const IMPORT_MESSAGE =
    "Import tất cả Mã khách hàng xuất hóa đơn, file tối thiểu có các cột: Ma_KH_XuatHD, Ten_KH, Dia_Chi, Ma_So_Thue, Ma_Cong_No_Mac_Dinh"

export function ImportInvoiceAliasesButton() {
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
            const count = await importInvoiceCustomerAliasesExcel(file)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["customer"] }),
                queryClient.invalidateQueries({ queryKey: ["customer-aliases"] }),
            ])
            toast.success(`Import thành công ${count ?? 0} mã KH xuất HĐ`)
        } catch (error: any) {
            toast.error(error?.message || "Import mã KH xuất HĐ thất bại")
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
                {loading ? "Đang import..." : "Import Mã KH xuất HĐ"}
            </Button>
        </>
    )
}
