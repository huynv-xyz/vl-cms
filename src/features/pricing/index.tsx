import { useMemo, useState } from "react"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { Eye, PackageCheck, Plus, RefreshCw } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { getProduct, listProducts } from "@/api/product"
import { listRegions } from "@/api/region"
import {
    calculatePricing,
    generateSelectedPrices,
    listPricingSnapshotItems,
    pricingGroupsApi,
    pricingMarginRulesApi,
    pricingPackagingCostRulesApi,
    pricingSelectedPricesApi,
    pricingSnapshotsApi,
    pricingTransportRulesApi,
    pricingUnitConversionRulesApi,
} from "@/api/pricing"
import { DatePicker } from "@/components/date-picker"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { CrudTable } from "@/components/crud/crud-table"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type {
    CalculatePricingRequest,
    GenerateSelectedPricesRequest,
    PricingListParams,
    PricingPriceMethod,
    PricingSnapshot,
    PricingSnapshotItem,
} from "./data/schema"

type CrudApi<T> = {
    list: (params: PricingListParams) => Promise<any>
    detail: (id: number | string) => Promise<T>
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
    asyncSelect?: "product" | "productGroup" | "region"
    widget?: "textarea" | "date" | "month"
}

const mainTabs = [
    { value: "purchase-price", label: "1. Giá mua" },
    { value: "cost-config", label: "2. Cấu hình chi phí" },
    { value: "calculate", label: "3. Bấm tính" },
    { value: "result", label: "4. Ra bảng giá" },
]

