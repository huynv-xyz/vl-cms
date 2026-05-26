import {
    Calculator,
    Download,
    Edit,
    FileSpreadsheet,
    LockKeyhole,
    Plus,
    Search,
    Trash2,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { apiDelete, apiGet, apiPost, type PagedResult } from "@/api/client"
import { getProduct, listProducts } from "@/api/product"
import { getProductGroup, listProductGroups } from "@/api/product-group"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type PricingV2Tab = "operations" | "costing" | "quotes"

type PricingV2PageProps = {
    initialTab?: PricingV2Tab
}

type PricingV2OperationsResponse = {
    chosen_prices: PagedResult<ChosenPriceApiRow>
    margin_params: MarginApiRow[]
    hdn_params: HdnApiRow[]
    packaging_profiles: PackagingApiRow[]
}

type PricingV2CostingResponse = {
    latest_snapshot: Record<string, any>
    snapshots: SnapshotApiRow[]
    items: PagedResult<CostingApiRow>
    metrics: Record<string, any>
}

type PricingV2QuotesResponse = {
    snapshot: Record<string, any>
    items: PagedResult<QuoteApiRow>
}

type ChosenPriceApiRow = Record<string, any>
type MarginApiRow = Record<string, any>
type HdnApiRow = Record<string, any>
type PackagingApiRow = Record<string, any>
type SnapshotApiRow = Record<string, any>
type CostingApiRow = Record<string, any>
type QuoteApiRow = Record<string, any>
type FilterIdList = string[]
type ProductOptionSource = {
    id: string | number
    quote_name?: string
    name?: string
}
type ProductGroupOptionSource = {
    id: string | number
    code?: string
    name?: string
}
type PricingGroupOptionSource = {
    id: string | number
    name?: string
}

const chosenPriceRows = [
    ["ZL.L5.C1.AMIULT", "AMINO MAX 5L", "Lít", "5", "Thổ", "BLL", "Theo shipment hoàn tất", "LH-2605-018", "107.880", "110.200", "107.880", "-", "AUTO", "-2,1%", "Theo dõi", "Còn hàng", "257.600", "0", "0", "Amino acid 45%, HCSN", "Can", "Thổ 5L"],
    ["SMH.K10.B.1919GSC", "Nguyên liệu NPK 19.19.19+TE", "Kg", "10", "Nga", "NPK_NGA", "Giá quản lý chốt", "LH-2606-004", "14.830.500", "13.940.000", "14.500.000", "14.500.000", "LOCK", "+6,4%", "Tăng >5%", "Còn hàng", "42.500", "0", "0", "NPK nhập khẩu", "Bao", "NPK Nga"],
    ["ZHF.K20.B.912HK", "Phân chim biển Organic Max 20kg", "Kg", "20", "Chile", "HC_CLCN", "Theo shipment mới nhất", "LH-2606-001", "12.790.000", "12.790.000", "12.790.000", "-", "AUTO", "+0,0%", "Ổn định", "Hàng mới", "15.607.000", "0", "0", "Hữu cơ cải tạo đất", "Bao", "Hữu cơ"],
    ["ZL.M500.C.CSVULT", "BIO - CSV 500ml", "ml", "500", "Thổ", "BLL", "Theo shipment gần nhất", "LH-2605-011", "163.000", "157.900", "163.000", "-", "AUTO", "+3,2%", "Tăng nhẹ", "Còn hàng", "326.500", "5.000", "0", "Dưỡng trái, HCSH", "Chai", "Thổ 500ml"],
    ["ZHF.K20.B.1515HT", "NPK 15-15-15+TE", "Kg", "20", "Trung Quốc", "NPK", "Chưa có lô mới", "-", "-", "-", "-", "-", "AUTO", "-", "Chưa có lô", "Hết hàng", "-", "0", "0", "NPK tổng hợp", "Bao", "NPK phổ thông"],
]

const hdnRows = [
    ["MIEN_NAM", "CLB_2", "Bón lá bột", "Kg", "CLIMATE 2", "2", "16.900", "7.400", "4.000", "0", "5.000", "500", "0", "0", "-"],
    ["MIEN_NAM", "MI.2.5G_AV6", "Vi lượng", "Kg", "MI 2.5", "2,5", "214.100", "80.000", "45.000", "35.000", "42.500", "6.600", "5.000", "0", "-"],
    ["MIEN_BAC", "NPK_NGA", "NPK Nga", "Kg", "NPK", "1", "3.000", "0", "0", "0", "0", "0", "3.000", "750", "-"],
]

const packagingRows = [
    ["ZL.L5.C1.AMIULT", "AMINO MAX 5L", "Lít", "5", "Can", "VARIANT_0", "YES", "L|5|C", "CL5_CAN", "0", "OK"],
    ["ZL.M500.C.AMIFLT", "AMINO MAX 500ml", "ml", "500", "Chai", "VARIANT_0", "YES", "M|500|C", "CM500_CHAI", "0", "OK"],
    ["HF.K25.B.GA.1035HB", "Khoáng hữu cơ 10.3.5-45 OM", "Kg", "25", "Bao", "GA", "YES", "K|25|B", "BK25_BAO", "460", "OK"],
    ["ZHF.K20.B.1515HT", "NPK 15-15-15+TE", "Kg", "20", "Bao", "VARIANT_0", "NO", "K|20|B", "-", "0", "KHONG_TINH_BB"],
    ["ZHF.K25.B.168HT", "NPK 16-16-8+TE", "Kg", "25", "Bao", "VARIANT_0", "NO", "K|25|B", "-", "0", "KHONG_TINH_BB"],
]

const marginRows = [
    ["BLL", "Bón lá lỏng", "21%", "25%"],
    ["BLL-25", "Bón lá lỏng 25", "30%", "40%"],
    ["NPK_NGA", "NPK Nga", "18%", "22%"],
    ["HC_CLCN", "Hữu cơ", "16%", "20%"],
]

const costingRows = [
    ["ZL.L5.C1.AMIULT", "AMINO MAX 5L", "BLL", "107.880", "0", "93.400", "201.280", "251.600", "276.000", "OK"],
    ["ZL.M500.C.AMIFLT", "AMINO MAX 500ml", "BLL", "117.685", "0", "93.400", "211.085", "263.869", "289.000", "OK"],
    ["ZHF.K20.B.1515HT", "NPK 15-15-15+TE", "NPK", "12.790.000", "0", "3.000", "12.793.000", "15.607.000", "15.890.000", "Thiếu lô mới"],
    ["SMH.K10.B.1919GSC", "NPK 19-19-19+TE", "NPK_SMALL", "20.000", "460", "13.610", "34.070", "42.500", "45.000", "Giá LOCK"],
]

const pricingSnapshotRows = [
    ["GT-2026-05-23-001", "23/05/2026 09:30", "718", "Mới nhất", "Nguyễn A", "Đã tính xong"],
    ["GT-2026-05-20-001", "20/05/2026 17:05", "716", "Đang lưu lịch sử", "Nguyễn A", "Đã tính xong"],
    ["GT-2026-05-13-001", "13/05/2026 15:20", "712", "Đang lưu lịch sử", "Nguyễn A", "Có cảnh báo"],
]

const quoteProductRows = [
    ["1", "AMINO MAX 5L", "Amino acid 45%, HCSN", "Can 5L", "Thổ", "251.600", "254.600", "257.600"],
    ["2", "AMINO MAX 500ml", "Amino acid 45%, HCSN", "Chai 500ml", "Thổ", "263.869", "266.869", "269.869"],
    ["3", "NPK 15-15-15+TE", "NPK tổng hợp", "Bao 20kg", "Trung Quốc", "15.607.000", "15.750.000", "15.890.000"],
    ["4", "NPK 19-19-19+TE", "NPK nhập khẩu", "Bao 10kg", "Nga", "42.500", "43.500", "45.000"],
    ["5", "BIO - CSV 500ml", "Dưỡng trái, HCSH", "Chai 500ml", "Thổ", "326.500", "337.000", "340.000"],
]

export default function PricingV2Page({ initialTab = "operations" }: PricingV2PageProps) {
    const content = {
        operations: <OperationsTab />,
        costing: <CostingTab />,
        quotes: <QuotesTab />,
    }[initialTab]

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <PageHeader page={initialTab} />
            {content}
        </div>
    )
}

