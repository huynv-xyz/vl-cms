import type { VipPointGroup } from "@/features/vip/point-rule/data/schema"
import type { VipProductMappingFormValues } from "./types"

const EPSILON = 0.0000001

export function validateProductMappingGroupFactor(
    values: VipProductMappingFormValues,
    groups: VipPointGroup[],
) {
    const group = findSelectedGroup(values.group_code, groups)
    if (!group) return null

    if (!sameUnit(values.unit, group.unit)) {
        return `Không thể chọn mã chung ${group.group_code}: ĐVT ${values.unit || "-"} chưa khớp ĐVT nhóm (${group.unit || "-"}). Vui lòng đổi ĐVT cho bằng nhau rồi lưu.`
    }

    const factor = Number(values.he_so_hdn || 0)
    const region = String(values.ap_dung || "").trim().toUpperCase()
    const groupMb = Number(group.he_so_mb || 0)
    const groupMn = Number(group.he_so_mn || 0)

    if (region === "MB" && sameNumber(factor, groupMb)) return null
    if (region === "MN" && sameNumber(factor, groupMn)) return null
    if (!region && sameNumber(factor, groupMb) && sameNumber(factor, groupMn)) return null

    const expected = region === "MB"
        ? `MB = ${formatNumber(groupMb)}`
        : region === "MN"
            ? `MN = ${formatNumber(groupMn)}`
            : `MB = ${formatNumber(groupMb)}, MN = ${formatNumber(groupMn)}`
    return `Không thể chọn mã chung ${group.group_code}: Hệ số HDN ${formatNumber(factor)} chưa khớp hệ số nhóm (${expected}). Vui lòng đổi hệ số cho bằng nhau rồi chọn nhóm.`
}

function findSelectedGroup(groupCode: string | undefined, groups: VipPointGroup[]) {
    const code = String(groupCode || "").trim().toUpperCase()
    if (!code) return null
    return groups.find((group) => String(group.group_code || "").trim().toUpperCase() === code) ?? null
}

function sameNumber(a: number, b: number) {
    return Math.abs(a - b) < EPSILON
}

function sameUnit(a: string | undefined, b: string | undefined) {
    return canonicalUnit(a) === canonicalUnit(b)
}

function canonicalUnit(unit: string | undefined) {
    const normalized = String(unit || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "")

    if (["KG", "KGS", "KILOGRAM", "KILOGRAMS"].includes(normalized)) return "KG"
    if (["TAN", "T", "TON", "TONS", "MT"].includes(normalized)) return "TON"
    if (["LIT", "L", "LITER", "LITRE", "LITERS", "LITRES"].includes(normalized)) return "LIT"
    return normalized
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 6,
    }).format(value)
}
