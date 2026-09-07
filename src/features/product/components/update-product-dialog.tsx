import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateProduct, type UpdateProductRequest } from "@/api/product"
import { getProductGroup } from "@/api/product-group"
import { getWarehouse } from "@/api/warehouse"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Product } from "../data/schema"
import { productSchema, productUiSchema } from "./product-form-schema"
import { toProductNatureValue } from "./product-nature"
import type { ProductFormValues } from "./types"
import { useEffect, useRef, useState } from "react"

export function UpdateProductDialog({ product, open, onOpenChange }: any) {
    const lastGroupIdRef = useRef<number | undefined>(product?.group_id)
    const lastWarehouseIdRef = useRef<number | undefined>(product?.default_warehouse_id)
    const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)
    const [pendingConfirm, setPendingConfirm] = useState<ProductSensitiveChangeConfirmState | null>(null)
    const [productCodeUpdateMode, setProductCodeUpdateMode] = useState<"ONLY_PRODUCT" | "SYNC_SNAPSHOTS">("ONLY_PRODUCT")

    useEffect(() => {
        if (open) {
            lastGroupIdRef.current = product?.group_id
            lastWarehouseIdRef.current = product?.default_warehouse_id
            setPendingConfirm(null)
            setProductCodeUpdateMode("ONLY_PRODUCT")
            confirmResolverRef.current = null
        }
    }, [open, product?.group_id, product?.default_warehouse_id])

    return (
        <>
            <CrudFormDialog<ProductFormValues, UpdateProductRequest, unknown>
                title="Cập nhật sản phẩm"
                open={open}
                onOpenChange={onOpenChange}
                hideTrigger
                schema={productSchema}
                uiSchema={productUiSchema}
                defaultValues={{
                    code: product.code,
                    name: product.name,
                    quote_name: product.quote_name ?? "",
                    quote_code: product.quote_code ?? "",
                    misa_material_code: product.misa_material_code ?? "",
                    unit: product.unit ?? "",
                    nature: product.nature ? toProductNatureValue(product.nature) : "",
                    group_id: product.group_id,
                    pricing_group_id: product.pricing_group_id,
                    base_unit_code: product.base_unit_code ?? "KG",
                    sale_unit_code: product.sale_unit_code ?? "",
                    sale_unit_name: product.sale_unit_name ?? "",
                    sale_unit_factor: product.sale_unit_factor ?? 1,
                    size_value: product.size_value,
                    size_unit_code: product.size_unit_code ?? "",
                    rounding_mode: product.rounding_mode ?? "KG_STEP",
                    rounding_unit: product.rounding_unit ?? 1000,
                    vat_rate: product.vat_rate ?? 5,
                    description: product.description ?? "",
                    default_warehouse_id: product.default_warehouse_id,
                    inventory_account_code: product.inventory_account_code ?? "",
                    price_method_override: product.price_method_override ?? undefined,
                    manual_price_vnd: product.manual_price_vnd,
                    status: product.status === 1 ? 1 : 0,
                }}
                submitText="Lưu"
                loadingText="Đang lưu..."
                dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-6xl"
                formClassName="space-y-2"
                objectFieldClassName="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2 xl:grid-cols-3"
                queryKeyToInvalidate={["product"]}
                mutationFn={updateProduct}
                onFormChange={async (v) => {
                    let next = v

                    if (v.group_id !== lastGroupIdRef.current) {
                        lastGroupIdRef.current = v.group_id
                        if (v.group_id) {
                            const group = await getProductGroup(v.group_id)
                            const standardUnit = normalizeProductUnit((group as any)?.standard_unit)
                            if (standardUnit) next = { ...next, unit: standardUnit }
                        }
                    }

                    if (v.default_warehouse_id !== lastWarehouseIdRef.current) {
                        lastWarehouseIdRef.current = v.default_warehouse_id
                        if (v.default_warehouse_id) {
                            const warehouse = await getWarehouse(v.default_warehouse_id)
                            const accountCode = (warehouse as any)?.inventory_account_code?.trim()
                            if (accountCode) next = { ...next, inventory_account_code: accountCode }
                        }
                    }

                    return next
                }}
                beforeSubmit={(v) => confirmProductUpdateRisk(product, v, {
                    openConfirm: (state) => {
                        setProductCodeUpdateMode(state.values.product_code_update_mode || "ONLY_PRODUCT")
                        setPendingConfirm(state)
                        return new Promise<boolean>((resolve) => {
                            confirmResolverRef.current = resolve
                        })
                    },
                })}
                mapFormToRequest={(v) => ({
                    id: product.id,
                    code: v.code,
                    product_code_update_mode: v.product_code_update_mode || "ONLY_PRODUCT",
                    name: v.name,
                    quote_name: v.quote_name?.trim() || undefined,
                    quote_code: v.quote_code?.trim() || undefined,
                    misa_material_code: v.misa_material_code?.trim() || undefined,
                    unit: v.unit?.trim() || "",
                    nature: toProductNatureValue(v.nature?.trim()),
                    group_id: v.group_id,
                    pricing_group_id: v.pricing_group_id,
                    base_unit_code: v.base_unit_code?.trim() || "KG",
                    sale_unit_code: v.sale_unit_code?.trim() || undefined,
                    sale_unit_name: v.sale_unit_name?.trim() || undefined,
                    sale_unit_factor: v.sale_unit_factor || 1,
                    size_value: v.size_value,
                    size_unit_code: v.size_unit_code?.trim() || undefined,
                    rounding_mode: v.rounding_mode?.trim() || "KG_STEP",
                    rounding_unit: v.rounding_unit || 1000,
                    vat_rate: v.vat_rate ?? 5,
                    description: v.description?.trim() || undefined,
                    default_warehouse_id: v.default_warehouse_id,
                    inventory_account_code: v.inventory_account_code?.trim() || undefined,
                    price_method_override: v.price_method_override?.trim() || undefined,
                    manual_price_vnd: v.manual_price_vnd,
                    status: v.status === 0 ? 0 : 1,
                })}
            />

            <ProductSensitiveChangeDialog
                state={pendingConfirm}
                productCodeUpdateMode={productCodeUpdateMode}
                onProductCodeUpdateModeChange={setProductCodeUpdateMode}
                onCancel={() => {
                    confirmResolverRef.current?.(false)
                    confirmResolverRef.current = null
                    setPendingConfirm(null)
                }}
                onConfirm={() => {
                    if (pendingConfirm?.values) {
                        pendingConfirm.values.product_code_update_mode = productCodeUpdateMode
                    }
                    confirmResolverRef.current?.(true)
                    confirmResolverRef.current = null
                    setPendingConfirm(null)
                }}
            />
        </>
    )
}

