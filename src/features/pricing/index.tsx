import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { Eye, Plus } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getProduct, listProducts } from "@/api/product"
import { listRegions } from "@/api/region"
import {
    calculatePricing,
    listPricingSnapshotItems,
    pricingConfigsApi,
    pricingGroupsApi,
    pricingSnapshotsApi,
} from "@/api/pricing"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { CrudTable } from "@/components/crud/crud-table"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/pricing"
import type { CalculatePricingRequest, PricingListParams, PricingSnapshot, PricingSnapshotItem } from "./data/schema"

type CrudApi<T> = {
    list: (params: PricingListParams) => Promise<any>
    create: (body: Partial<T>) => Promise<T>
    update: (body: Partial<T> & { id: number }) => Promise<T>
    delete: (id: number) => Promise<any>
}

type FieldDef = {
    key: string
    title: string
    type?: "string" | "number" | "boolean"
    required?: boolean
    enum?: Array<string | number>
    enumNames?: string[]
    money?: boolean
    asyncSelect?: "product" | "pricingGroup" | "region"
}

const mainTabs = [
    { value: "calculate", label: "Tính bảng giá" },
    { value: "configs", label: "Sản phẩm" },
    { value: "snapshots", label: "Bảng giá đã lưu" },
]

export default function PricingPage() {
    const [tab, setTab] = useState("calculate")

    return (
        <PageSection
            isLoading={false}
            error={null}
            title="Giá thành"
            description="Lấy giá từ hợp đồng, cộng lợi nhuận rồi sinh bảng giá."
            data={{ ok: true }}
        >
            {() => (
                <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                    <TabsList className="h-auto flex-wrap justify-start">
                        {mainTabs.map((item) => (
                            <TabsTrigger key={item.value} value={item.value} className="px-4 py-2 text-base">
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="calculate">
                        <CalculatePanel />
                    </TabsContent>
                    <TabsContent value="configs">
                        <PricingCrudPanel title="Sản phẩm tính giá" queryKey="pricing-configs" entityName="sản phẩm tính giá" searchPlaceholder="Tìm sản phẩm..." api={pricingConfigsApi} fields={configFields} />
                    </TabsContent>
                    <TabsContent value="snapshots">
                        <PricingSnapshotsPanel />
                    </TabsContent>
                </Tabs>
            )}
        </PageSection>
    )
}

function CalculatePanel() {
    const [openCalc, setOpenCalc] = useState(false)
    return (
        <div className="rounded-lg border bg-background p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Tạo bảng giá mới</h2>
                    <p className="text-sm text-muted-foreground">
                        Chọn nhóm, vùng và cách lấy giá. Giá mua lấy từ hợp đồng.
                    </p>
                </div>
                <Button onClick={() => setOpenCalc(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo bảng giá
                </Button>
            </div>
            <CalculatePricingDialog open={openCalc} onOpenChange={setOpenCalc} />
        </div>
    )
}

function PricingCrudPanel<T extends { id: number }>({
    title,
    queryKey,
    entityName,
    searchPlaceholder,
    api,
    fields,
}: {
    title: string
    queryKey: string
    entityName: string
    searchPlaceholder: string
    api: CrudApi<T>
    fields: FieldDef[]
}) {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])
    const [editing, setEditing] = useState<T | null>(null)
    const [openCreate, setOpenCreate] = useState(false)
    const { deleteById } = useCrudDelete((id) => api.delete(Number(id)), [queryKey])

    const { data, isLoading, error } = usePaginatedList(
        [queryKey, search.page, search.size, keyword],
        api.list,
        { page: search.page, size: search.size, keyword }
    )

    const columns = useMemo<ColumnDef<T>[]>(() => [
        buildIndexColumn<T>(),
        ...fields.slice(0, 9).map((field) => ({
            accessorKey: field.key,
            header: field.title,
            cell: ({ row }: any) => renderValue(row.original[field.key], field),
        })),
        buildActionsColumn<T>({
            renderActions: (_, row) => (
                <CrudRowActions
                    row={row.original}
                    onEdit={(item) => setEditing(item)}
                    onDelete={(item) => deleteById(item.id)}
                />
            ),
        }),
    ], [fields, deleteById])

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title={title}
            actions={<Button onClick={() => setOpenCreate(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <CrudTable
                        data={data.items}
                        columns={columns as any}
                        entityName={entityName}
                        searchPlaceholder={searchPlaceholder}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                    />

                    <PricingEntityDialog title={`Thêm ${entityName}`} open={openCreate} onOpenChange={setOpenCreate} fields={fields} mutationFn={api.create} queryKey={queryKey} />
                    {editing && (
                        <PricingEntityDialog
                            title={`Sửa ${entityName}`}
                            open={!!editing}
                            onOpenChange={(open) => !open && setEditing(null)}
                            fields={fields}
                            entity={editing}
                            mutationFn={(body: any) => api.update({ ...body, id: editing.id })}
                            queryKey={queryKey}
                        />
                    )}
                </div>
            )}
        </PageSection>
    )
}

function PricingEntityDialog({
    title,
    open,
    onOpenChange,
    fields,
    entity,
    mutationFn,
    queryKey,
}: {
    title: string
    open: boolean
    onOpenChange: (open: boolean) => void
    fields: FieldDef[]
    entity?: any
    mutationFn: (body: any) => Promise<any>
    queryKey: string
}) {
    return (
        <CrudFormDialog<any, any, unknown>
            title={title}
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={buildSchema(fields)}
            uiSchema={buildUiSchema(fields)}
            defaultValues={buildDefaults(fields, entity)}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={[queryKey]}
            mutationFn={mutationFn}
            mapFormToRequest={(values) => normalizePayload(values, fields)}
        />
    )
}

function PricingSnapshotsPanel() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])
    const [detail, setDetail] = useState<PricingSnapshot | null>(null)
    const { deleteById } = useCrudDelete(pricingSnapshotsApi.delete, ["pricing-snapshots"])

    const { data, isLoading, error } = usePaginatedList(
        ["pricing-snapshots", search.page, search.size, keyword],
        pricingSnapshotsApi.list,
        { page: search.page, size: search.size, keyword }
    )

    const columns = useMemo<ColumnDef<PricingSnapshot>[]>(() => [
        buildIndexColumn<PricingSnapshot>(),
        { accessorKey: "code", header: "Mã bảng giá" },
        { accessorKey: "pricing_date", header: "Ngày tính" },
        { accessorKey: "pricing_month", header: "Tháng" },
        { accessorKey: "region_code", header: "Vùng" },
        { accessorKey: "status", header: "Trạng thái" },
        { accessorKey: "note", header: "Ghi chú" },
        buildActionsColumn<PricingSnapshot>({
            renderActions: (_, row) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetail(row.original)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <CrudRowActions row={row.original} onDelete={(item) => deleteById(item.id)} />
                </div>
            ),
        }),
    ], [deleteById])

    return (
        <PageSection isLoading={isLoading} error={error} title="Bảng giá đã lưu" data={data}>
            {(data) => (
                <div className="space-y-4">
                    <CrudTable
                        data={data.items}
                        columns={columns}
                        entityName="bảng giá"
                        searchPlaceholder="Tìm mã bảng giá..."
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                    />
                    {detail && <SnapshotItemsDialog snapshot={detail} onClose={() => setDetail(null)} />}
                </div>
            )}
        </PageSection>
    )
}

function CalculatePricingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <CrudFormDialog<any, CalculatePricingRequest, PricingSnapshot>
            title="Tính bảng giá"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={buildSchema(calculateFields)}
            uiSchema={buildUiSchema(calculateFields)}
            defaultValues={{
                code: "",
                pricing_date: new Date().toISOString().slice(0, 10),
                pricing_month: new Date().toISOString().slice(0, 7),
                region_code: undefined,
                pricing_group_id: undefined,
                price_method: "LATEST",
                note: "",
            }}
            submitText="Tính giá"
            loadingText="Đang tính..."
            queryKeyToInvalidate={["pricing-snapshots"]}
            mutationFn={calculatePricing}
            successMessage="Đã tạo bảng giá"
            mapFormToRequest={(values) => normalizePayload(values, calculateFields)}
        />
    )
}

function SnapshotItemsDialog({ snapshot, onClose }: { snapshot: PricingSnapshot; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [items, setItems] = useState<PricingSnapshotItem[]>([])
    const mutation = useMutation({
        mutationFn: () => listPricingSnapshotItems(snapshot.id),
        onSuccess: (data) => {
            setItems(normalizeSnapshotItems(data))
            queryClient.invalidateQueries({ queryKey: ["pricing-snapshots"] })
        },
        onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Không tải được dòng giá"),
    })

    useEffect(() => {
        mutation.mutate()
    }, [snapshot.id])

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-7xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Dòng giá: {snapshot.code}</DialogTitle>
                    <DialogDescription>Giá bán được sinh từ dữ liệu đầu vào tại thời điểm tính.</DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[1300px] text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-2 text-left">Sản phẩm</th>
                                <th className="p-2 text-left">Tên hàng</th>
                                <th className="p-2 text-left">Vùng</th>
                <th className="p-2 text-left">Cách giá</th>
                <th className="p-2 text-left">Hợp đồng</th>
                <th className="p-2 text-right">Giá mua</th>
                <th className="p-2 text-right">Bao bì HĐ</th>
                <th className="p-2 text-right">VC HĐ</th>
                <th className="p-2 text-right">Thuế NK</th>
                <th className="p-2 text-right">Phí làm hàng</th>
                <th className="p-2 text-right">Tổng vốn</th>
                <th className="p-2 text-right">LN</th>
                <th className="p-2 text-right">Trước VAT</th>
                                <th className="p-2 text-right">Sau VAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-2">{item.product_code ?? item.product_id}</td>
                                    <td className="p-2">{item.display_name ?? "-"}</td>
                                    <td className="p-2">{item.region_code ?? "-"}</td>
                                    <td className="p-2">{item.price_method ?? "-"}</td>
                                    <td className="p-2">{item.contract_code ?? "-"}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.base_purchase_price_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.packaging_price_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.freight_price_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.import_tax_amount_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.handling_fee_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.total_cost_vnd)}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.profit_amount_vnd)}</td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(item.rounded_price_before_vat ?? item.price_before_vat)}</td>
                                    <td className="p-2 text-right font-semibold">{formatCurrency(item.rounded_price_after_vat ?? item.price_after_vat)}</td>
                                </tr>
                            ))}
                            {!mutation.isPending && items.length === 0 && (
                                <tr className="border-t">
                                    <td className="p-6 text-center text-muted-foreground" colSpan={14}>Bảng giá này chưa có dòng giá.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function normalizeSnapshotItems(data: any): PricingSnapshotItem[] {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.data?.items)) return data.data.items
    return []
}

