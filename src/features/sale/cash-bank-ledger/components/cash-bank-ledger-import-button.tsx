import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { importCashBankLedgers } from "@/api/cash-bank-ledger"

export function ImportCashBankLedgerButton() {
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

            const count = await importCashBankLedgers(file)

            toast.success(`Import thành công ${count} dòng`)

            await queryClient.invalidateQueries({
                queryKey: ["cash-bank-ledger"],
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