function PageHeader({ page }: { page: PricingV2Tab }) {
    const titleMap = {
        operations: "Điều hành giá",
        costing: "Tính giá thành",
        quotes: "Bảng giá",
    }

    const descriptionMap = {
        costing: "Tạo snapshot tính giá và xem lại lịch sử các lần tính giá.",
        quotes: "Tra cứu bảng giá từ snapshot mới nhất và xuất file cho nhân viên.",
    } as const

    return (
        <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{titleMap[page]}</h1>
                {page !== "operations" ? (
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        {descriptionMap[page]}
                    </p>
                ) : null}
            </div>
            {page === "costing" ? (
                <Button>
                    <Calculator className="mr-2 size-4" />
                    Tính giá và tạo snapshot
                </Button>
            ) : null}
        </div>
    )
}
function OperationsTab() {
    const [data, setData] = useState<PricingV2OperationsResponse | null>(null)
    const [groupIds, setGroupIds] = useState<FilterIdList>([])
    const [productIds, setProductIds] = useState<FilterIdList>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setData(await apiGet<PricingV2OperationsResponse>("/pricing/v2/operations", {
                group_ids: groupIds.join(","),
                product_ids: productIds.join(","),
                page,
                limit: 10,
            }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu điều hành giá")
        } finally {
            setLoading(false)
        }
    }, [groupIds, productIds, page])

    useEffect(() => {
        void load()
    }, [load])

    const chosenRows = data?.chosen_prices?.items?.map(mapChosenPriceRow) ?? chosenPriceRows
    const marginDataRows = data?.margin_params?.length ? mapMarginRows(data.margin_params) : []
    const hdnDataRows = data?.hdn_params?.map(mapHdnRow) ?? hdnRows
    const packagingDataRows = data?.packaging_profiles?.map(mapPackagingRow) ?? []

    return (
        <div className="grid gap-6">
            <Tabs defaultValue="chosen-price" className="gap-6">
                <TabsList className="h-11 w-full justify-start overflow-x-auto rounded-lg bg-muted/60 p-1 lg:w-fit">
                    <TabsTrigger value="chosen-price">Chọn giá</TabsTrigger>
                    <TabsTrigger value="margin">Lợi nhuận</TabsTrigger>
                    <TabsTrigger value="hdn">HĐN</TabsTrigger>
                    <TabsTrigger value="packaging">Bao bì</TabsTrigger>
                </TabsList>

                <TabsContent value="chosen-price" className="mt-0">
                    <ChosenPriceSection
                        rows={chosenRows}
                        groupIds={groupIds}
                        onGroupIdsChange={(value) => {
                            setPage(1)
                            setGroupIds(value)
                            setProductIds([])
                        }}
                        productIds={productIds}
                        onProductIdsChange={(value) => {
                            setPage(1)
                            setProductIds(value)
                        }}
                        loading={loading}
                        page={data?.chosen_prices?.current_page ?? page}
                        totalPage={data?.chosen_prices?.total_page ?? 1}
                        onPageChange={setPage}
                    />
                </TabsContent>
                <TabsContent value="margin" className="mt-0">
                    <MarginParameterTable rows={marginDataRows} />
                </TabsContent>
                <TabsContent value="hdn" className="mt-0">
                    <EditableParameterTable
                        title="THAM_SỐ_HDN"
                        description="Các cấu phần tham gia cấu thành giá bán: GIA_THANH_FINAL lấy tổng phí, CP_GIA_THANH và report tách từng chỉ số HDN."
                        headers={["Miền", "Mã nhóm VTHH", "Diễn giải", "ĐVT", "Nhóm tính điểm", "Hệ số", "Tổng phí", "HD năm VIP", "Quà ND", "CK quý", "Du lịch/SK", "Quỹ MKT-KD", "Thưởng sale", "Vận chuyển", "Ghi chú"]}
                        rows={hdnDataRows}
                    />
                </TabsContent>
                <TabsContent value="packaging" className="mt-0">
                    <PackagingParameterTable rows={packagingDataRows} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ChosenPriceSection({
    rows,
    groupIds,
    onGroupIdsChange,
    productIds,
    onProductIdsChange,
    loading,
    page,
    totalPage,
    onPageChange,
}: {
    rows: string[][]
    groupIds: FilterIdList
    onGroupIdsChange: (value: FilterIdList) => void
    productIds: FilterIdList
    onProductIdsChange: (value: FilterIdList) => void
    loading: boolean
    page: number
    totalPage: number
    onPageChange: (page: number) => void
}) {
    const [displayRows, setDisplayRows] = useState<string[][]>(rows)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState<string[]>([])

    useEffect(() => {
        setDisplayRows(rows)
    }, [rows])

    const openEdit = (row: string[], index: number) => {
        setForm(row)
        setEditingIndex(index)
    }

    const saveChosenPrice = () => {
        if (editingIndex === null) return
        setDisplayRows((current) => current.map((row, index) => index === editingIndex ? form : row))
        setEditingIndex(null)
        toast.success("Đã cập nhật cấu hình chọn giá")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <LockKeyhole className="size-5 text-primary" />
                                Chọn giá
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <AsyncMultiSelect
                                className="h-10 min-w-[260px] flex-1 border-slate-300 bg-white shadow-xs lg:max-w-sm"
                                value={groupIds}
                                onChange={onGroupIdsChange}
                                searchPlaceholder="Nhập nhóm sản phẩm..."
                                placeholder="Nhóm sản phẩm"
                                dataSource={{
                                    getList: listProductGroups,
                                    getById: getProductGroup,
                                    params: { page: 1, size: 200 },
                                }}
                                mapOption={pricingProductGroupOption}
                                dedupeByLabel
                            />
                            <AsyncMultiSelect
                                className="h-10 min-w-[280px] flex-[1.2_1_0] border-slate-300 bg-white shadow-xs lg:max-w-md"
                                value={productIds}
                                onChange={onProductIdsChange}
                                searchPlaceholder="Nhập tên sản phẩm..."
                                placeholder="Sản phẩm"
                                dataSource={{
                                    getList: listProducts,
                                    getById: getProduct,
                                    params: {
                                        page: 1,
                                        size: 20,
                                        nature: "HANG_HOA,NGUYEN_VAT_LIEU",
                                        group_ids: groupIds.join(","),
                                    },
                                }}
                                mapOption={pricingProductOption}
                                dedupeByLabel
                            />
                        </div>
                        <ChosenPriceList rows={displayRows} onEdit={openEdit} />
                        <PricingPagination
                            page={page}
                            totalPage={totalPage}
                            loading={loading}
                            onPageChange={onPageChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <ChosenPriceDialog
                open={editingIndex !== null}
                row={form}
                onRowChange={setForm}
                onOpenChange={(open) => !open && setEditingIndex(null)}
                onSave={saveChosenPrice}
            />
        </>
    )
}

function CostingTab() {
    const [data, setData] = useState<PricingV2CostingResponse | null>(null)
    const [keyword, setKeyword] = useState("")
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setData(await apiGet<PricingV2CostingResponse>("/pricing/v2/costing", { keyword, limit: 10 }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu tính giá")
        } finally {
            setLoading(false)
        }
    }, [keyword])

    useEffect(() => {
        void load()
    }, [load])

    const calculate = async () => {
        setLoading(true)
        try {
            await apiPost("/pricing/v2/costing/calculate", {
                pricingDate: new Date().toISOString().slice(0, 10),
            })
            toast.success("Đã tạo snapshot tính giá")
            await load()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Tính giá thất bại")
        } finally {
            setLoading(false)
        }
    }

    const snapshot = data?.latest_snapshot ?? {}
    const metrics = data?.metrics ?? {}
    const snapshotRows = data?.snapshots?.map(mapSnapshotRow) ?? pricingSnapshotRows
    const itemRows = data?.items?.items?.map(mapCostingRow) ?? costingRows

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard title="Snapshot đang xem" value="GT-2026-05-23" note="Ngày tính giá mới nhất" />
                <MetricCard title="Sản phẩm" value="718" note="SKU có trong snapshot" />
                <MetricCard title="Cảnh báo" value="11" note="Thiếu bao bì, thiếu giá nhập, biến động giá" />
                <MetricCard title="Trạng thái" value="Đã tính" note="Mock UI chưa lưu backend" />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="size-5 text-primary" />
                                Tính giá thành
                            </CardTitle>
                            <CardDescription>
                                Người dùng cấu hình tham số ở tab Điều hành giá, sau đó bấm tính giá để tạo snapshot mới và lưu ngày tính giá.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Input className="w-44" value={new Date().toLocaleDateString("vi-VN")} readOnly aria-label="Ngày tính giá" />
                            <Button onClick={calculate} disabled={loading}>
                                <Calculator className="mr-2 size-4" />
                                Tính giá và tạo snapshot
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Lịch sử snapshot</CardTitle>
                            <CardDescription>Chọn một lần tính giá trước đó để xem lại danh sách sản phẩm và giá đã lưu tại thời điểm đó.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline">Mới nhất</Button>
                            <Button variant="outline">Tháng 05/2026</Button>
                            <Button variant="outline">Có cảnh báo</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        headers={["Mã snapshot", "Ngày tính giá", "Số SKU", "Loại", "Người tính", "Trạng thái"]}
                        rows={snapshotRows}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Danh sách sản phẩm trong snapshot mới nhất</CardTitle>
                            <CardDescription>Hiển thị output đã tính và đã lưu theo snapshot đang chọn.</CardDescription>
                        </div>
                        <div className="relative w-full lg:max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Tìm theo tên sản phẩm hoặc SKU..." />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DataTable
                        headers={["SKU", "Tên hàng", "Mã BG", "Giá nhập", "Bao bì", "Phí BH", "Giá thành MN", "Giá bán MN", "Nợ 30 đại lý", "Ghi chú"]}
                        rows={itemRows}
                    />
                    <MockPagination total={data?.items?.total} loading={loading} />
                </CardContent>
            </Card>

        </div>
    )
}