function buildSchema(fields: FieldDef[]): RJSFSchema {
    const properties: Record<string, any> = {}
    const required: string[] = []
    fields.forEach((field) => {
        if (field.required) required.push(field.key)
        properties[field.key] = { type: field.type ?? "string", title: field.title }
        if (field.enum) {
            properties[field.key].enum = field.enum
            properties[field.key].enumNames = field.enumNames
        }
    })
    return { type: "object", required, properties } as any
}

function buildUiSchema(fields: FieldDef[]): UiSchema {
    return fields.reduce((acc, field) => {
        if (field.type === "boolean") acc[field.key] = { "ui:widget": "checkbox" }
        if (field.asyncSelect === "product") {
            acc[field.key] = {
                ...(acc[field.key] ?? {}),
                "ui:widget": "asyncSelect",
                "ui:options": {
                    placeholder: field.title,
                    searchPlaceholder: "Tìm mã hoặc tên sản phẩm...",
                    dataSource: { getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } },
                    mapOption: mapProductOption,
                },
            }
        }
        if (field.asyncSelect === "pricingGroup") {
            acc[field.key] = {
                ...(acc[field.key] ?? {}),
                "ui:widget": "asyncSelect",
                "ui:options": {
                    placeholder: field.title,
                    searchPlaceholder: "Tìm mã hoặc tên nhóm...",
                    dataSource: { getList: pricingGroupsApi.list, getById: pricingGroupsApi.detail, params: { page: 1, size: 20 } },
                    mapOption: mapPricingGroupOption,
                },
            }
        }
        if (field.asyncSelect === "region") {
            acc[field.key] = {
                ...(acc[field.key] ?? {}),
                "ui:widget": "asyncSelect",
                "ui:options": {
                    placeholder: field.title,
                    searchPlaceholder: "Tìm mã hoặc tên vùng...",
                    dataSource: {
                        getList: listRegions,
                        getById: getRegionByCode,
                        params: { page: 1, size: 20 },
                    },
                    mapOption: mapRegionOption,
                },
            }
        }
        return acc
    }, {} as UiSchema)
}

