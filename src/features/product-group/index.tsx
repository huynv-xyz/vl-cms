import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { toast } from "sonner"

import {
    createProductGroup,
    deleteProductGroup,
    listAllProductGroups,
    listParentVthhOptions,
    updateProductGroup,
    type ParentVthhOption,
} from "@/api/product-group"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { CrudTable } from "@/components/crud/crud-table"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { cn, formatNumber } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/product-groups"
import type { ProductGroup } from "./data/schema"

export default function ProductGroupPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])
    const [openCreate, setOpenCreate] = useState(false)
    const [editing, setEditing] = useState<ProductGroup | null>(null)
    const { deleteById } = useCrudDelete(deleteProductGroup, ["product-groups"])

    const { data, isLoading, error } = usePaginatedList(
        ["product-groups", search.page, search.size, keyword],
        listAllProductGroups,
        { page: search.page, size: search.size, keyword }
    )

    const columns = useMemo<ColumnDef<ProductGroup>[]>(() => [
        buildIndexColumn<ProductGroup>(),
        { accessorKey: "code", header: "Mã nhóm" },
        { accessorKey: "name", header: "Tên nhóm" },
        {
            accessorKey: "parent_vthh_name",
            header: "Nhóm VTHH",
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="truncate font-medium">{row.original.parent_vthh_name || "-"}</div>
                    {row.original.parent_vthh_code ? (
                        <div className="text-muted-foreground truncate font-mono text-xs">
                            {row.original.parent_vthh_code}
                        </div>
                    ) : null}
                </div>
            ),
        },
        { accessorKey: "standard_unit", header: "Đơn vị chuẩn" },
        {
            accessorKey: "default_margin_value",
            header: "LN",
            cell: ({ row }) => `${formatNumber(row.original.default_margin_value ?? 0)}${row.original.default_margin_type === "AMOUNT" ? " đ" : "%"}`,
        },
        {
            accessorKey: "default_vat_rate",
            header: "VAT %",
            cell: ({ row }) => formatNumber(row.original.default_vat_rate ?? 0),
        },
        {
            accessorKey: "active",
            header: "Trạng thái",
            cell: ({ row }) => row.original.active === false ? "Ngừng dùng" : "Đang dùng",
        },
        buildActionsColumn<ProductGroup>({
            renderActions: (_, row) => (
                <CrudRowActions
                    row={row.original}
                    onEdit={(item) => setEditing(item)}
                    onDelete={(item) => deleteById(item.id)}
                />
            ),
        }),
    ], [deleteById])

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Nhóm sản phẩm"
            description="Quản lý nhóm sản phẩm dùng chung cho sản phẩm, tính giá và báo giá."
            actions={<Button onClick={() => setOpenCreate(true)}><Plus className="mr-2 h-4 w-4" />Thêm nhóm</Button>}
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <CrudTable
                        data={data.items}
                        columns={columns}
                        entityName="nhóm sản phẩm"
                        searchPlaceholder="Tìm mã hoặc tên nhóm..."
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                    />
                    <ProductGroupDialog
                        title="Thêm nhóm sản phẩm"
                        open={openCreate}
                        onOpenChange={setOpenCreate}
                        mutationFn={createProductGroup}
                    />
                    {editing && (
                        <ProductGroupDialog
                            title="Sửa nhóm sản phẩm"
                            open={!!editing}
                            onOpenChange={(open) => !open && setEditing(null)}
                            entity={editing}
                            mutationFn={(body) => updateProductGroup({ ...body, id: editing.id })}
                        />
                    )}
                </div>
            )}
        </PageSection>
    )
}

