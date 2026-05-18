import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { Plus } from "lucide-react"
import { createProductGroup, deleteProductGroup, listProductGroups, updateProductGroup } from "@/api/product-group"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { CrudTable } from "@/components/crud/crud-table"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { formatNumber } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/product-groups"
import type { ProductGroup } from "./data/schema"

const fields = [
    { key: "code", title: "Mã nhóm", type: "string", required: true },
    { key: "name", title: "Tên nhóm", type: "string", required: true },
    { key: "standard_unit", title: "Đơn vị chuẩn", type: "string" },
    { key: "default_price_method", title: "Cách lấy giá mặc định", type: "string" },
    { key: "default_margin_type", title: "Kiểu lợi nhuận", type: "string" },
    { key: "default_margin_value", title: "Lợi nhuận", type: "number" },
    { key: "default_vat_rate", title: "VAT %", type: "number" },
    { key: "active", title: "Đang dùng", type: "boolean" },
] as const

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
        listProductGroups,
        { page: search.page, size: search.size, keyword }
    )

    const columns = useMemo<ColumnDef<ProductGroup>[]>(() => [
        buildIndexColumn<ProductGroup>(),
        { accessorKey: "code", header: "Mã nhóm" },
        { accessorKey: "name", header: "Tên nhóm" },
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
            cell: ({ row }) => row.original.active === false ? "Ngưng dùng" : "Đang dùng",
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
    return (
        <CrudFormDialog<any, any, unknown>
            title={title}
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={schema}
            uiSchema={uiSchema}
            defaultValues={{
                code: entity?.code ?? "",
                name: entity?.name ?? "",
                description: entity?.description ?? "",
                standard_unit: entity?.standard_unit ?? "KG",
                default_price_method: entity?.default_price_method ?? "LATEST",
                default_margin_type: entity?.default_margin_type ?? "PERCENT",
                default_margin_value: entity?.default_margin_value ?? 0,
                default_vat_rate: entity?.default_vat_rate ?? 5,
                active: entity?.active ?? true,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["product-groups"]}
            mutationFn={mutationFn}
            mapFormToRequest={(values) => ({
                code: String(values.code ?? "").trim(),
                name: String(values.name ?? "").trim(),
                description: String(values.description ?? "").trim(),
                standard_unit: String(values.standard_unit ?? "KG"),
                default_price_method: String(values.default_price_method ?? "LATEST"),
                default_margin_type: String(values.default_margin_type ?? "PERCENT"),
                default_margin_value: Number(values.default_margin_value ?? 0),
                default_vat_rate: Number(values.default_vat_rate ?? 5),
                active: Boolean(values.active ?? true),
            })}
        />
    )
}

const schema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: { type: "string", title: "Mã nhóm" },
        name: { type: "string", title: "Tên nhóm" },
        description: { type: "string", title: "Ghi chú" },
        standard_unit: { type: "string", title: "Đơn vị chuẩn", enum: ["TON", "KG", "LIT"], enumNames: ["Tấn", "Kg", "Lít"] },
        default_price_method: { type: "string", title: "Cách lấy giá mặc định", enum: ["LATEST", "FIFO", "MONTHLY_AVERAGE"], enumNames: ["Giá gần nhất", "Giá cũ nhất (FIFO)", "Bình quân tháng"] },
        default_margin_type: { type: "string", title: "Kiểu lợi nhuận", enum: ["PERCENT", "AMOUNT"], enumNames: ["Theo %", "Số tiền"] },
        default_margin_value: { type: "number", title: "Lợi nhuận mặc định" },
        default_vat_rate: { type: "number", title: "VAT %" },
        active: { type: "boolean", title: "Đang dùng" },
    },
} as any as RJSFSchema

const uiSchema: UiSchema = {
    active: { "ui:widget": "checkbox" },
    description: { "ui:widget": "textarea" },
}