function buildDefaults(fields: FieldDef[], entity?: any) {
    return fields.reduce((acc, field) => {
        if (entity && entity[field.key] !== undefined && entity[field.key] !== null) acc[field.key] = entity[field.key]
        else if (field.type === "boolean") acc[field.key] = true
        else if (field.key.endsWith("_date") || field.key === "lot_date") acc[field.key] = new Date().toISOString().slice(0, 10)
        else if (field.key === "pricing_month") acc[field.key] = new Date().toISOString().slice(0, 7)
        else if (field.type === "number") acc[field.key] = undefined
        else acc[field.key] = ""
        return acc
    }, {} as any)
}

function normalizePayload(values: any, fields: FieldDef[]) {
    const out: Record<string, any> = {}
    fields.forEach((field) => {
        const value = values[field.key]
        if (value === "" || value === undefined) return
        if (field.type === "number") out[field.key] = Number(value)
        else if (field.type === "boolean") out[field.key] = Boolean(value)
        else out[field.key] = typeof value === "string" ? value.trim() : value
    })
    return out
}

function renderValue(value: any, field: FieldDef) {
    if (value == null || value === "") return "-"
    if (field.type === "boolean") return value ? "Có" : "Không"
    if (field.money) return formatCurrency(Number(value))
    if (field.type === "number") return formatNumber(Number(value))
    return String(value)
}

function mapProductOption(x: any) {
    return { value: x.id, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

function mapPricingGroupOption(x: any) {
    return { value: x.id, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

async function getRegionByCode(code: string) {
    const res: any = await listRegions({ page: 1, size: 20, keyword: code })
    const items = res?.items ?? res?.data?.items ?? []
    return items.find((item: any) => String(item.code) === String(code)) ?? items[0]
}

function mapRegionOption(x: any) {
    return { value: x.code, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

const configFields: FieldDef[] = [
    { key: "product_id", title: "Sản phẩm", type: "number", required: true, asyncSelect: "product" },
    { key: "pricing_group_id", title: "Nhóm sản phẩm", type: "number", required: true, asyncSelect: "pricingGroup" },
    { key: "region_code", title: "Miền/vùng", asyncSelect: "region" },
    { key: "profit_type", title: "Kiểu lợi nhuận", enum: ["PERCENT", "AMOUNT"], enumNames: ["Theo %", "Số tiền"] },
    { key: "profit_value", title: "Giá trị lợi nhuận", type: "number" },
    { key: "adjustment_amount_vnd", title: "Điều chỉnh giá", type: "number", money: true },
    { key: "rounding_unit", title: "Làm tròn", type: "number", money: true },
    { key: "vat_rate", title: "VAT %", type: "number" },
    { key: "display_order", title: "Thứ tự", type: "number" },
    { key: "active", title: "Đang dùng", type: "boolean" },
]

const calculateFields: FieldDef[] = [
    { key: "code", title: "Mã bảng giá" },
    { key: "pricing_date", title: "Ngày tính" },
    { key: "pricing_month", title: "Tháng áp dụng" },
    { key: "region_code", title: "Miền/vùng", asyncSelect: "region" },
    { key: "pricing_group_id", title: "Nhóm sản phẩm", type: "number", asyncSelect: "pricingGroup" },
    { key: "price_method", title: "Cách lấy giá", enum: ["LATEST", "FIFO", "MONTHLY_AVERAGE"], enumNames: ["Giá gần nhất", "Nhập trước xuất trước", "Bình quân tháng"] },
    { key: "note", title: "Ghi chú" },
]