export default function PricingPage() {
    const [tab, setTab] = useState("purchase-price")
    const [latestSnapshot, setLatestSnapshot] = useState<PricingSnapshot | null>(null)

    return (
        <PageSection
            isLoading={false}
            error={null}
            title="Giá thành"
            description="Luồng dễ dùng: nhập giá mua, kiểm tra chi phí, bấm tính, rồi xem bảng giá bán."
            data={{ ok: true }}
        >
            {() => (
                <Tabs value={tab} onValueChange={setTab} className="space-y-5">
                    <TabsList className="h-auto flex-wrap justify-start gap-1">
                        {mainTabs.map((item) => (
                            <TabsTrigger key={item.value} value={item.value} className="px-4 py-2 text-base">
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="purchase-price">
                        <PurchasePricePanel />
                    </TabsContent>

                    <TabsContent value="cost-config">
                        <SalesConfigPanel />
                    </TabsContent>

                    <TabsContent value="calculate">
                        <CalculatePanel
                            onCalculated={(snapshot) => {
                                setLatestSnapshot(snapshot)
                                setTab("result")
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="result">
                        <ResultPanel initialSnapshot={latestSnapshot} />
                    </TabsContent>
                </Tabs>
            )}
        </PageSection>
    )
}

function PurchasePricePanel() {
    return (
        <div className="space-y-5">
            <StepNote
                title="Bước 1: Giá mua"
                text="Giá mua được lấy trực tiếp từ Hợp đồng mua hàng và Hàng hóa hợp đồng. Vào màn hợp đồng để nhập/sửa mua hàng, sau đó quay lại đây bấm sinh giá áp dụng."
            />
            <div className="rounded-md border bg-background p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Nguồn giá mua: Hợp đồng</h2>
                        <p className="text-base text-muted-foreground">
                            Sản phẩm, số lượng, đơn giá, chiết khấu, bao bì, vận chuyển, tỷ giá và phí làm hàng lấy từ màn hợp đồng mua hàng.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="h-11 px-5 text-base">
                        <Link
                            to="/purchasing/contracts"
                            search={{
                                page: 1,
                                size: 20,
                                keyword: "",
                                status: undefined,
                                product_ids: undefined,
                                supplier_ids: undefined,
                                nation_ids: undefined,
                                signed_date_from: undefined,
                                signed_date_to: undefined,
                            }}
                        >
                            Mở hợp đồng mua hàng
                        </Link>
                    </Button>
                </div>
            </div>
            <SelectedPricesSection />
        </div>
    )
}

function SelectedPricesSection() {
    const [form, setForm] = useState<GenerateSelectedPricesRequest>({
        pricing_month: new Date().toISOString().slice(0, 7),
        pricing_date: new Date().toISOString().slice(0, 10),
        price_method: "WAVG",
    })
    const queryClient = useQueryClient()

    const selectedMutation = useMutation({
        mutationFn: generateSelectedPrices,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["pricing-selected-prices"] })
            toast.success("Đã sinh giá áp dụng")
        },
        onError: showMutationError("Sinh giá áp dụng thất bại"),
    })

    return (
        <div className="space-y-5">
            <div className="rounded-md border bg-background p-5">
                <div className="mb-4 flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Chốt giá mua tháng</h2>
                        <p className="text-base text-muted-foreground">Hệ thống lấy bình quân tháng hoặc hợp đồng mới nhất để tạo giá mua áp dụng. Dòng nào đặc biệt thì sửa trực tiếp bên dưới.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={selectedMutation.isPending} onClick={() => selectedMutation.mutate(cleanGenerateSelectedRequest(form))}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {selectedMutation.isPending ? "Đang sinh..." : "Sinh giá áp dụng"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    <PricingField label="Tháng áp dụng">
                        <Input type="month" className="h-11 text-base" value={form.pricing_month || ""} onChange={(event) => setForm((prev) => ({ ...prev, pricing_month: event.target.value }))} />
                    </PricingField>
                    <PricingField label="Ngày chọn giá">
                        <DatePicker value={form.pricing_date} onChange={(value) => setForm((prev) => ({ ...prev, pricing_date: value || "" }))} placeholder="Chọn ngày" />
                    </PricingField>
                    <PricingField label="Nhóm sản phẩm">
                        <AsyncSelect
                            value={form.product_group_id}
                            onChange={(value: any) => setForm((prev) => ({ ...prev, product_group_id: value ? Number(value) : undefined }))}
                            placeholder="Tất cả nhóm"
                            dataSource={{ getList: pricingGroupsApi.list, getById: pricingGroupsApi.detail, params: { page: 1, size: 20 } }}
                            mapOption={mapProductGroupOption}
                        />
                    </PricingField>
                    <PricingField label="Cách lấy giá">
                        <Select value={form.price_method || "WAVG"} onValueChange={(value) => setForm((prev) => ({ ...prev, price_method: value as PricingPriceMethod }))}>
                            <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WAVG">Bình quân tháng từ hợp đồng</SelectItem>
                                <SelectItem value="LATEST_LOT">Hợp đồng mới nhất</SelectItem>
                                <SelectItem value="MANUAL">Nhập tay</SelectItem>
                            </SelectContent>
                        </Select>
                    </PricingField>
                </div>
            </div>

            <CrudBlock
                title="Giá áp dụng"
                description="Đây là giá mua đã chốt từ contract_items để đem đi tính bảng giá. Bình thường chỉ cần bấm sinh, chỉ sửa khi có ngoại lệ."
                queryKey="pricing-selected-prices"
                entityName="giá áp dụng"
                api={pricingSelectedPricesApi as any}
                fields={selectedPriceFields}
                columns={selectedPriceColumns}
                extraParams={{ pricing_month: form.pricing_month, product_group_id: form.product_group_id }}
                readonlyCreate
            />
        </div>
    )
}

function SalesConfigPanel() {
    const [tab, setTab] = useState("pack-cost")

    return (
        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
            <StepNote
                title="Bước 2: Cấu hình chi phí"
                text="Khai báo các khoản cộng vào giá mua: chi phí bao bì chung, lợi nhuận, vận chuyển, quy đổi size và làm tròn. Đây là phần cấu hình, không cần sửa mỗi ngày."
            />

            <TabsList className="h-auto flex-wrap justify-start gap-1">
                <TabsTrigger value="pack-cost" className="px-4 py-2 text-base">Chi phí bao bì</TabsTrigger>
                <TabsTrigger value="margin" className="px-4 py-2 text-base">Lợi nhuận</TabsTrigger>
                <TabsTrigger value="transport" className="px-4 py-2 text-base">Vận chuyển</TabsTrigger>
                <TabsTrigger value="conversion" className="px-4 py-2 text-base">Quy đổi size</TabsTrigger>
            </TabsList>

            <TabsContent value="pack-cost">
                <CrudBlock
                    title="Chi phí bao bì"
                    description="Chỉ dùng khi cần cộng thêm chi phí bao bì ngoài giá đã có trên hợp đồng."
                    queryKey="pricing-packaging-cost-rules"
                    entityName="chi phí bao bì"
                    api={pricingPackagingCostRulesApi as any}
                    fields={packagingCostFields}
                    columns={packagingCostColumns}
                />
            </TabsContent>

            <TabsContent value="margin">
                <CrudBlock
                    title="Biên lợi nhuận"
                    description="Lợi nhuận và điều chỉnh giá theo vùng và nhóm sản phẩm."
                    queryKey="pricing-margin-rules"
                    entityName="biên lợi nhuận"
                    api={pricingMarginRulesApi as any}
                    fields={marginFields}
                    columns={marginColumns}
                />
            </TabsContent>

            <TabsContent value="transport">
                <CrudBlock
                    title="Tham số vận chuyển"
                    description="Ưu tiên khớp theo tên hàng, nếu không có thì dùng nhóm sản phẩm."
                    queryKey="pricing-transport-rules"
                    entityName="tham số vận chuyển"
                    api={pricingTransportRulesApi as any}
                    fields={transportFields}
                    columns={transportColumns}
                />
            </TabsContent>

            <TabsContent value="conversion">
                <CrudBlock
                    title="Quy đổi size bán"
                    description="Sau khi có giá đơn vị chuẩn, hệ thống nhân hệ số quy đổi size và làm tròn theo quy tắc."
                    queryKey="pricing-unit-conversion-rules"
                    entityName="quy đổi size"
                    api={pricingUnitConversionRulesApi as any}
                    fields={unitConversionFields}
                    columns={unitConversionColumns}
                />
            </TabsContent>
        </Tabs>
    )
}

function CalculatePanel({ onCalculated }: { onCalculated: (snapshot: PricingSnapshot) => void }) {
    const [form, setForm] = useState<CalculatePricingRequest>({
        pricing_date: new Date().toISOString().slice(0, 10),
        pricing_month: new Date().toISOString().slice(0, 7),
        price_method: "WAVG",
    })
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: calculatePricing,
        onSuccess: async (snapshot) => {
            await queryClient.invalidateQueries({ queryKey: ["pricing-snapshots"] })
            toast.success("Đã tính bảng giá")
            onCalculated(snapshot)
            setForm((prev) => ({ ...prev, code: "", note: "" }))
        },
        onError: showMutationError("Tính bảng giá thất bại"),
    })

    return (
        <div className="space-y-5">
            <form
                className="rounded-md border bg-background p-5"
                onSubmit={(event) => {
                    event.preventDefault()
                    mutation.mutate(cleanCalculateRequest(form))
                }}
            >
                <div className="mb-5 flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Bước 3: Bấm tính</h2>
                        <p className="text-base text-muted-foreground">Chọn tháng, vùng bán và nhóm sản phẩm. Hệ thống tự lấy giá mua đã chốt, cộng chi phí, lợi nhuận, vận chuyển và làm tròn.</p>
                    </div>
                    <Button type="submit" disabled={mutation.isPending} className="h-11 px-6 text-base">
                        <PackageCheck className="mr-2 h-4 w-4" />
                        {mutation.isPending ? "Đang tính..." : "Tính bảng giá"}
                    </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    <PricingField label="Tháng áp dụng">
                        <Input type="month" className="h-11 text-base" value={form.pricing_month || ""} onChange={(event) => setForm((prev) => ({ ...prev, pricing_month: event.target.value }))} />
                    </PricingField>
                    <PricingField label="Ngày tính">
                        <DatePicker value={form.pricing_date} onChange={(value) => setForm((prev) => ({ ...prev, pricing_date: value || "" }))} placeholder="Chọn ngày" />
                    </PricingField>
                    <PricingField label="Nhóm sản phẩm">
                        <AsyncSelect
                            value={form.product_group_id}
                            onChange={(value: any) => setForm((prev) => ({ ...prev, product_group_id: value ? Number(value) : undefined }))}
                            placeholder="Tất cả nhóm"
                            dataSource={{ getList: pricingGroupsApi.list, getById: pricingGroupsApi.detail, params: { page: 1, size: 20 } }}
                            mapOption={mapProductGroupOption}
                        />
                    </PricingField>
                    <PricingField label="Vùng bán">
                        <AsyncSelect
                            value={form.region_code}
                            onChange={(value: any) => setForm((prev) => ({ ...prev, region_code: value ? String(value) : undefined }))}
                            placeholder="DEFAULT"
                            dataSource={{ getList: listRegions, getById: getRegionByCode, params: { page: 1, size: 20 } }}
                            mapOption={mapRegionOption}
                        />
                    </PricingField>
                    <PricingField label="Cách lấy giá">
                        <Select value={form.price_method || "WAVG"} onValueChange={(value) => setForm((prev) => ({ ...prev, price_method: value as PricingPriceMethod }))}>
                            <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WAVG">Bình quân tháng từ hợp đồng</SelectItem>
                                <SelectItem value="LATEST_LOT">Hợp đồng mới nhất</SelectItem>
                                <SelectItem value="MANUAL">Nhập tay</SelectItem>
                            </SelectContent>
                        </Select>
                    </PricingField>
                    <PricingField label="Mã bảng giá">
                        <Input className="h-11 text-base" value={form.code || ""} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="Để trống tự sinh" />
                    </PricingField>
                    <PricingField label="Ghi chú">
                        <Input className="h-11 text-base" value={form.note || ""} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
                    </PricingField>
                </div>
            </form>
        </div>
    )
}

function ResultPanel({ initialSnapshot }: { initialSnapshot: PricingSnapshot | null }) {
    const [detail, setDetail] = useState<PricingSnapshot | null>(initialSnapshot)

    return (
        <div className="space-y-5">
            <StepNote
                title="Bước 4: Ra bảng giá"
                text="Xem lại các bảng giá đã tính. Bấm biểu tượng mắt để xem chi tiết giá tại kho, tiền mặt, công nợ 8-10 ngày và công nợ 30 ngày."
            />
            <SnapshotsTable onView={setDetail} />
            {detail && <SnapshotItemsDialog snapshot={detail} onClose={() => setDetail(null)} />}
        </div>
    )
}

function CrudBlock<T extends { id: number }>({
    title,
    description,
    queryKey,
    entityName,
    api,
    fields,
    columns,
    extraParams,
    readonlyCreate,
}: {
    title: string
    description: string
    queryKey: string
    entityName: string
    api: CrudApi<T>
    fields: FieldDef[]
    columns: ColumnDef<T>[]
    extraParams?: Partial<PricingListParams>
    readonlyCreate?: boolean
}) {
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
    const [keyword, setKeyword] = useState("")
    const [openCreate, setOpenCreate] = useState(false)
    const [editing, setEditing] = useState<T | null>(null)
    const params = useMemo(() => ({
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        keyword,
        ...extraParams,
    }), [pagination.pageIndex, pagination.pageSize, keyword, extraParams])
    const { deleteById } = useCrudDelete((id) => api.delete(Number(id)), [queryKey])

    const { data, isLoading, error } = usePaginatedList([queryKey, params], api.list, params)

    const tableColumns = useMemo<ColumnDef<T>[]>(() => [
        buildIndexColumn<T>(),
        ...columns,
        buildActionsColumn<T>({
            renderActions: (_, row) => (
                <CrudRowActions
                    row={row.original}
                    onEdit={(item) => setEditing(item)}
                    onDelete={(item) => deleteById(item.id)}
                />
            ),
        }),
    ], [columns, deleteById])

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title={title}
            description={description}
            actions={readonlyCreate ? undefined : <Button onClick={() => setOpenCreate(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <CrudTable
                        data={data.items}
                        columns={tableColumns as any}
                        entityName={entityName}
                        searchPlaceholder={`Tìm ${entityName}...`}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                    />

                    {!readonlyCreate && (
                        <EntityDialog title={`Thêm ${entityName}`} open={openCreate} onOpenChange={setOpenCreate} fields={fields} mutationFn={api.create} queryKey={queryKey} />
                    )}
                    {editing && (
                        <EntityDialog
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

function EntityDialog({
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
            dialogClassName="sm:max-w-3xl"
        />
    )
}

function SnapshotsTable({ onView }: { onView: (snapshot: PricingSnapshot) => void }) {
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
    const [keyword, setKeyword] = useState("")
    const params = useMemo(() => ({ page: pagination.pageIndex + 1, size: pagination.pageSize, keyword }), [pagination, keyword])
    const { deleteById } = useCrudDelete(pricingSnapshotsApi.delete, ["pricing-snapshots"])
    const { data, isLoading, error } = usePaginatedList(["pricing-snapshots", params], pricingSnapshotsApi.list, params)

    const columns = useMemo<ColumnDef<PricingSnapshot>[]>(() => [
        buildIndexColumn<PricingSnapshot>(),
        { accessorKey: "code", header: "Mã bảng giá" },
        { accessorKey: "pricing_month", header: "Tháng" },
        { accessorKey: "pricing_date", header: "Ngày tính" },
        { accessorKey: "region_code", header: "Vùng", cell: ({ row }) => row.original.region_code || "DEFAULT" },
        { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Badge variant="outline">{row.original.status || "DRAFT"}</Badge> },
        buildActionsColumn<PricingSnapshot>({
            renderActions: (_, row) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView(row.original)} title="Xem bảng giá">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <CrudRowActions row={row.original} onDelete={(item) => deleteById(item.id)} />
                </div>
            ),
        }),
    ], [deleteById, onView])

    return (
        <PageSection isLoading={isLoading} error={error} title="Bảng giá đã lưu" description="Danh sách các lần tính giá và kết quả bán ra." data={data}>
            {(data) => (
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
            )}
        </PageSection>
    )
}

function SnapshotItemsDialog({ snapshot, onClose }: { snapshot: PricingSnapshot; onClose: () => void }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["pricing-snapshot-items", snapshot.id],
        queryFn: () => listPricingSnapshotItems(snapshot.id),
    })
    const items = normalizeSnapshotItems(data)
    const warningCount = items.filter((item) => item.warning_text).length

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-[96vw] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bảng giá: {snapshot.code}</DialogTitle>
                    <DialogDescription>
                        Giá cuối cùng gồm giá tại kho, tiền mặt, công nợ 8-10 ngày và công nợ 30 ngày.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Số dòng" value={formatNumber(items.length)} />
                    <Metric label="Cảnh báo" value={formatNumber(warningCount)} tone={warningCount ? "danger" : "normal"} />
                    <Metric label="Tháng" value={snapshot.pricing_month || "-"} />
                    <Metric label="Vùng" value={snapshot.region_code || "DEFAULT"} />
                </div>

                {error && <div className="rounded-md border border-destructive/40 p-4 text-destructive">Không tải được chi tiết bảng giá.</div>}

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[1500px] text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left">Mã hàng</th>
                                <th className="p-3 text-left">Tên hàng</th>
                                <th className="p-3 text-right">Giá nguyên liệu</th>
                                <th className="p-3 text-right">Bao bì</th>
                                <th className="p-3 text-right">Giá có BB</th>
                                <th className="p-3 text-right">Lợi nhuận</th>
                                <th className="p-3 text-right">Giá nền</th>
                                <th className="p-3 text-right">Vận chuyển</th>
                                <th className="p-3 text-right">Tại kho</th>
                                <th className="p-3 text-right">Tiền mặt</th>
                                <th className="p-3 text-right">8-10 ngày</th>
                                <th className="p-3 text-right">30 ngày</th>
                                <th className="p-3 text-left">ĐVT bán</th>
                                <th className="p-3 text-left">Cảnh báo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/40">
                                    <td className="p-3 font-semibold">{item.product_code || item.product_id}</td>
                                    <td className="p-3">
                                        <div>{item.product_name || "-"}</div>
                                        <div className="text-xs text-muted-foreground">x {formatNumber(item.conversion_factor ?? 1)} · {roundingLabel(item.rounding_mode)}</div>
                                    </td>
                                    <td className="p-3 text-right">{formatCurrency(item.raw_material_price_vnd)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.pack_cost_vnd)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.price_with_packaging_vnd)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.margin_amount_vnd)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.base_price_vnd)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.transport_cost_vnd)}</td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(item.final_warehouse_price_vnd)}</td>
                                    <td className="p-3 text-right font-semibold text-primary">{formatCurrency(item.final_cash_price_vnd)}</td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(item.final_term_8_10_price_vnd)}</td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(item.final_term_30_price_vnd)}</td>
                                    <td className="p-3">{item.sale_unit_name || item.sale_unit_code || "-"}</td>
                                    <td className="p-3 text-muted-foreground">{item.warning_text || "-"}</td>
                                </tr>
                            ))}
                            {!isLoading && items.length === 0 && (
                                <tr className="border-t">
                                    <td className="p-6 text-center text-muted-foreground" colSpan={14}>Bảng giá này chưa có dòng.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PricingField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-base font-semibold">{label}</Label>
            {children}
        </div>
    )
}

