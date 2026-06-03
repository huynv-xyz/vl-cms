import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Building2, ClipboardList, Hash, MapPin, Users } from "lucide-react"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Transaction } from "../data/schema"
import { transactionColumns } from "./transaction-columns"

type TransactionFilters = {
    customer_type?: string[]
    hdn_status?: string[]
    vthh_con?: string
    npp?: string
    process_month?: string
    region?: string
    document_date_from?: string
    document_date_to?: string
}

type TransactionTableProps = {
    data: Transaction[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: TransactionFilters
    onFiltersChange: (filters: TransactionFilters) => void
}

const CUSTOMER_TYPE_OPTIONS = [
    { value: "PP", label: "PP" },
    { value: "PPN.K", label: "PPN.K" },
    { value: "DAI_LY", label: "Đại lý" },
]

const HDN_STATUS_OPTIONS = [
    { value: "VALID", label: "Hợp lệ" },
    { value: "INVALID", label: "Không hợp lệ" },
    { value: "PENDING", label: "Chờ xử lý" },
]

export function TransactionTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: TransactionTableProps) {
    const setFilter = <K extends keyof TransactionFilters>(
        key: K,
        value: TransactionFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo số CT, mã KH, tên KH, mã SP..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <MultiSelectFilter
                        icon={Users}
                        label="Loại KH"
                        value={filters.customer_type}
                        onChange={(v) => setFilter("customer_type", v)}
                        options={CUSTOMER_TYPE_OPTIONS}
                        className="min-w-[160px] flex-1"
                    />

                    <MultiSelectFilter
                        icon={ClipboardList}
                        label="Tình trạng HDN"
                        value={filters.hdn_status}
                        onChange={(v) => setFilter("hdn_status", v)}
                        options={HDN_STATUS_OPTIONS}
                        className="min-w-[170px] flex-1"
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <TextFilter
                        icon={Hash}
                        value={filters.vthh_con}
                        onChange={(v) => setFilter("vthh_con", v)}
                        placeholder="VTHH con"
                        className="h-10 min-w-[140px] flex-1"
                    />

                    <TextFilter
                        icon={Building2}
                        value={filters.npp}
                        onChange={(v) => setFilter("npp", v)}
                        placeholder="NPP"
                        className="h-10 min-w-[140px] flex-1"
                    />

                    <TextFilter
                        icon={MapPin}
                        value={filters.region}
                        onChange={(v) => setFilter("region", v)}
                        placeholder="Khu vực"
                        className="h-10 min-w-[140px] flex-1"
                    />

                    <TextFilter
                        value={filters.process_month}
                        onChange={(v) => setFilter("process_month", v)}
                        placeholder="Tháng xử lý (YYYYMM)"
                        className="h-10 min-w-[170px] flex-1"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.document_date_from}
                        onChange={(v) => setFilter("document_date_from", v)}
                        placeholder="Từ ngày CT"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.document_date_to}
                        onChange={(v) => setFilter("document_date_to", v)}
                        placeholder="Đến ngày CT"
                    />
                </div>
            </div>

            <CrudTable<Transaction>
                data={data}
                columns={transactionColumns}
                entityName="giao dịch"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}

type IconComponent = React.ComponentType<{ className?: string }>

function MultiSelectFilter({
    icon: Icon,
    label,
    value,
    onChange,
    options,
    className,
}: {
    icon?: IconComponent
    label: string
    value?: string[]
    onChange: (value?: string[]) => void
    options: Array<{ value: string; label: string }>
    className?: string
}) {
    const selected = value ?? []

    const toggle = (v: string) => {
        const next = selected.includes(v)
            ? selected.filter((item) => item !== v)
            : [...selected, v]
        onChange(next.length ? next : undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={`h-10 justify-between rounded-md border-slate-300 bg-white px-3 shadow-xs ${className ?? ""}`}
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
                        <span className="truncate">
                            {selected.length ? `${label} (${selected.length})` : label}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.includes(option.value)}
                        onCheckedChange={() => toggle(option.value)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xóa bộ lọc
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function TextFilter({
    icon: Icon,
    value,
    onChange,
    placeholder,
    className,
}: {
    icon?: IconComponent
    value?: string
    onChange: (value?: string) => void
    placeholder?: string
    className?: string
}) {
    return (
        <div className={`relative ${className ?? ""}`}>
            {Icon ? (
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            ) : null}
            <Input
                defaultValue={value ?? ""}
                key={value ?? ""}
                onBlur={(e) => {
                    const next = e.target.value.trim()
                    if (next !== (value ?? "")) {
                        onChange(next || undefined)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const next = (e.target as HTMLInputElement).value.trim()
                        if (next !== (value ?? "")) {
                            onChange(next || undefined)
                        }
                            ; (e.target as HTMLInputElement).blur()
                    }
                }}
                placeholder={placeholder}
                className={`h-10 rounded-md border-slate-300 bg-white shadow-xs ${Icon ? "pl-9" : ""}`}
            />
        </div>
    )
}