function QuotesTab() {
    const [data, setData] = useState<PricingV2QuotesResponse | null>(null)
    const [keyword, setKeyword] = useState("")
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setData(await apiGet<PricingV2QuotesResponse>("/pricing/v2/quotes", { keyword, limit: 10 }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không tải được bảng giá")
        } finally {
            setLoading(false)
        }
    }, [keyword])

    useEffect(() => {
        void load()
    }, [load])

    const quoteRows = data?.items?.items?.map((row, index) => mapQuoteRow(row, index)) ?? quoteProductRows

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard title="Snapshot mới nhất" value="GT-2026-05-23" note="Tính lúc 23/05/2026 09:30" />
                <MetricCard title="Nguồn bảng giá" value="Snapshot" note="Dữ liệu đã tính và lưu" />
                <MetricCard title="Sản phẩm" value="718" note="Theo bộ lọc hiện tại" />
                <MetricCard title="Phạm vi" value="Miền Nam" note="Kho đại lý" />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="size-5 text-primary" />
                                Bảng giá
                            </CardTitle>
                            <CardDescription>
                                Danh sách sản phẩm lấy từ snapshot tính giá mới nhất, dùng để tra cứu và xuất báo giá cho nhân viên.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline">
                                <Download className="mr-2 size-4" />
                                Xuất Excel
                            </Button>
                            <Button variant="outline">
                                <Download className="mr-2 size-4" />
                                Xuất PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_210px_180px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Tìm theo tên sản phẩm..." />
                        </div>
                        <Button variant="outline" className="justify-start">Chọn nhóm sản phẩm</Button>
                        <Button variant="outline" className="justify-start">Kho đại lý</Button>
                        <Button variant="outline" className="justify-start">Miền Nam</Button>
                    </div>

                    <DataTable
                        headers={["STT", "Tên sản phẩm", "Công dụng", "ĐVT", "Xuất xứ", "Giá tiền ngay", "GIÁ 8-10 NGÀY", "GIÁ 30 NGÀY"]}
                        rows={quoteRows}
                    />
                    <MockPagination total={data?.items?.total} loading={loading} />
                </CardContent>
            </Card>
        </div>
    )
}