function StepNote({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-md border bg-muted/25 p-4">
            <div className="text-base font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{text}</div>
        </div>
    )
}

function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "danger" }) {
    return (
        <div className="rounded-md border p-4">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className={tone === "danger" ? "mt-1 text-2xl font-bold text-destructive" : "mt-1 text-2xl font-bold"}>{value}</div>
        </div>
    )
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
        if (field.widget === "date") properties[field.key].format = "date"
    })
    return { type: "object", required, properties } as any
}

function buildUiSchema(fields: FieldDef[]): UiSchema {
    return fields.reduce((acc, field) => {
        if (field.type === "boolean") acc[field.key] = { "ui:widget": "checkbox" }
        if (field.widget === "textarea") acc[field.key] = { "ui:widget": "textarea" }
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
        if (field.asyncSelect === "productGroup") {
            acc[field.key] = {
                ...(acc[field.key] ?? {}),
                "ui:widget": "asyncSelect",
                "ui:options": {
                    placeholder: field.title,
                    searchPlaceholder: "Tìm nhóm sản phẩm...",
                    dataSource: { getList: pricingGroupsApi.list, getById: pricingGroupsApi.detail, params: { page: 1, size: 20 } },
                    mapOption: mapProductGroupOption,
                },
            }
        }
        if (field.asyncSelect === "region") {
            acc[field.key] = {
                ...(acc[field.key] ?? {}),
                "ui:widget": "asyncSelect",
                "ui:options": {
                    placeholder: field.title,
                    searchPlaceholder: "Tìm vùng...",
                    dataSource: { getList: listRegions, getById: getRegionByCode, params: { page: 1, size: 20 } },
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
        else if (field.key === "active") acc[field.key] = true
        else if (field.key === "is_default" || field.key === "is_representative") acc[field.key] = false
        else if (field.key === "price_method") acc[field.key] = "WAVG"
        else if (field.key === "source_type") acc[field.key] = "MANUAL"
        else if (field.key === "unit_code") acc[field.key] = "KG"
        else if (field.key === "margin_type") acc[field.key] = "PERCENT"
        else if (field.key === "match_type") acc[field.key] = "DEFAULT"
        else if (field.key === "rounding_mode") acc[field.key] = "KG_STEP"
        else if (field.key === "region_code") acc[field.key] = "DEFAULT"
        else if (field.key === "priority") acc[field.key] = 100
        else if (field.key === "conversion_factor" || field.key === "size_ratio_to_kg") acc[field.key] = 1
        else if (field.key === "pricing_month") acc[field.key] = new Date().toISOString().slice(0, 7)
        else if (field.key === "pricing_date" || field.key === "movement_date") acc[field.key] = new Date().toISOString().slice(0, 10)
        else if (field.type === "number") acc[field.key] = undefined
        else acc[field.key] = ""
        return acc
    }, {} as any)
}

function normalizePayload(values: any, fields: FieldDef[]) {
    const out: Record<string, any> = {}
    fields.forEach((field) => {
        const value = values[field.key]
        if (value === "" || value === undefined || value === null) return
        if (field.type === "number") out[field.key] = Number(value)
        else if (field.type === "boolean") out[field.key] = Boolean(value)
        else out[field.key] = typeof value === "string" ? value.trim() : value
    })
    return out
}

function normalizeSnapshotItems(data: any): PricingSnapshotItem[] {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.data?.items)) return data.data.items
    return []
}

function cleanGenerateSelectedRequest(form: GenerateSelectedPricesRequest): GenerateSelectedPricesRequest {
    return {
        pricing_month: form.pricing_month || undefined,
        pricing_date: form.pricing_date || undefined,
        product_group_id: form.product_group_id ? Number(form.product_group_id) : undefined,
        price_method: form.price_method || "WAVG",
    }
}

function cleanCalculateRequest(form: CalculatePricingRequest): CalculatePricingRequest {
    return {
        code: form.code?.trim() || undefined,
        pricing_date: form.pricing_date || undefined,
        pricing_month: form.pricing_month || undefined,
        region_code: form.region_code || undefined,
        product_group_id: form.product_group_id ? Number(form.product_group_id) : undefined,
        price_method: form.price_method || "WAVG",
        note: form.note?.trim() || undefined,
    }
}

function showMutationError(fallback: string) {
    return (error: unknown) => toast.error(error instanceof Error ? error.message : fallback)
}

function priceMethodLabel(code?: string) {
    if (code === "LATEST_LOT") return "Hợp đồng mới nhất"
    if (code === "MANUAL") return "Nhập tay"
    return "Bình quân tháng"
}

function selectedPriceSourceLabel(code?: string) {
    if (code === "CONTRACT") return "Hợp đồng"
    if (code === "MONTHLY_AVERAGE") return "Bình quân tháng"
    if (code === "MANUAL") return "Nhập tay"
    return code || "-"
}

function matchTypeLabel(code?: string) {
    if (code === "PRODUCT_NAME") return "Tên hàng"
    if (code === "PRODUCT_GROUP") return "Nhóm sản phẩm"
    return "Mặc định"
}

function roundingLabel(code?: string) {
    if (code === "SIGNIFICANT_3") return "Tròn 3 chữ số"
    return "Tròn 500/1.000"
}

function statusLabel(active?: boolean) {
    return active === false ? "Ngưng" : "Đang dùng"
}

function mapProductOption(x: any) {
    return { value: x.id, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

function mapProductGroupOption(x: any) {
    return { value: x.id, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

async function getRegionByCode(code: string) {
    const res: any = await listRegions({ page: 1, size: 20, keyword: code })
    const items = res?.items ?? res?.data?.items ?? []
    return items.find((item: any) => String(item.code) === String(code)) ?? items[0] ?? { code, name: code }
}

function mapRegionOption(x: any) {
    return { value: x.code, label: `${x.code || `#${x.id}`} - ${x.name || ""}`, raw: x }
}

const PRICE_METHODS = ["WAVG", "LATEST_LOT", "MANUAL"]
const PRICE_METHOD_NAMES = ["Bình quân tháng từ hợp đồng", "Hợp đồng mới nhất", "Nhập tay"]
const MARGIN_TYPES = ["PERCENT", "AMOUNT"]
const MARGIN_TYPE_NAMES = ["Theo %", "Số tiền"]
const MATCH_TYPES = ["DEFAULT", "PRODUCT_NAME", "PRODUCT_GROUP"]
const MATCH_TYPE_NAMES = ["Mặc định", "Tên hàng", "Nhóm sản phẩm"]
const ROUNDING_MODES = ["KG_STEP", "SIGNIFICANT_3"]
const ROUNDING_MODE_NAMES = ["Tròn 500/1.000", "Tròn 3 chữ số"]

const selectedPriceFields: FieldDef[] = [
    { key: "pricing_month", title: "Tháng", required: true },
    { key: "pricing_date", title: "Ngày chọn", widget: "date" },
    { key: "product_id", title: "Sản phẩm", type: "number", required: true, asyncSelect: "product" },
    { key: "product_group_id", title: "Nhóm sản phẩm", type: "number", asyncSelect: "productGroup" },
    { key: "price_method", title: "Cách lấy giá", enum: PRICE_METHODS, enumNames: PRICE_METHOD_NAMES },
    { key: "manual_price_vnd_per_kg", title: "Giá nhập tay/kg", type: "number" },
    { key: "applied_price_vnd_per_kg", title: "Giá áp dụng/kg", type: "number" },
    { key: "previous_price_vnd_per_kg", title: "Giá kỳ trước/kg", type: "number" },
    { key: "note", title: "Ghi chú", widget: "textarea" },
]

const packagingCostFields: FieldDef[] = [
    { key: "pack_match_key", title: "Pack key", required: true },
    { key: "pack_name", title: "Tên bao bì" },
    { key: "base_pack_cost_vnd_per_kg", title: "Chi phí bao bì/kg", type: "number" },
    { key: "priority", title: "Ưu tiên", type: "number" },
    { key: "active", title: "Đang dùng", type: "boolean" },
]

const marginFields: FieldDef[] = [
    { key: "region_code", title: "Vùng", asyncSelect: "region" },
    { key: "product_group_id", title: "Nhóm sản phẩm", type: "number", required: true, asyncSelect: "productGroup" },
    { key: "margin_type", title: "Kiểu lợi nhuận", enum: MARGIN_TYPES, enumNames: MARGIN_TYPE_NAMES },
    { key: "margin_value", title: "Giá trị lợi nhuận", type: "number" },
    { key: "warehouse_adjustment_vnd", title: "Điều chỉnh tại kho", type: "number" },
    { key: "cash_adjustment_vnd", title: "Điều chỉnh tiền mặt", type: "number" },
    { key: "term_8_10_adjustment_vnd", title: "Điều chỉnh 8-10 ngày", type: "number" },
    { key: "term_30_adjustment_vnd", title: "Điều chỉnh 30 ngày", type: "number" },
    { key: "priority", title: "Ưu tiên", type: "number" },
    { key: "active", title: "Đang dùng", type: "boolean" },
]

const transportFields: FieldDef[] = [
    { key: "region_code", title: "Vùng", asyncSelect: "region" },
    { key: "match_type", title: "Áp dụng theo", enum: MATCH_TYPES, enumNames: MATCH_TYPE_NAMES },
    { key: "match_value", title: "Tên hàng cần khớp" },
    { key: "product_group_id", title: "Nhóm sản phẩm", type: "number", asyncSelect: "productGroup" },
    { key: "transport_cost_vnd", title: "Phí vận chuyển chung", type: "number" },
    { key: "cash_transport_cost_vnd", title: "Phí tiền mặt", type: "number" },
    { key: "term_8_10_transport_cost_vnd", title: "Phí 8-10 ngày", type: "number" },
    { key: "term_30_transport_cost_vnd", title: "Phí 30 ngày", type: "number" },
    { key: "priority", title: "Ưu tiên", type: "number" },
    { key: "active", title: "Đang dùng", type: "boolean" },
]

const unitConversionFields: FieldDef[] = [
    { key: "product_id", title: "Sản phẩm", type: "number", asyncSelect: "product" },
    { key: "unit_text", title: "Đơn vị text" },
    { key: "size_code", title: "Size" },
    { key: "sale_unit_code", title: "Mã đơn vị bán", required: true },
    { key: "sale_unit_name", title: "Tên đơn vị bán" },
    { key: "conversion_factor", title: "Hệ số quy đổi", type: "number" },
    { key: "rounding_mode", title: "Cách làm tròn", enum: ROUNDING_MODES, enumNames: ROUNDING_MODE_NAMES },
    { key: "is_default", title: "Mặc định", type: "boolean" },
    { key: "active", title: "Đang dùng", type: "boolean" },
]

const selectedPriceColumns: ColumnDef<any>[] = [
    { accessorKey: "pricing_month", header: "Tháng" },
    { accessorKey: "product_id", header: "Sản phẩm" },
    { accessorKey: "price_method", header: "Cách lấy", cell: ({ row }) => priceMethodLabel(row.original.price_method) },
    {
        id: "source",
        header: "Nguồn HĐ",
        cell: ({ row }) => {
            const item = row.original
            if (item.source_contract_id) {
                return (
                    <Link
                        to="/purchasing/contracts/$id"
                        params={{ id: String(item.source_contract_id) }}
                        className="font-medium text-teal-700 hover:underline"
                    >
                        {item.source_contract_code || `HĐ #${item.source_contract_id}`}
                    </Link>
                )
            }
            return item.source_contract_code || selectedPriceSourceLabel(item.source_type)
        },
    },
    { accessorKey: "applied_price_vnd_per_kg", header: "Giá áp dụng/kg", cell: ({ row }) => formatCurrency(row.original.applied_price_vnd_per_kg) },
    { accessorKey: "previous_price_vnd_per_kg", header: "Kỳ trước/kg", cell: ({ row }) => formatCurrency(row.original.previous_price_vnd_per_kg) },
    { accessorKey: "increase_pct", header: "Tăng %", cell: ({ row }) => `${formatNumber(row.original.increase_pct ?? 0)}%` },
    { accessorKey: "warning_text", header: "Cảnh báo", cell: ({ row }) => row.original.warning_text || "-" },
]

const packagingCostColumns: ColumnDef<any>[] = [
    { accessorKey: "pack_match_key", header: "Pack key" },
    { accessorKey: "pack_name", header: "Bao bì" },
    { accessorKey: "base_pack_cost_vnd_per_kg", header: "Chi phí/kg", cell: ({ row }) => formatCurrency(row.original.base_pack_cost_vnd_per_kg) },
    { accessorKey: "priority", header: "Ưu tiên" },
    { accessorKey: "active", header: "Trạng thái", cell: ({ row }) => statusLabel(row.original.active) },
]

const marginColumns: ColumnDef<any>[] = [
    { accessorKey: "region_code", header: "Vùng" },
    { accessorKey: "product_group_id", header: "Nhóm" },
    { accessorKey: "margin_value", header: "Lợi nhuận", cell: ({ row }) => `${formatNumber(row.original.margin_value ?? 0)}${row.original.margin_type === "PERCENT" ? "%" : "đ"}` },
    { accessorKey: "warehouse_adjustment_vnd", header: "Tại kho", cell: ({ row }) => formatCurrency(row.original.warehouse_adjustment_vnd) },
    { accessorKey: "cash_adjustment_vnd", header: "Tiền mặt", cell: ({ row }) => formatCurrency(row.original.cash_adjustment_vnd) },
    { accessorKey: "term_8_10_adjustment_vnd", header: "8-10 ngày", cell: ({ row }) => formatCurrency(row.original.term_8_10_adjustment_vnd) },
    { accessorKey: "term_30_adjustment_vnd", header: "30 ngày", cell: ({ row }) => formatCurrency(row.original.term_30_adjustment_vnd) },
]

const transportColumns: ColumnDef<any>[] = [
    { accessorKey: "region_code", header: "Vùng" },
    { accessorKey: "match_type", header: "Áp dụng", cell: ({ row }) => matchTypeLabel(row.original.match_type) },
    { accessorKey: "match_value", header: "Tên hàng" },
    { accessorKey: "product_group_id", header: "Nhóm" },
    { accessorKey: "transport_cost_vnd", header: "VC chung", cell: ({ row }) => formatCurrency(row.original.transport_cost_vnd) },
    { accessorKey: "cash_transport_cost_vnd", header: "Tiền mặt", cell: ({ row }) => formatCurrency(row.original.cash_transport_cost_vnd) },
    { accessorKey: "term_8_10_transport_cost_vnd", header: "8-10 ngày", cell: ({ row }) => formatCurrency(row.original.term_8_10_transport_cost_vnd) },
    { accessorKey: "term_30_transport_cost_vnd", header: "30 ngày", cell: ({ row }) => formatCurrency(row.original.term_30_transport_cost_vnd) },
]

const unitConversionColumns: ColumnDef<any>[] = [
    { accessorKey: "product_id", header: "Sản phẩm" },
    { accessorKey: "unit_text", header: "ĐVT text" },
    { accessorKey: "size_code", header: "Size" },
    { accessorKey: "sale_unit_name", header: "ĐVT bán" },
    { accessorKey: "conversion_factor", header: "Hệ số", cell: ({ row }) => formatNumber(row.original.conversion_factor) },
    { accessorKey: "rounding_mode", header: "Làm tròn", cell: ({ row }) => roundingLabel(row.original.rounding_mode) },
    { accessorKey: "is_default", header: "Mặc định", cell: ({ row }) => row.original.is_default ? "Có" : "-" },
]