type ChangeLevel = "NONE" | "BASIC" | "CONFIG" | "SENSITIVE"
type ProductSensitiveChangeConfirmState = {
    product: Product
    values: ProductFormValues
    changeSet: ReturnType<typeof classifyProductChanges>
}

const BASIC_FIELDS = [
    "name",
    "quote_name",
    "quote_code",
    "misa_material_code",
    "description",
    "status",
] as const

const CONFIG_FIELDS = [
    "default_warehouse_id",
    "inventory_account_code",
    "pricing_group_id",
    "rounding_mode",
    "rounding_unit",
    "vat_rate",
    "price_method_override",
    "manual_price_vnd",
] as const

const SENSITIVE_FIELDS = [
    "code",
    "nature",
    "group_id",
    "unit",
    "base_unit_code",
    "sale_unit_code",
    "sale_unit_name",
    "sale_unit_factor",
    "size_value",
    "size_unit_code",
] as const

type ProductSensitiveField = typeof SENSITIVE_FIELDS[number]

const PRODUCT_FIELD_LABELS: Record<string, string> = {
    code: "Mã sản phẩm",
    nature: "Tính chất",
    group_id: "Nhóm VTHH (con)",
    unit: "Đơn vị tính",
    base_unit_code: "Đơn vị chuẩn tính giá",
    sale_unit_code: "Mã đơn vị bán",
    sale_unit_name: "Tên đơn vị bán",
    sale_unit_factor: "Hệ số quy đổi",
    size_value: "Size/quy cách",
    size_unit_code: "Đơn vị size",
}

function confirmProductUpdateRisk(
    product: Product,
    values: ProductFormValues,
    options: { openConfirm: (state: ProductSensitiveChangeConfirmState) => Promise<boolean> }
) {
    const changeSet = classifyProductChanges(product, values)
    if (changeSet.highestLevel === "NONE") {
        toast.info("Không có thay đổi nào để lưu")
        return false
    }

    if (changeSet.highestLevel !== "SENSITIVE") return true

    values.product_code_update_mode = values.product_code_update_mode || "ONLY_PRODUCT"
    return options.openConfirm({ product, values, changeSet })
}

