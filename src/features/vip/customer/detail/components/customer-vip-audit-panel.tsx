import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type { CustomerVipAudit, CustomerVipAuditLine } from "../../data/schema"
import type React from "react"
import { useMemo, useState } from "react"

type Props = {
    data: CustomerVipAudit
}

const ALL_VALUE = "__ALL__"
const EMPTY_VALUE = "__EMPTY__"

export function CustomerVipAuditPanel({ data }: Props) {
    const lines = data.lines ?? []
    const groups = data.common_groups ?? []
    const thresholds = data.tier_thresholds ?? []
    const [vthhFilter, setVthhFilter] = useState(ALL_VALUE)
    const [calcTypeFilter, setCalcTypeFilter] = useState(ALL_VALUE)
    const vthhOptions = useMemo(() => buildOptions(lines, (line) => line.vthh_con), [lines])
    const calcTypeOptions = useMemo(() => buildOptions(lines, (line) => line.calc_type, labelCalcType), [lines])
    const filteredLines = useMemo(
        () => lines.filter((line) =>
            optionMatches(line.vthh_con, vthhFilter)
            && optionMatches(line.calc_type, calcTypeFilter)
        ),
        [lines, vthhFilter, calcTypeFilter]
    )
    const isMatched =
        Math.abs(Number(data.diff_total_vip_point ?? 0)) < 0.01
        && String(data.result_tier_name ?? "") === String(data.audit_tier_name ?? "")

    return (
        <div id="vip-audit" className="space-y-4">
            <div className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-base font-semibold">Audit điểm VIP</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {data.customer_code} · {data.from_date || data.to_date
                                ? formatDateRange(data.from_date, data.to_date)
                                : data.as_of_date
                                    ? `Đến ${formatDisplayDate(data.as_of_date)}`
                                    : data.calc_range} · {data.group_code}
                        </div>
                    </div>
                    <Badge variant={isMatched ? "default" : "destructive"}>
                        {isMatched ? "Khớp kết quả" : "Có lệch cần kiểm tra"}
                    </Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <AuditMetric
                        label="Điểm đang hiển thị"
                        value={formatNumber(data.result_total_vip_point)}
                    />
                    <AuditMetric
                        label="Điểm audit tính lại"
                        value={formatNumber(data.audit_total_vip_point)}
                    />
                    <AuditMetric
                        label="Chênh lệch"
                        value={formatNumber(data.diff_total_vip_point)}
                        tone={Math.abs(Number(data.diff_total_vip_point ?? 0)) > 0.01 ? "bad" : "ok"}
                    />
                    <AuditMetric
                        label="Cấp bậc"
                        value={data.audit_tier_name || "Chưa đủ điểm"}
                        sub={`List: ${data.result_tier_name || "—"}`}
                    />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <AuditMetric label="Dòng giao dịch" value={formatNumber(data.summary.total_lines ?? 0)} />
                    <AuditMetric label="Dòng được tính" value={formatNumber(data.summary.eligible_lines ?? 0)} tone="ok" />
                    <AuditMetric label="Dòng bị loại" value={formatNumber(data.summary.excluded_lines ?? 0)} tone="warn" />
                    <AuditMetric label="Điểm mã riêng" value={formatNumber(data.summary.ma_rieng_point ?? 0)} />
                </div>
            </div>

            {thresholds.length > 0 && (
                <AuditSection title="Ngưỡng cấp bậc">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cấp bậc</TableHead>
                                <TableHead>Nhóm áp dụng</TableHead>
                                <TableHead className="text-right">Điểm yêu cầu</TableHead>
                                <TableHead className="text-right">Thưởng / điểm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {thresholds.map((tier, index) => (
                                <TableRow key={`${tier.tier_name}-${index}`}>
                                    <TableCell className="font-medium">{tier.tier_name || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tier.group_label || tier.group_code || "—"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatNumber(tier.required_point ?? 0)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(tier.reward ?? 0))}</TableCell>
                                    <TableCell>
                                        <Badge variant={tier.matched ? "default" : "outline"}>
                                            {tier.matched ? "Đạt" : "Chưa đạt"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </AuditSection>
            )}

            {groups.length > 0 && (
                <AuditSection title="Gom nhóm VTHH">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>VTHH</TableHead>
                                    <TableHead>Nhóm</TableHead>
                                    <TableHead className="text-right">SL HDN</TableHead>
                                    <TableHead className="text-right">Rule</TableHead>
                                    <TableHead className="text-right">Khoảng</TableHead>
                                    <TableHead className="text-right">Hệ số</TableHead>
                                    <TableHead className="text-right">Điểm</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map((group, index) => (
                                    <TableRow key={`${group.vthh_con}-${index}`}>
                                        <TableCell className="font-mono">{group.vthh_con || "—"}</TableCell>
                                        <TableCell>{group.group_name || "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">{formatNumber(group.sl_hdn_total ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{group.rule_id ?? "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatNumber(group.from_value ?? 0)} - {formatNumber(group.to_value ?? 0)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{formatNumber(group.factor ?? 0)}</TableCell>
                                        <TableCell className="text-right tabular-nums font-semibold">{formatNumber(group.point ?? 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={6} className="font-semibold">Tổng điểm</TableCell>
                                    <TableCell className="text-right tabular-nums font-bold">{formatNumber(sumPoints(groups))}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </AuditSection>
            )}

            <AuditSection title="Dòng giao dịch">
                <div className="mb-2 flex flex-wrap items-end gap-2 px-2 pt-2">
                    <AuditFilterSelect
                        label="VTHH"
                        value={vthhFilter}
                        options={vthhOptions}
                        onChange={setVthhFilter}
                    />
                    <AuditFilterSelect
                        label="Loại tính"
                        value={calcTypeFilter}
                        options={calcTypeOptions}
                        onChange={setCalcTypeFilter}
                    />
                    {(vthhFilter !== ALL_VALUE || calcTypeFilter !== ALL_VALUE) && (
                        <button
                            type="button"
                            className="h-9 rounded-md border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => {
                                setVthhFilter(ALL_VALUE)
                                setCalcTypeFilter(ALL_VALUE)
                            }}
                        >
                            Xóa lọc
                        </button>
                    )}
                    <div className="ml-auto text-xs text-muted-foreground">
                        {formatNumber(filteredLines.length)} / {formatNumber(lines.length)} dòng
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Chứng từ</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>VTHH</TableHead>
                                <TableHead>Mã riêng</TableHead>
                                <TableHead>Loại tính</TableHead>
                                <TableHead className="text-right">SL HDN</TableHead>
                                <TableHead className="text-right">Hệ số</TableHead>
                                <TableHead className="text-right">Điểm</TableHead>
                                <TableHead>Lý do</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLines.map((line) => (
                                <AuditLineRow key={line.id} line={line} />
                            ))}
                            {!filteredLines.length && (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                                        Không có dòng giao dịch phù hợp
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {filteredLines.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={5} className="font-semibold">Tổng</TableCell>
                                    <TableCell className="text-right tabular-nums font-bold">{formatNumber(sumSlHdn(filteredLines))}</TableCell>
                                    <TableCell />
                                    <TableCell className="text-right tabular-nums font-bold">{formatNumber(sumPoints(filteredLines))}</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            </AuditSection>
        </div>
    )
}

function AuditFilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string) => void
}) {
    return (
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 min-w-[160px] rounded-md border bg-background px-3 text-sm font-medium text-foreground shadow-sm outline-none transition-colors focus:border-primary"
            >
                <option value={ALL_VALUE}>Tất cả</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}

function AuditLineRow({ line }: { line: CustomerVipAuditLine }) {
    return (
        <TableRow className={!line.eligible ? "bg-muted/30 text-muted-foreground" : undefined}>
            <TableCell>
                <div className="font-mono text-xs font-semibold">{line.document_no || "—"}</div>
                <div className="text-xs text-muted-foreground">{formatDisplayDate(line.document_date)}</div>
            </TableCell>
            <TableCell className="min-w-[220px]">
                <div className="font-mono text-xs">{line.product_code || "—"}</div>
                <div className="max-w-[260px] truncate text-xs text-muted-foreground">{line.product_name || "—"}</div>
            </TableCell>
            <TableCell className="font-mono text-xs">{line.vthh_con || "—"}</TableCell>
            <TableCell className="font-mono text-xs">{line.private_code || "—"}</TableCell>
            <TableCell>
                <Badge variant={line.eligible ? "default" : "outline"}>
                    {labelCalcType(line.calc_type)}
                </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(line.sl_hdn ?? 0)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(line.factor ?? 0)}</TableCell>
            <TableCell className="text-right tabular-nums font-semibold">{formatNumber(line.point ?? 0)}</TableCell>
            <TableCell className="min-w-[180px] text-xs">{line.reason || line.rule_code || "—"}</TableCell>
        </TableRow>
    )
}

function sumPoints(rows: Array<{ point?: number | null }>) {
    return rows.reduce((sum, row) => sum + Number(row.point ?? 0), 0)
}

function sumSlHdn(rows: Array<{ sl_hdn?: number | null }>) {
    return rows.reduce((sum, row) => sum + Number(row.sl_hdn ?? 0), 0)
}

function buildOptions(
    lines: CustomerVipAuditLine[],
    getValue: (line: CustomerVipAuditLine) => string | null | undefined,
    getLabel?: (value?: string | null) => string
) {
    const seen = new Map<string, string>()
    for (const line of lines) {
        const raw = getValue(line)
        const value = optionValue(raw)
        if (!seen.has(value)) {
            seen.set(value, getLabel ? getLabel(raw) : optionLabel(raw))
        }
    }

    return Array.from(seen.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "vi"))
}

function optionMatches(raw: string | null | undefined, filter: string) {
    return filter === ALL_VALUE || optionValue(raw) === filter
}

function optionValue(raw: string | null | undefined) {
    const value = String(raw ?? "").trim()
    return value || EMPTY_VALUE
}

function optionLabel(raw: string | null | undefined) {
    const value = String(raw ?? "").trim()
    return value || "Rỗng"
}

function AuditMetric({
    label,
    value,
    sub,
    tone,
}: {
    label: string
    value: string
    sub?: string
    tone?: "ok" | "warn" | "bad"
}) {
    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                tone === "ok" && "text-emerald-600",
                tone === "warn" && "text-amber-600",
                tone === "bad" && "text-destructive",
            )}>
                {value}
            </div>
            {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
        </div>
    )
}

function AuditSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-background">
            <div className="border-b px-4 py-3 text-sm font-semibold">{title}</div>
            <div className="p-2">{children}</div>
        </div>
    )
}

function labelCalcType(value?: string | null) {
    if (value === "MA_RIENG") return "Mã riêng"
    if (value === "MA_VTHH") return "Mã VTHH"
    if (value === "COMMON_GROUP") return "Nhóm chung"
    if (value === "EXCLUDED") return "Loại"
    if (value === "NO_RULE") return "Không rule"
    return value || "—"
}

function formatDisplayDate(value?: string | null) {
    if (!value) return ""
    const [datePart] = value.split("T")
    const [year, month, day] = datePart.split("-")
    return year && month && day ? `${day}/${month}/${year}` : value
}

function formatDateRange(fromDate?: string | null, toDate?: string | null) {
    if (fromDate && toDate) return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
    if (fromDate) return `Từ ${formatDisplayDate(fromDate)}`
    if (toDate) return `Đến ${formatDisplayDate(toDate)}`
    return ""
}