function mapChosenPriceRow(row: ChosenPriceApiRow): string[] {
    return [
        text(row.sku),
        text(row.product_name),
        text(row.unit_name),
        text(row.size_value),
        text(row.origin_text),
        text(row.pricing_group_code),
        methodLabel(row.price_method),
        text(row.source_lot_code, "-"),
        money(row.shipment_price_vnd),
        money(row.first_lot_price_vnd),
        money(row.applied_price_vnd),
        money(row.locked_price_vnd, "-"),
        text(row.price_status, "AUTO"),
        percent(row.price_change_percent),
        text(row.alert_text, row.price_change_percent ? "Theo dõi" : "-"),
        text(row.stock_status, "-"),
        money(row.gia_dc_vnd, "-"),
        money(row.km_mn_vnd),
        money(row.km_mb_vnd),
        text(row.usage_text),
        text(row.pack_type_text),
        text(row.segment_text),
    ]
}

function mapMarginRows(rows: MarginApiRow[]): string[][] {
    const grouped = new Map<string, string[]>()
    rows.forEach((row) => {
        const key = text(row.pricing_group_id)
        const current = grouped.get(key) ?? [key, text(row.pricing_group_name), "0%", "0%"]
        if (isNorthRegionName(row.region_name)) current[2] = percent(row.margin_percent)
        else current[3] = percent(row.margin_percent)
        grouped.set(key, current)
    })
    return Array.from(grouped.values())
}

function isNorthRegionName(value: any) {
    return normalizeVietnamese(text(value)).includes("MIEN BAC")
}

function normalizeVietnamese(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Đ/g, "D")
        .replace(/đ/g, "d")
        .toUpperCase()
        .trim()
}

function mapHdnRow(row: HdnApiRow): string[] {
    return [
        text(row.region_code),
        text(row.product_group_code),
        text(row.product_group_name),
        text(row.dvt),
        text(row.calculation_group),
        text(row.coefficient),
        money(row.total_fee_vnd),
        money(row.hd_nam_vip_vnd),
        money(row.qua_nd_vnd),
        money(row.ck_quy_vnd),
        money(row.du_lich_su_kien_vnd),
        money(row.quy_mkt_kd_vnd),
        money(row.thuong_sale_vnd),
        money(row.van_chuyen_vnd),
        text(row.note, "-"),
    ]
}

function mapPackagingRow(row: PackagingApiRow): string[] {
    return [
        text(row.product_id),
        text(row.sku),
        text(row.product_name),
        text(row.unit_text),
        text(row.size_code),
        text(row.pack_type_text),
        text(row.variant_code),
        text(row.can_dong_goi),
        text(row.pack_match_key),
        text(row.packing_code, "-"),
        money(row.pack_cost_per_kg_vnd),
        text(row.check_packing_status),
    ]
}