function classifyProductChanges(product: Product, values: ProductFormValues) {
    const oldValues = normalizeComparableProduct(product)
    const newValues = normalizeComparableForm(values)

    const basic = changedFields(BASIC_FIELDS, oldValues, newValues)
    const config = changedFields(CONFIG_FIELDS, oldValues, newValues)
    const sensitive = changedFields(SENSITIVE_FIELDS, oldValues, newValues)
    const changedFieldsAll = [...basic, ...config, ...sensitive]

    const highestLevel: ChangeLevel = sensitive.length
        ? "SENSITIVE"
        : config.length
            ? "CONFIG"
            : basic.length
                ? "BASIC"
                : "NONE"

    return {
        highestLevel,
        changedFields: changedFieldsAll,
        basic,
        config,
        sensitive,
    }
}

function changedFields(
    fields: readonly string[],
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
) {
    return fields.filter((field) => oldValues[field] !== newValues[field])
}

function normalizeComparableProduct(product: Product): Record<string, unknown> {
    return {
        code: normalizeText(product.code),
        name: normalizeText(product.name),
        quote_name: normalizeText(product.quote_name),
        quote_code: normalizeText(product.quote_code),
        misa_material_code: normalizeText(product.misa_material_code),
        unit: normalizeText(product.unit),
        nature: normalizeText(toProductNatureValue(product.nature)),
        group_id: normalizeNumber(product.group_id),
        pricing_group_id: normalizeNumber(product.pricing_group_id),
        base_unit_code: normalizeText(product.base_unit_code || "KG"),
        sale_unit_code: normalizeText(product.sale_unit_code),
        sale_unit_name: normalizeText(product.sale_unit_name),
        sale_unit_factor: normalizeNumber(product.sale_unit_factor ?? 1),
        size_value: normalizeNumber(product.size_value),
        size_unit_code: normalizeText(product.size_unit_code),
        rounding_mode: normalizeText(product.rounding_mode || "KG_STEP"),
        rounding_unit: normalizeNumber(product.rounding_unit ?? 1000),
        vat_rate: normalizeNumber(product.vat_rate ?? 5),
        description: normalizeText(product.description),
        default_warehouse_id: normalizeNumber(product.default_warehouse_id),
        inventory_account_code: normalizeText(product.inventory_account_code),
        price_method_override: normalizeText(product.price_method_override),
        manual_price_vnd: normalizeNumber(product.manual_price_vnd),
        status: product.status === 1 ? 1 : 0,
    }
}

function normalizeComparableForm(values: ProductFormValues): Record<string, unknown> {
    return {
        code: normalizeText(values.code),
        name: normalizeText(values.name),
        quote_name: normalizeText(values.quote_name),
        quote_code: normalizeText(values.quote_code),
        misa_material_code: normalizeText(values.misa_material_code),
        unit: normalizeText(values.unit),
        nature: normalizeText(toProductNatureValue(values.nature)),
        group_id: normalizeNumber(values.group_id),
        pricing_group_id: normalizeNumber(values.pricing_group_id),
        base_unit_code: normalizeText(values.base_unit_code || "KG"),
        sale_unit_code: normalizeText(values.sale_unit_code),
        sale_unit_name: normalizeText(values.sale_unit_name),
        sale_unit_factor: normalizeNumber(values.sale_unit_factor ?? 1),
        size_value: normalizeNumber(values.size_value),
        size_unit_code: normalizeText(values.size_unit_code),
        rounding_mode: normalizeText(values.rounding_mode || "KG_STEP"),
        rounding_unit: normalizeNumber(values.rounding_unit ?? 1000),
        vat_rate: normalizeNumber(values.vat_rate ?? 5),
        description: normalizeText(values.description),
        default_warehouse_id: normalizeNumber(values.default_warehouse_id),
        inventory_account_code: normalizeText(values.inventory_account_code),
        price_method_override: normalizeText(values.price_method_override),
        manual_price_vnd: normalizeNumber(values.manual_price_vnd),
        status: values.status === 0 ? 0 : 1,
    }
}

function normalizeText(value?: string | null) {
    return value?.trim() || ""
}

function normalizeNumber(value?: number | null) {
    return value == null || Number.isNaN(Number(value)) ? null : Number(value)
}

