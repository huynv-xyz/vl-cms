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
    { key: "vat_rate", title: "VAT %", type: "number" },
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
        {
            accessorKey: "vat_rate",
            header: "VAT %",
            cell: ({ row }) => formatNumber(row.original.vat_rate ?? 0),
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
                vat_rate: entity?.vat_rate ?? 5,
                active: entity?.active ?? true,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["product-groups"]}
            mutationFn={mutationFn}
            mapFormToRequest={(values) => ({
                code: String(values.code ?? "").trim(),
                name: String(values.name ?? "").trim(),
                vat_rate: Number(values.vat_rate ?? 5),
                active: Boolean(values.active ?? true),
            })}
        />
    )
}

const schema: RJSFSchema = {
    type: "object",
    required: ["code", "name"],
    properties: {
        code: { type: "string", title: "Mã nhóm" },
        name: { type: "string", title: "Tên nhóm" },
        vat_rate: { type: "number", title: "VAT %" },
        active: { type: "boolean", title: "Đang dùng" },
    },
}

const uiSchema: UiSchema = {
    active: { "ui:widget": "checkbox" },
}