function mapSnapshotRow(row: SnapshotApiRow): string[] {
    return [
        text(row.code),
        text(row.calculated_at, text(row.pricing_date)),
        text(row.item_count, "0"),
        row.is_latest ? "Mới nhất" : "Lịch sử",
        "-",
        text(row.status),
    ]
}

function mapCostingRow(row: CostingApiRow): string[] {
    return [
        text(row.product_code),
        text(row.product_name),
        text(row.pricing_group_code),
        money(row.purchase_price_vnd),
        money(row.packaging_cost_vnd),
        money(row.sales_expense_vnd),
        money(row.cogs_vnd),
        money(row.cash_price_vnd),
        money(row.term_30_price_vnd),
        text(row.warning_text, text(row.note, "OK")),
    ]
}

function mapQuoteRow(row: QuoteApiRow, index: number): string[] {
    return [
        String(index + 1),
        text(row.product_name),
        text(row.usage_text),
        text(row.unit_name),
        text(row.origin_text),
        money(row.cash_price_vnd),
        money(row.term_8_10_price_vnd),
        money(row.term_30_price_vnd),
    ]
}

function text(value: any, fallback = ""): string {
    return value === undefined || value === null || value === "" ? fallback : String(value)
}

function money(value: any, fallback = "0"): string {
    if (value === undefined || value === null || value === "") return fallback
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return String(value)
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(numeric)
}

function percent(value: any): string {
    if (value === undefined || value === null || value === "") return "-"
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return String(value)
    return `${numeric > 0 ? "+" : ""}${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(numeric)}%`
}

function cleanPercent(value: string) {
    if (!value || value === "-") return ""
    return value
        .replace("%", "")
        .replace("+", "")
        .replace(",", ".")
        .trim()
}

function displayPercent(value: string) {
    const clean = cleanPercent(value)
    return clean ? `${clean.replace("%", "")}%` : ""
}

function numberOrNull(value: string) {
    const clean = cleanPercent(value)
    return clean === "" ? null : Number(clean)
}

function cleanNumber(value: string) {
    return value === "-" ? "" : value.replace(/\./g, "").replace(",", ".").trim()
}

function methodLabel(value: any): string {
    const method = text(value, "LATEST")
    if (method === "WAVG") return "WAVG"
    return "Mới nhất"
}

function methodValue(value: string) {
    if (value === "WAVG") return "WAVG"
    if (value === "Mới nhất" || value === "Shipment mới nhất") return "LATEST"
    return value === "LATEST" ? "LATEST" : "LATEST"
}

function MetricCard({ title, value, note }: { title: string; value: string; note: string }) {
    return (
        <Card className="gap-3 py-5">
            <CardContent className="px-5">
                <div className="text-sm text-muted-foreground">{title}</div>
                <div className="mt-2 text-xl font-semibold">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{note}</div>
            </CardContent>
        </Card>
    )
}