function normalizeProductUnit(value?: string) {
    const normalized = value?.trim().toUpperCase()
    if (!normalized) return ""
    if (normalized === "KG") return "Kg"
    if (normalized === "LIT") return "Lít"
    if (normalized === "TON") return "Tấn"
    return value?.trim() ?? ""
}

function ProductSensitiveChangeDialog({
    state,
    productCodeUpdateMode,
    onProductCodeUpdateModeChange,
    onCancel,
    onConfirm,
}: {
    state: ProductSensitiveChangeConfirmState | null
    productCodeUpdateMode: "ONLY_PRODUCT" | "SYNC_SNAPSHOTS"
    onProductCodeUpdateModeChange: (mode: "ONLY_PRODUCT" | "SYNC_SNAPSHOTS") => void
    onCancel: () => void
    onConfirm: () => void
}) {
    const changedFields = (state?.changeSet.sensitive ?? []) as ProductSensitiveField[]

    return (
        <AlertDialog
            open={Boolean(state)}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onCancel()
            }}
        >
            <AlertDialogContent className="!max-w-4xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận thay đổi trường nhạy cảm</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm">
                            <div>
                                Các trường dưới đây có thể ảnh hưởng cách dữ liệu đã phát sinh được hiểu hoặc hiển thị.
                                Chọn phương pháp áp dụng trước khi lưu.
                            </div>
                            <div className="overflow-auto rounded-md border">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-muted/60">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">Trường</th>
                                            <th className="px-3 py-2 text-left font-medium">Giá trị cũ</th>
                                            <th className="px-3 py-2 text-left font-medium">Giá trị mới</th>
                                            <th className="px-3 py-2 text-left font-medium">Phương pháp áp dụng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {changedFields.map((field) => (
                                            <tr key={field} className="border-t">
                                                <td className="px-3 py-2 align-top font-medium">
                                                    {PRODUCT_FIELD_LABELS[field] || field}
                                                </td>
                                                <td className="px-3 py-2 align-top text-muted-foreground">
                                                    {formatSensitiveValue(state, field, "old")}
                                                </td>
                                                <td className="px-3 py-2 align-top">
                                                    {formatSensitiveValue(state, field, "new")}
                                                </td>
                                                <td className="px-3 py-2 align-top">
                                                    {field === "code" ? (
                                                        <RadioGroup
                                                            value={productCodeUpdateMode}
                                                            onValueChange={(value) => onProductCodeUpdateModeChange(value as "ONLY_PRODUCT" | "SYNC_SNAPSHOTS")}
                                                            className="gap-2"
                                                        >
                                                            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2">
                                                                <RadioGroupItem value="ONLY_PRODUCT" className="mt-0.5" />
                                                                <span>
                                                                    <span className="block font-medium">Chỉ đổi mã danh mục</span>
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        Giữ nguyên mã/tên/ĐVT snapshot trên dữ liệu cũ.
                                                                    </span>
                                                                </span>
                                                            </label>
                                                            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2">
                                                                <RadioGroupItem value="SYNC_SNAPSHOTS" className="mt-0.5" />
                                                                <span>
                                                                    <span className="block font-medium">Đồng bộ dữ liệu cũ</span>
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        Cập nhật mã/tên/ĐVT snapshot theo product_id.
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        </RadioGroup>
                                                    ) : (
                                                        <span className="text-muted-foreground">{sensitiveFieldMethod(field)}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Quay lại</AlertDialogCancel>
                    <Button onClick={onConfirm}>Xác nhận lưu</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function sensitiveFieldMethod(field: ProductSensitiveField) {
    if (field === "unit") {
        return "Áp dụng flow đổi ĐVT hiện có và đồng bộ các bảng liên quan."
    }
    return "Lưu giá trị mới trong danh mục. Flow đồng bộ riêng cho trường này sẽ bổ sung sau."
}

function formatSensitiveValue(
    state: ProductSensitiveChangeConfirmState | null,
    field: ProductSensitiveField,
    side: "old" | "new"
) {
    if (!state) return "-"
    const value = side === "old"
        ? normalizeComparableProductValue(state, field)
        : normalizeComparableFormValue(state, field)
    if (value === null || value === undefined || value === "") return "-"
    return String(value)
}

function normalizeComparableProductValue(state: ProductSensitiveChangeConfirmState, field: ProductSensitiveField) {
    return normalizeComparableProduct(state.product)[field]
}

function normalizeComparableFormValue(state: ProductSensitiveChangeConfirmState, field: ProductSensitiveField) {
    return normalizeComparableForm(state.values)[field]
}
