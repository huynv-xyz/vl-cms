import { useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { importTransactionsFile, type ImportTransactionsResponse } from "@/api/transactions"

type ImportTransactionButtonProps = {
    disabled?: boolean
    onSuccess?: (result: ImportTransactionsResponse) => void
    onError?: (error: Error) => void
    onUploadingChange?: (uploading: boolean) => void
}

export function ImportTransactionButton({
    disabled,
    onSuccess,
    onError,
    onUploadingChange,
}: ImportTransactionButtonProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleOpenFilePicker = () => {
        if (disabled) return
        inputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        event.currentTarget.value = ""

        if (!file) return

        try {
            onUploadingChange?.(true)
            const result = await importTransactionsFile(file)
            onSuccess?.(result)
        } catch (error) {
            onError?.(error as Error)
        } finally {
            onUploadingChange?.(false)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.xlsb,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileChange}
            />

            <Button variant="outline" onClick={handleOpenFilePicker} disabled={disabled}>
                <Upload className="size-4" />
                Import Excel
            </Button>
        </>
    )
}
