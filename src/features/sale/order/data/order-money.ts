import Decimal from "decimal.js-light"

export type PriceBasis = "LEGACY" | "VAT_INCLUSIVE" | "VAT_EXCLUSIVE"

type MoneyLine = {
    quantity?: number | null
    unit_price?: number | null
    discount?: number | null
    vat_code?: string | null
    vat_rate?: number | null
    vat_amount?: number | null
    line_total?: number | null
    line_total_with_vat?: number | null
    line_type?: string | null
    price_basis?: PriceBasis | null
    unit_price_including_vat?: number | null
}

const D = Decimal.clone({ precision: 36, rounding: Decimal.ROUND_HALF_UP })

export function getPriceBasis(item: MoneyLine): PriceBasis {
    return item.price_basis ?? (item.vat_code ? "VAT_EXCLUSIVE" : "LEGACY")
}

export function calculateOrderAmounts(item: MoneyLine) {
    const basis = getPriceBasis(item)
    const quantity = new D(item.quantity || 0)
    const discount = new D(item.line_type === "PROMOTION" ? 0 : item.discount || 0)
    const factor = new D(1).plus(new D(orderVatRate(item.vat_code)).div(100))
    const price = item.line_type === "PROMOTION" ? 0 : item.unit_price || 0
    const positive = (value: Decimal) => value.isNegative() ? new D(0) : value
    if (basis === "VAT_INCLUSIVE") {
        if (item.unit_price_including_vat == null && item.line_type !== "PROMOTION") {
            throw new Error("Thiếu đơn giá gồm VAT gốc")
        }
        const gross = quantity.times(item.line_type === "PROMOTION" ? 0 : item.unit_price_including_vat || 0)
        const total = positive(gross.minus(discount.times(factor))).toDecimalPlaces(0)
        const net = total.div(factor).toDecimalPlaces(0)
        return { beforeVat: net.toNumber(), vat: item.vat_code ? total.minus(net).toNumber() : 0, total: total.toNumber() }
    }
    let net = positive(quantity.times(price).minus(discount))
    if (basis !== "LEGACY") net = net.toDecimalPlaces(0)
    const vat = basis === "LEGACY" || !item.vat_code ? new D(0) : net.times(orderVatRate(item.vat_code)).div(100).toDecimalPlaces(0)
    return { beforeVat: net.toNumber(), vat: vat.toNumber(), total: net.plus(vat).toNumber() }
}

export function orderVatRate(code?: string | null) {
    if (code === "VAT5") return 5
    if (code === "VAT8") return 8
    if (code === "VAT10") return 10
    return 0
}

export function toPreVatInputPrice(inclusivePrice: number, code?: string | null, quantity?: number) {
    if (quantity && quantity > 0) {
        const total = new D(inclusivePrice).times(quantity).toDecimalPlaces(0)
        const net = total.times(100).div(100 + orderVatRate(code)).toDecimalPlaces(0)
        return net.div(quantity).toDecimalPlaces(3).toNumber()
    }
    return new D(inclusivePrice).times(100).div(100 + orderVatRate(code)).toDecimalPlaces(3).toNumber()
}

export function getInclusiveUnitPrice(item: MoneyLine) {
    if (item.line_type === "PROMOTION") return 0
    if (getPriceBasis(item) === "VAT_INCLUSIVE") return Number(item.unit_price_including_vat ?? 0)
    if (getPriceBasis(item) === "LEGACY") return Number(item.unit_price || 0)
    return new D(item.unit_price || 0).times(new D(1).plus(new D(orderVatRate(item.vat_code)).div(100))).toNumber()
}

export function getDocumentPreVatPrice(item: MoneyLine) {
    if (getPriceBasis(item) === "LEGACY" || !item.vat_code) return null
    return item.line_type === "PROMOTION" ? 0 : Number(item.unit_price || 0)
}

export function getLineTotalWithVat(item: MoneyLine) {
    if (item.line_type === "PROMOTION") return 0
    if (item.line_total_with_vat != null) return Number(item.line_total_with_vat)
    if (item.line_total == null) return calculateOrderAmounts(item).total
    const beforeVat = item.line_total != null
        ? Number(item.line_total)
        : Math.max(Number(item.quantity || 0) * Number(item.unit_price || 0) - Number(item.discount || 0), 0)
    const vat = item.vat_amount != null
        ? Number(item.vat_amount)
        : item.vat_code ? Math.round(beforeVat * orderVatRate(item.vat_code) / 100) : 0
    return beforeVat + vat
}
