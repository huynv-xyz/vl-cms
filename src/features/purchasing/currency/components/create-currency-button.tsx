import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrencies } from "./currencies-provider"

export function CreateCurrencyButton() {
    const { openCreate } = useCurrencies()

    return (
        <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tiền tệ
        </Button>
    )
}
