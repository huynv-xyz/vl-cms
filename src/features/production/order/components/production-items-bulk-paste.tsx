import { useState } from "react"
import { ClipboardPaste } from "lucide-react"
import { toast } from "sonner"

import { listProducts } from "@/api/product"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type ProductionItemDraft = {
    product_id?: number
    product?: any
    quantity_plan: number
    quantity_done: number
    note?: string
}

type Props = {
    disabled?: boolean
    effectiveDate?: string
    onApply: (items: ProductionItemDraft[]) => void
}

export function ProductionItemsBulkPaste({ disabled, effectiveDate, onApply }: Props) {
    const [codesText, setCodesText] = useState("")
    const [quantitiesText, setQuantitiesText] = useState("")
    const [isApplying, setIsApplying] = useState(false)

    const applyPaste = async () => {
        const codes = parseCells(codesText)
        const quantities = parseCells(quantitiesText).map(parseQuantity)

        if (!codes.length && !quantities.length) {
            toast.error("Hãy dán mã sản phẩm hoặc số lượng trước")
            return
        }

        setIsApplying(true)
        try {
            const products = await Promise.all(codes.map((code) => findProductByCode(code, effectiveDate)))
            const missingCodes = codes.filter((_, index) => !products[index])
            const rowCount = Math.max(codes.length, quantities.length)
            const rows: ProductionItemDraft[] = Array.from({ length: rowCount }, (_, index) => {
                const product = products[index]
                const quantity = quantities[index] ?? 1

                return {
                    product_id: product?.id,
                    product,
                    quantity_plan: quantity,
                    quantity_done: quantity,
                }
            })

            onApply(rows.length ? rows : [{ quantity_plan: 1, quantity_done: 1 }])

            if (missingCodes.length) {
                toast.warning(`Không tìm thấy thành phẩm có BOM hiệu lực: ${missingCodes.join(", ")}`)
            } else {
                toast.success(`Đã áp dụng ${rows.length} dòng thành phẩm`)
            }
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <Textarea
                    value={codesText}
                    onChange={(event) => setCodesText(event.target.value)}
                    placeholder="Dán mã sản phẩm, mỗi dòng một mã"
                    className="min-h-24 resize-y"
                    disabled={disabled || isApplying}
                />
                <Textarea
                    value={quantitiesText}
                    onChange={(event) => setQuantitiesText(event.target.value)}
                    placeholder="Dán số lượng tương ứng"
                    className="min-h-24 resize-y"
                    disabled={disabled || isApplying}
                />
                <div className="flex items-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={applyPaste}
                        disabled={disabled || isApplying}
                        className="w-full"
                    >
                        <ClipboardPaste className="mr-2 h-4 w-4" />
                        {isApplying ? "Đang áp dụng..." : "Áp dụng"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function parseCells(text: string) {
    return text
        .split(/\r?\n|\t|;/)
        .map((value) => value.trim())
        .filter(Boolean)
}

function parseQuantity(value: string) {
    const compact = value.replace(/\s/g, "")
    const lastComma = compact.lastIndexOf(",")
    const lastDot = compact.lastIndexOf(".")
    const decimalSeparator =
        lastComma >= 0 && lastDot >= 0
            ? lastComma > lastDot
                ? ","
                : "."
            : lastComma >= 0
              ? ","
              : "."
    const thousandsSeparator = decimalSeparator === "," ? "." : ","
    const normalized = compact
        .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
        .replace(decimalSeparator, ".")
    const quantity = Number(normalized)
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

async function findProductByCode(code: string, effectiveDate?: string) {
    const result = await listProducts({
        page: 1,
        size: 50,
        keyword: code,
        status: "1",
        has_bom: true,
        effective_date: effectiveDate,
    })

    const normalizedCode = normalizeCode(code)
    return result.items.find((product) => normalizeCode(product.code) === normalizedCode)
}

function normalizeCode(code?: string) {
    return code?.trim().toLowerCase() ?? ""
}