function MarginParameterTable({ rows }: { rows: string[][] }) {
    const [tableRows, setTableRows] = useState<string[][]>(rows)
    const [pricingGroups, setPricingGroups] = useState<PricingGroupOptionSource[]>([])
    const [keyword, setKeyword] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState({ pricingGroupId: "", mb: "", mn: "" })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setTableRows(rows)
    }, [rows])

    useEffect(() => {
        let active = true
        apiGet<PagedResult<PricingGroupOptionSource>>("/pricing/groups", { page: 1, size: 200 })
            .then((res) => {
                if (active) setPricingGroups(res.items ?? [])
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : "Không tải được nhóm lợi nhuận")
            })
        return () => {
            active = false
        }
    }, [])

    const filteredRows = tableRows.filter((row) =>
        !keyword.trim() || row.slice(1).join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    )

    const openCreate = () => {
        setForm({ pricingGroupId: "", mb: "", mn: "" })
        setEditingIndex(tableRows.length)
    }

    const openEdit = (row: string[]) => {
        const rowKey = row.join("|")
        const sourceIndex = tableRows.findIndex((item) => item.join("|") === rowKey)
        if (sourceIndex < 0) return
        setForm({ pricingGroupId: tableRows[sourceIndex][0] ?? "", mb: cleanPercent(tableRows[sourceIndex][2]), mn: cleanPercent(tableRows[sourceIndex][3]) })
        setEditingIndex(sourceIndex)
    }

    const saveRow = async () => {
        if (editingIndex === null) return
        const group = pricingGroups.find((item) => String(item.id) === String(form.pricingGroupId))
        if (!group) {
            toast.error("Chọn nhóm lợi nhuận")
            return
        }
        setSaving(true)
        try {
            await apiPost("/pricing/v2/margin-params/batch", {
                pricingGroupId: Number(group.id),
                mbMarginPercent: numberOrNull(form.mb),
                mnMarginPercent: numberOrNull(form.mn),
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không lưu được tham số lợi nhuận")
            setSaving(false)
            return
        }
        const nextRow = [String(group.id), group.name || `#${group.id}`, displayPercent(form.mb), displayPercent(form.mn)]
        setTableRows((current) => {
            if (editingIndex >= current.length) return [...current, nextRow]
            return current.map((row, index) => index === editingIndex ? nextRow : row)
        })
        setEditingIndex(null)
        setSaving(false)
        toast.success(editingIndex >= tableRows.length ? "Đã thêm tham số lợi nhuận" : "Đã cập nhật tham số lợi nhuận")
    }

    const deleteRow = async (row: string[]) => {
        if (!window.confirm("Xóa tham số lợi nhuận này?")) return
        try {
            await apiDelete(`/pricing/v2/margin-params/${row[0]}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không xóa được tham số lợi nhuận")
            return
        }
        const rowKey = row.join("|")
        setTableRows((current) => current.filter((item) => item.join("|") !== rowKey))
        toast.success("Đã xóa tham số lợi nhuận")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <CardTitle>Tham số lợi nhuận</CardTitle>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm nhóm..."
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Tên nhóm</TableHead>
                                    <TableHead>Miền Bắc</TableHead>
                                    <TableHead>Miền Nam</TableHead>
                                    <TableHead>Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow key={row[0]}>
                                        <TableCell className="font-medium">{row[1]}</TableCell>
                                        <TableCell>{row[2]}</TableCell>
                                        <TableCell>{row[3]}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    aria-label="Sửa"
                                                    onClick={() => openEdit(row)}
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    aria-label="Xóa"
                                                    onClick={() => void deleteRow(row)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingIndex !== null && editingIndex >= tableRows.length ? "Thêm tham số lợi nhuận" : "Sửa tham số lợi nhuận"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Nhóm</span>
                            <Select
                                value={form.pricingGroupId}
                                disabled={editingIndex !== null && editingIndex < tableRows.length}
                                onValueChange={(value) => setForm((current) => ({ ...current, pricingGroupId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhóm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pricingGroups.map((group) => (
                                        <SelectItem key={group.id} value={String(group.id)}>
                                            {group.name || `#${group.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1.5 text-sm">
                                <span className="font-medium">Miền Bắc</span>
                                <Input type="number" value={form.mb} onChange={(event) => setForm((current) => ({ ...current, mb: event.target.value }))} />
                            </label>
                            <label className="space-y-1.5 text-sm">
                                <span className="font-medium">Miền Nam</span>
                                <Input type="number" value={form.mn} onChange={(event) => setForm((current) => ({ ...current, mn: event.target.value }))} />
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingIndex(null)}>Hủy</Button>
                        <Button onClick={saveRow} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function PackagingParameterTable({ rows }: { rows: string[][] }) {
    const [tableRows, setTableRows] = useState<string[][]>(rows)
    const [keyword, setKeyword] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setTableRows(rows)
    }, [rows])

    const filteredRows = tableRows.filter((row) =>
        !keyword.trim() || row.slice(1).join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    )

    const openEdit = (row: string[]) => {
        const rowKey = row.join("|")
        const sourceIndex = tableRows.findIndex((item) => item.join("|") === rowKey)
        if (sourceIndex < 0) return
        setForm(tableRows[sourceIndex])
        setEditingIndex(sourceIndex)
    }

    const setFormField = (index: number, value: string) => {
        setForm((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
    }

    const saveRow = async () => {
        if (editingIndex === null) return
        setSaving(true)
        try {
            await apiPost("/pricing/v2/packaging-profiles", {
                productId: Number(form[0]),
                unitText: form[3],
                sizeCode: form[4],
                packTypeText: form[5],
                variantCode: form[6],
                canDongGoi: form[7],
                packMatchKey: form[8],
                packingCode: form[9],
                packCostPerKgVnd: numberOrNull(form[10]) ?? 0,
                checkPackingStatus: form[11],
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không lưu được tham số bao bì")
            setSaving(false)
            return
        }
        setTableRows((current) => current.map((row, index) => index === editingIndex ? form : row))
        setEditingIndex(null)
        setSaving(false)
        toast.success("Đã cập nhật tham số bao bì")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Tham số bao bì / Định mức bao bì</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm sản phẩm..."
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Tên hàng</TableHead>
                                    <TableHead>ĐVT</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Có tính BB</TableHead>
                                    <TableHead>Packing code</TableHead>
                                    <TableHead>Pack cost</TableHead>
                                    <TableHead>Check packing</TableHead>
                                    <TableHead>Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow key={row[0]}>
                                        <TableCell className="font-mono text-xs font-semibold text-primary">{row[1]}</TableCell>
                                        <TableCell className="min-w-[260px] font-medium">{row[2]}</TableCell>
                                        <TableCell>{row[3]}</TableCell>
                                        <TableCell>{row[4]}</TableCell>
                                        <TableCell>{renderCell(row[7])}</TableCell>
                                        <TableCell>{row[9] || "-"}</TableCell>
                                        <TableCell>{row[10]}</TableCell>
                                        <TableCell>{renderCell(row[11])}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label="Sửa"
                                                onClick={() => openEdit(row)}
                                            >
                                                <Edit className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sửa tham số bao bì</DialogTitle>
                    </DialogHeader>
                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="font-mono text-xs font-semibold text-primary">{form[1]}</div>
                        <div className="mt-1 text-sm font-medium">{form[2]}</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Có tính bao bì</span>
                            <Select value={form[7] || "YES"} onValueChange={(value) => setFormField(7, value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="YES">YES</SelectItem>
                                    <SelectItem value="NO">NO</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                        <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Pack match key</span>
                            <Input value={form[8] ?? ""} onChange={(event) => setFormField(8, event.target.value)} />
                        </label>
                        <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Packing code</span>
                            <Input value={form[9] ?? ""} onChange={(event) => setFormField(9, event.target.value)} />
                        </label>
                        <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Pack cost</span>
                            <Input type="number" value={cleanNumber(form[10])} onChange={(event) => setFormField(10, event.target.value)} />
                        </label>
                        <label className="space-y-1.5 text-sm md:col-span-2">
                            <span className="font-medium">Check packing</span>
                            <Select value={form[11] || "OK"} onValueChange={(value) => setFormField(11, value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OK">OK</SelectItem>
                                    <SelectItem value="CHUA_CAU_HINH">CHUA_CAU_HINH</SelectItem>
                                    <SelectItem value="KHONG_TINH_BB">KHONG_TINH_BB</SelectItem>
                                    <SelectItem value="LOI_MATCH">LOI_MATCH</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingIndex(null)}>Hủy</Button>
                        <Button onClick={saveRow} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function EditableParameterTable({
    title,
    description,
    headers,
    rows,
}: {
    title: string
    description?: string
    headers: string[]
    rows: string[][]
}) {
    const [tableRows, setTableRows] = useState<string[][]>(rows)
    const [keyword, setKeyword] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState<string[]>([])
    const dialogOpen = editingIndex !== null

    useEffect(() => {
        setTableRows(rows)
    }, [rows])

    const filteredRows = tableRows.filter((row) =>
        !keyword.trim() || row.join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    )

    const openCreate = () => {
        setForm(headers.map(() => ""))
        setEditingIndex(tableRows.length)
    }

    const openEdit = (row: string[]) => {
        const rowKey = row.join("|")
        const sourceIndex = tableRows.findIndex((item) => item.join("|") === rowKey)
        setForm(row)
        setEditingIndex(sourceIndex >= 0 ? sourceIndex : null)
    }

    const saveRow = () => {
        if (editingIndex === null) return
        setTableRows((current) => {
            if (editingIndex >= current.length) return [...current, form]
            return current.map((row, index) => index === editingIndex ? form : row)
        })
        setEditingIndex(null)
        toast.success(editingIndex >= tableRows.length ? "Đã thêm tham số" : "Đã cập nhật tham số")
    }

    const deleteRow = (row: string[]) => {
        if (!window.confirm("Xóa tham số này?")) return
        const rowKey = row.join("|")
        setTableRows((current) => current.filter((item) => item.join("|") !== rowKey))
        toast.success("Đã xóa tham số")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            {description ? <CardDescription>{description}</CardDescription> : null}
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Tìm tham số..."
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                            />
                        </div>
                    </div>
                    <DataTable
                        headers={[...headers, "Thao tác"]}
                        rows={filteredRows.map((row) => [...row, "__ACTIONS__"])}
                        onEditRow={(row) => openEdit(row.slice(0, headers.length))}
                        onDeleteRow={(row) => deleteRow(row.slice(0, headers.length))}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && setEditingIndex(null)}>
                <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingIndex !== null && editingIndex >= tableRows.length ? "Thêm tham số" : "Sửa tham số"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-2">
                        {headers.map((header, index) => (
                            <label key={header} className="space-y-1.5 text-sm">
                                <span className="font-medium">{header}</span>
                                <Input
                                    value={form[index] ?? ""}
                                    onChange={(event) =>
                                        setForm((current) =>
                                            current.map((value, valueIndex) =>
                                                valueIndex === index ? event.target.value : value
                                            )
                                        )
                                    }
                                />
                            </label>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingIndex(null)}>Hủy</Button>
                        <Button onClick={saveRow}>Lưu</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function MockPagination({ total, loading }: { total?: number; loading?: boolean }) {
    return (
        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>Hiển thị 1-5 trên 718 sản phẩm</div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Trước</Button>
                <Button size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Sau</Button>
            </div>
        </div>
    )
}

function PricingPagination({
    page,
    totalPage,
    loading,
    onPageChange,
}: {
    page: number
    totalPage: number
    loading: boolean
    onPageChange: (page: number) => void
}) {
    return (
        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-end">
            <CardPagination
                pageIndex={Math.max(page - 1, 0)}
                pageCount={Math.max(totalPage, 1)}
                onPageChange={(pageIndex) => {
                    if (!loading) onPageChange(pageIndex + 1)
                }}
            />
        </div>
    )
}

function pricingProductOption(x: ProductOptionSource) {
    return {
        value: x.id,
        label: x.quote_name || x.name || "",
        raw: x,
    }
}

function pricingProductGroupOption(x: ProductGroupOptionSource) {
    const code = x.code || String(x.id)
    return {
        value: x.id,
        label: x.name || code,
        raw: x,
    }
}

function ChosenPriceList({
    rows,
    onEdit,
}: {
    rows: string[][]
    onEdit: (row: string[], index: number) => void
}) {
    return (
        <div className="space-y-3">
            {rows.map((row, index) => (
                <ChosenPriceCard
                    key={row[0]}
                    row={row}
                    index={index + 1}
                    onEdit={() => onEdit(row, index)}
                />
            ))}
        </div>
    )
}

function ChosenPriceCard({
    row,
    index,
    onEdit,
}: {
    row: string[]
    index: number
    onEdit: () => void
}) {
    const [
        sku,
        name,
        unit,
        size,
        origin,
        priceGroup,
        method,
        sourceLot,
        shipmentPrice,
        firstLotPrice,
        appliedPrice,
        lockedPrice,
        mode,
        change,
        alert,
        stockStatus,
        adjustedPrice,
        kmMn,
        kmMb,
        usage,
        packType,
        segment,
    ] = row

    return (
        <div className="overflow-hidden rounded-lg border border-[#d8d5c9] bg-background shadow-xs">
            <div className="grid min-h-[104px] grid-cols-[44px_minmax(170px,220px)_minmax(260px,1fr)_72px] border-b border-[#d8d5c9] bg-[#fbfaf2]">
                <div className="flex items-center justify-center border-r border-[#d8d5c9] text-sm text-slate-600">
                    {index}
                </div>
                <div className="space-y-1 border-r border-[#d8d5c9] px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                        {renderCell(mode)}
                        {renderCell(stockStatus)}
                    </div>
                    <div className="font-mono text-sm font-bold text-sky-700">{sku}</div>
                    <div className="text-xs text-slate-600">
                        {unit} · Size {size} · {origin}
                    </div>
                </div>
                <div className="min-w-0 space-y-1 px-5 py-4">
                    <div className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">{name}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>Mã BG: <b>{priceGroup}</b></span>
                        <span>Đóng gói: <b>{packType}</b></span>
                        <span>Phân khúc: <b>{segment}</b></span>
                    </div>
                    <div className="line-clamp-1 text-xs text-slate-500">{usage}</div>
                </div>
                <div className="flex items-center justify-center gap-1 border-l border-[#d8d5c9]">
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Sửa" onClick={onEdit}>
                        <Edit className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4">
                <PriceCell label="Nguồn giá">
                    <InfoRow label="Cách lấy" value={method} />
                    <InfoRow label="Nguồn lô" value={sourceLot} strong />
                    <InfoRow label="Giá shipment" value={shipmentPrice} strong />
                </PriceCell>
                <PriceCell label="Cấu hình chọn giá">
                    <InfoRow label="Giá áp dụng" value={appliedPrice} strong tone="primary" />
                    <InfoRow label="Giá tự nhập/chốt" value={lockedPrice} />
                    <InfoRow label="Trạng thái" value={mode} />
                </PriceCell>
                <PriceCell label="Biến động lô">
                    <InfoRow label="Giá lô đầu tiên" value={firstLotPrice} strong />
                    <InfoRow label="% tăng từ đầu" value={change} tone={change.startsWith("+") && change !== "+0,0%" ? "warning" : "default"} />
                    <div className="flex flex-wrap gap-2">
                        {renderCell(alert)}
                    </div>
                </PriceCell>
                <PriceCell label="Tình trạng / Điều chỉnh">
                    <div className="flex flex-wrap gap-2">
                        {renderCell(stockStatus)}
                    </div>
                    <InfoRow label="GIÁ_DC" value={adjustedPrice} strong />
                    <InfoRow label="KM_MN" value={kmMn} />
                    <InfoRow label="KM_MB" value={kmMb} />
                </PriceCell>
            </div>
        </div>
    )
}

function ChosenPriceDialog({
    open,
    row,
    onRowChange,
    onOpenChange,
    onSave,
}: {
    open: boolean
    row: string[]
    onRowChange: (row: string[]) => void
    onOpenChange: (open: boolean) => void
    onSave: () => void
}) {
    const inputValue = (value: string | undefined) => value === "-" ? "" : value ?? ""
    const normalizeInput = (value: string) => value.trim()

    const setField = (index: number, value: string) => {
        onRowChange(row.map((item, itemIndex) => itemIndex === index ? value : item))
    }

    const isLocked = row[12] === "LOCK"
    const textFields = [
        { index: 15, label: "Tình trạng hàng" },
        { index: 16, label: "GIÁ_DC" },
        { index: 17, label: "KM_MN" },
        { index: 18, label: "KM_MB" },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sửa cấu hình chọn giá</DialogTitle>
                </DialogHeader>
                <div className="rounded-md border bg-muted/30 p-3">
                    <div className="font-mono text-xs font-semibold text-primary">{row[0]}</div>
                    <div className="mt-1 text-sm font-medium">{row[1]}</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Phương pháp chọn giá</span>
                        <Select value={methodValue(row[6])} onValueChange={(value) => setField(6, value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WAVG">WAVG</SelectItem>
                                <SelectItem value="LATEST">Mới nhất</SelectItem>
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Trạng thái chọn giá</span>
                        <Select
                            value={row[12] === "LOCK" ? "LOCK" : "AUTO"}
                            onValueChange={(value) => {
                                setField(12, value)
                                if (value !== "LOCK") setField(11, "-")
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AUTO">AUTO</SelectItem>
                                <SelectItem value="LOCK">LOCK</SelectItem>
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="space-y-1.5 text-sm md:col-span-2">
                        <span className="font-medium">Giá tự nhập/chốt</span>
                        <Input
                            value={inputValue(row[11])}
                            disabled={!isLocked}
                            placeholder={isLocked ? "Nhập giá chốt" : "Chỉ nhập khi trạng thái là LOCK"}
                            onChange={(event) => setField(11, normalizeInput(event.target.value))}
                        />
                    </label>
                    {textFields.map((field) => (
                        <label key={field.index} className="space-y-1.5 text-sm">
                            <span className="font-medium">{field.label}</span>
                            <Input
                                value={inputValue(row[field.index])}
                                onChange={(event) => setField(field.index, normalizeInput(event.target.value))}
                            />
                        </label>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={onSave}>Lưu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PriceCell({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="min-h-[132px] border-b border-r border-[#d8d5c9] px-4 py-3 last:border-r-0 xl:border-b-0">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="space-y-1.5 text-sm">{children}</div>
        </div>
    )
}

function InfoRow({
    label,
    value,
    strong,
    tone,
}: {
    label: string
    value: string
    strong?: boolean
    tone?: "default" | "primary" | "success" | "warning"
}) {
    const toneClass =
        tone === "primary"
            ? "text-sky-700"
            : tone === "success"
                ? "text-emerald-700"
                : tone === "warning"
                    ? "text-amber-700"
                    : "text-slate-900"

    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-slate-600">{label}</span>
            <span className={`text-right tabular-nums ${strong ? "font-bold" : "font-semibold"} ${toneClass}`}>
                {value || "-"}
            </span>
        </div>
    )
}

function DataTable({
    headers,
    rows,
    onEditRow,
    onDeleteRow,
}: {
    headers: string[]
    rows: string[][]
    onEditRow?: (row: string[]) => void
    onDeleteRow?: (row: string[]) => void
}) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {headers.map((header) => (
                            <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.join("|")}>
                            {row.map((cell, index) => (
                                <TableCell key={`${cell}-${index}`} className={index === 0 ? "whitespace-nowrap font-mono text-xs font-semibold text-primary" : "whitespace-nowrap"}>
                                    {cell === "__ACTIONS__" ? (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label="Sửa"
                                                onClick={() => onEditRow?.(row)}
                                            >
                                                <Edit className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive"
                                                aria-label="Xóa"
                                                onClick={() => onDeleteRow?.(row)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ) : renderCell(cell)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function renderCell(value: string) {
    if (["Ổn định", "Đang dùng", "ACTIVE", "Còn hàng", "Hàng mới", "AUTO"].includes(value)) {
        return <Badge variant="secondary">{value}</Badge>
    }
    if (["Cần xem lại", "Theo dõi", "Hết hàng", "Tăng >5%", "Tăng nhẹ", "Chưa có lô"].includes(value)) {
        return <Badge variant="outline">{value}</Badge>
    }
    if (value === "LOCK") {
        return <Badge>LOCK</Badge>
    }
    return value
}