function ProductGroupDialog({
    title,
    open,
    onOpenChange,
    entity,
    mutationFn,
}: {
    title: string
    open: boolean
    onOpenChange: (open: boolean) => void
    entity?: ProductGroup
    mutationFn: (body: Partial<ProductGroup>) => Promise<any>
}) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<ProductGroupForm>(() => buildForm(entity))
    const [isNewParent, setIsNewParent] = useState(false)
    const [parentOpen, setParentOpen] = useState(false)

    const optionsQuery = useQuery({
        queryKey: ["product-groups", "parent-vthh-options"],
        queryFn: listParentVthhOptions,
        enabled: open,
    })

    const options = optionsQuery.data ?? []

    useEffect(() => {
        if (!open) return
        const next = buildForm(entity)
        setForm(next)
        setIsNewParent(false)
        setParentOpen(false)
    }, [entity, open])

    const mutation = useMutation({
        mutationFn: (body: Partial<ProductGroup>) => mutationFn(body),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["product-groups"] }),
                queryClient.invalidateQueries({ queryKey: ["product-groups", "parent-vthh-options"] }),
            ])
            toast.success("Thao tác thành công")
            onOpenChange(false)
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Thao tác thất bại")
        },
    })

    const updateField = <K extends keyof ProductGroupForm>(key: K, value: ProductGroupForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const selectParent = (option: ParentVthhOption) => {
        setIsNewParent(false)
        setParentOpen(false)
        setForm((current) => ({
            ...current,
            parent_vthh_code: option.code,
            parent_vthh_name: option.name || option.code,
        }))
    }

    const clearParent = () => {
        setIsNewParent(false)
        setParentOpen(false)
        setForm((current) => ({
            ...current,
            parent_vthh_code: "",
            parent_vthh_name: "",
        }))
    }

    const startCreateParent = () => {
        setIsNewParent(true)
        setParentOpen(false)
        setForm((current) => ({
            ...current,
            parent_vthh_code: "",
            parent_vthh_name: "",
        }))
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const parentCode = form.parent_vthh_code.trim()
        const parentName = form.parent_vthh_name.trim()

        if (isNewParent && (!parentCode || !parentName)) {
            toast.warning("Nhập đủ mã và tên Nhóm VTHH mới")
            return
        }

        if (isNewParent) {
            const duplicate = findDuplicateParentOption(options, parentCode, parentName)
            if (duplicate) {
                toast.warning(`Nhóm VTHH đã tồn tại: ${parentOptionLabel(duplicate)}`)
                return
            }
        }

        mutation.mutate({
            code: form.code.trim(),
            name: form.name.trim(),
            parent_vthh_code: parentName ? parentCode : "",
            parent_vthh_name: parentName,
            description: form.description.trim(),
            standard_unit: form.standard_unit || "KG",
            default_price_method: (form.default_price_method || "LATEST") as ProductGroup["default_price_method"],
            default_margin_type: (form.default_margin_type || "PERCENT") as ProductGroup["default_margin_type"],
            default_margin_value: Number(form.default_margin_value || 0),
            default_vat_rate: Number(form.default_vat_rate || 5),
            active: form.active !== false,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-4xl">
                <DialogHeader className="shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Mã nhóm" required>
                            <Input
                                value={form.code}
                                onChange={(event) => updateField("code", event.target.value)}
                                required
                            />
                        </Field>
                        <Field label="Tên nhóm" required>
                            <Input
                                value={form.name}
                                onChange={(event) => updateField("name", event.target.value)}
                                required
                            />
                        </Field>
                        <Field label="Nhóm VTHH">
                            <ParentVthhSelect
                                open={parentOpen}
                                onOpenChange={setParentOpen}
                                options={options}
                                value={isNewParent ? "" : form.parent_vthh_code}
                                displayValue={parentOptionLabel({
                                    code: form.parent_vthh_code,
                                    name: form.parent_vthh_name,
                                })}
                                isCreating={isNewParent}
                                onSelect={selectParent}
                                onClear={clearParent}
                                onCreate={startCreateParent}
                            />
                        </Field>
                        {isNewParent ? (
                            <>
                                <Field label="Mã nhóm VTHH mới" required>
                                    <Input
                                        value={form.parent_vthh_code}
                                        onChange={(event) => updateField("parent_vthh_code", event.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Tên nhóm VTHH mới" required>
                                    <Input
                                        value={form.parent_vthh_name}
                                        onChange={(event) => updateField("parent_vthh_name", event.target.value)}
                                        required
                                    />
                                </Field>
                            </>
                        ) : null}
                        <Field label="Đơn vị chuẩn">
                            <NativeSelect
                                value={form.standard_unit}
                                onChange={(value) => updateField("standard_unit", value)}
                                options={[
                                    ["TON", "Tấn"],
                                    ["KG", "Kg"],
                                    ["LIT", "Lít"],
                                ]}
                            />
                        </Field>
                        <Field label="Cách lấy giá mặc định">
                            <NativeSelect
                                value={form.default_price_method}
                                onChange={(value) => updateField("default_price_method", value)}
                                options={[
                                    ["LATEST", "Giá gần nhất"],
                                    ["FIFO", "Giá cũ nhất (FIFO)"],
                                    ["MONTHLY_AVERAGE", "Bình quân tháng"],
                                ]}
                            />
                        </Field>
                        <Field label="Kiểu lợi nhuận">
                            <NativeSelect
                                value={form.default_margin_type}
                                onChange={(value) => updateField("default_margin_type", value)}
                                options={[
                                    ["PERCENT", "Theo %"],
                                    ["AMOUNT", "Số tiền"],
                                ]}
                            />
                        </Field>
                        <Field label="Lợi nhuận mặc định">
                            <Input
                                type="number"
                                value={form.default_margin_value}
                                onChange={(event) => updateField("default_margin_value", Number(event.target.value))}
                            />
                        </Field>
                        <Field label="VAT %">
                            <Input
                                type="number"
                                value={form.default_vat_rate}
                                onChange={(event) => updateField("default_vat_rate", Number(event.target.value))}
                            />
                        </Field>
                        <Field label="Trạng thái">
                            <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.active !== false}
                                    onChange={(event) => updateField("active", event.target.checked)}
                                />
                                Đang dùng
                            </label>
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Ghi chú">
                                <Textarea
                                    value={form.description}
                                    onChange={(event) => updateField("description", event.target.value)}
                                    rows={3}
                                />
                            </Field>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 mt-4 bg-background pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

type ProductGroupForm = {
    code: string
    name: string
    parent_vthh_code: string
    parent_vthh_name: string
    description: string
    standard_unit: string
    default_price_method: string
    default_margin_type: string
    default_margin_value: number
    default_vat_rate: number
    active: boolean
}

function buildForm(entity?: ProductGroup): ProductGroupForm {
    return {
        code: entity?.code ?? "",
        name: entity?.name ?? "",
        parent_vthh_code: entity?.parent_vthh_code ?? "",
        parent_vthh_name: entity?.parent_vthh_name ?? "",
        description: entity?.description ?? "",
        standard_unit: entity?.standard_unit ?? "KG",
        default_price_method: entity?.default_price_method ?? "LATEST",
        default_margin_type: entity?.default_margin_type ?? "PERCENT",
        default_margin_value: entity?.default_margin_value ?? 0,
        default_vat_rate: entity?.default_vat_rate ?? 5,
        active: entity?.active ?? true,
    }
}

function ParentVthhSelect({
    open,
    onOpenChange,
    options,
    value,
    displayValue,
    isCreating,
    onSelect,
    onClear,
    onCreate,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    options: ParentVthhOption[]
    value: string
    displayValue: string
    isCreating: boolean
    onSelect: (option: ParentVthhOption) => void
    onClear: () => void
    onCreate: () => void
}) {
    const selected = options.find((option) => sameText(option.code, value))
    const label = isCreating
        ? "Tạo Nhóm VTHH mới"
        : selected
            ? parentOptionLabel(selected)
            : displayValue || "Chọn Nhóm VTHH"

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-10 w-full justify-between font-normal"
                >
                    <span className={cn("truncate", !displayValue && !selected && !isCreating && "text-muted-foreground")}>
                        {label}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Tìm code hoặc tên..." />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy Nhóm VTHH</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="__create_parent_vthh__" onSelect={onCreate}>
                                <Plus className="h-4 w-4" />
                                <span>Tạo Nhóm VTHH mới</span>
                            </CommandItem>
                            <CommandItem value="__clear_parent_vthh__" onSelect={onClear}>
                                <span className="text-muted-foreground">Không chọn</span>
                            </CommandItem>
                        </CommandGroup>
                        {options.length ? (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    {options.map((option) => (
                                        <CommandItem
                                            key={option.code}
                                            value={parentOptionLabel(option)}
                                            onSelect={() => onSelect(option)}
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    sameText(option.code, value) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {option.name || option.code}
                                                </div>
                                                {option.code ? (
                                                    <div className="text-muted-foreground truncate font-mono text-xs">
                                                        {option.code}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        ) : null}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function parentOptionLabel(option: Pick<ParentVthhOption, "code" | "name">) {
    const code = option.code?.trim() ?? ""
    const name = option.name?.trim() ?? ""
    if (code && name && code !== name) return `${code} - ${name}`
    return code || name
}

function findDuplicateParentOption(options: ParentVthhOption[], code: string, name: string) {
    return options.find((option) =>
        sameText(option.code, code) ||
        (!!option.name && sameText(option.name, name))
    )
}

function sameText(left?: string, right?: string) {
    return (left ?? "").trim().toUpperCase() === (right ?? "").trim().toUpperCase()
}

function Field({
    label,
    required,
    children,
}: {
    label: string
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <div>
            <Label className="mb-1.5 block text-sm font-medium">
                {label}
                {required ? <span className="text-destructive ml-1">*</span> : null}
            </Label>
            {children}
        </div>
    )
}

function NativeSelect({
    value,
    onChange,
    options,
}: {
    value: string
    onChange: (value: string) => void
    options: Array<[string, string]>
}) {
    return (
        <select
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            {options.map(([optionValue, label]) => (
                <option key={optionValue} value={optionValue}>
                    {label}
                </option>
            ))}
        </select>
    )
}
