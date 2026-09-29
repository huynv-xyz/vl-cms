import assert from "node:assert/strict"
import { test } from "node:test"
import {
    getDocumentPreVatPrice,
    getInclusiveUnitPrice,
    getLineTotalWithVat,
    toPreVatInputPrice,
    calculateOrderAmounts,
    getPriceBasis,
} from "../src/features/sale/order/data/order-money.ts"

test("inclusive input converts to stored price at each VAT rate", () => {
    for (const [code, input] of [["VAT5", 10500], ["VAT8", 10800], ["VAT10", 11000]]) {
        assert.equal(toPreVatInputPrice(input, code), 10000)
        assert.equal(getInclusiveUnitPrice({ unit_price: 10000, vat_code: code }), input)
    }
    assert.equal(toPreVatInputPrice(11900, "VAT5"), 11333.333)
    assert.equal(toPreVatInputPrice(11900, undefined), 11900)
    assert.equal(toPreVatInputPrice(11900, "KCT"), 11900)
})

test("VAT selection converts from the same input without repeated rounding", () => {
    const input = 11900
    assert.equal(toPreVatInputPrice(input, "VAT8"), 11018.519)
    assert.equal(toPreVatInputPrice(input, "VAT10"), 10818.182)
    assert.equal(toPreVatInputPrice(input, undefined), input)
    assert.equal(toPreVatInputPrice(input, "VAT5"), 11333.333)
})

test("document uses VAT-inclusive API total, not pre-VAT line_total", () => {
    const item = { quantity: 10, unit_price: 10000, vat_code: "VAT8", line_total: 100000, vat_amount: 8000, line_total_with_vat: 108000 }
    assert.equal(getDocumentPreVatPrice(item), 10000)
    assert.equal(getInclusiveUnitPrice(item), 10800)
    assert.equal(getLineTotalWithVat(item), 108000)
    assert.equal(getLineTotalWithVat({ ...item, line_total_with_vat: 0 }), 0)
})

test("fallback amount deducts discount before VAT and rounds VAT", () => {
    assert.equal(getLineTotalWithVat({ quantity: 10, unit_price: 100, discount: 100, vat_code: "VAT8" }), 972)
    assert.equal(getLineTotalWithVat({ quantity: 1, unit_price: 10, vat_code: "VAT5" }), 11)
    assert.equal(getLineTotalWithVat({ line_total: 900, vat_amount: 72 }), 972)
})

test("legacy does not infer a 5 percent rate and explicit KCT stays zero", () => {
    const legacy = { quantity: 10, unit_price: 11900, vat_code: null, vat_amount: null }
    assert.equal(getDocumentPreVatPrice(legacy), null)
    assert.equal(getInclusiveUnitPrice(legacy), 11900)
    assert.equal(getLineTotalWithVat(legacy), 119000)
    const kct = { ...legacy, vat_code: "KCT", vat_amount: 0 }
    assert.equal(getDocumentPreVatPrice(kct), 11900)
    assert.equal(getInclusiveUnitPrice(kct), 11900)
    assert.equal(getLineTotalWithVat(kct), 119000)
})

test("promotion has no price or amount even if stale data has a price", () => {
    const promotion = { quantity: 10, unit_price: 11900, vat_code: "VAT8", line_type: "PROMOTION", line_total_with_vat: 119000 }
    assert.equal(getDocumentPreVatPrice(promotion), 0)
    assert.equal(getInclusiveUnitPrice(promotion), 0)
    assert.equal(getLineTotalWithVat(promotion), 0)
})

test("original inclusive input survives reload and does not multiply rounded derived price", () => {
    const item = { price_basis: "VAT_INCLUSIVE", quantity: 500003, unit_price: 11333.333, unit_price_including_vat: 11900, vat_code: "VAT5" }
    assert.deepEqual(calculateOrderAmounts(item), { beforeVat: 5666700667, vat: 283335033, total: 5950035700 })
    assert.equal(getInclusiveUnitPrice(JSON.parse(JSON.stringify(item))), 11900)
    assert.equal(getLineTotalWithVat(item), 5950035700)
    assert.equal(toPreVatInputPrice(11900, "VAT5", 500003), 11333.333)
    assert.notEqual(Math.round(item.quantity * item.unit_price), calculateOrderAmounts(item).beforeVat)
})

test("inclusive and exclusive stages have different authorities, with no stale inclusive override", () => {
    const item = { quantity: 500003, unit_price: 11333.333, unit_price_including_vat: 11900, vat_code: "VAT5" }
    const inclusive = calculateOrderAmounts({ ...item, price_basis: "VAT_INCLUSIVE" })
    const exclusive = calculateOrderAmounts({ ...item, price_basis: "VAT_EXCLUSIVE" })
    assert.equal(exclusive.beforeVat, 5666700500)
    assert.notEqual(exclusive.total, inclusive.total)
    assert.equal(getPriceBasis({ vat_code: null }), "LEGACY")
    assert.equal(getPriceBasis({ vat_code: "VAT5" }), "VAT_EXCLUSIVE")
})

test("optional VAT retains null semantics and new whole-money rounding", () => {
    for (const vat_code of [null, "KCT"]) {
        assert.deepEqual(calculateOrderAmounts({ quantity: 2.5, unit_price_including_vat: 11, price_basis: "VAT_INCLUSIVE", vat_code }),
            { beforeVat: 28, vat: 0, total: 28 })
    }
    assert.deepEqual(calculateOrderAmounts({ quantity: 2.5, unit_price: 11, price_basis: "LEGACY" }),
        { beforeVat: 27.5, vat: 0, total: 27.5 })
})

test("document leaves pre-VAT price blank when VAT is not selected in either new price basis", () => {
    for (const price_basis of ["VAT_INCLUSIVE", "VAT_EXCLUSIVE"]) {
        const item = { quantity: 1000, unit_price: 12000, unit_price_including_vat: 12000, price_basis, vat_code: null }
        assert.equal(getDocumentPreVatPrice(item), null)
        assert.equal(getInclusiveUnitPrice(item), 12000)
        assert.equal(getLineTotalWithVat(item), 12000000)
        assert.equal(getDocumentPreVatPrice({ ...item, vat_code: "KCT" }), 12000)
    }
})

test("inclusive discount is pre-VAT and promotions remain zero", () => {
    assert.deepEqual(calculateOrderAmounts({ quantity: 10, unit_price_including_vat: 108, discount: 100, vat_code: "VAT8", price_basis: "VAT_INCLUSIVE" }),
        { beforeVat: 900, vat: 72, total: 972 })
    assert.deepEqual(calculateOrderAmounts({ quantity: 10, discount: 9999, vat_code: "VAT5", price_basis: "VAT_INCLUSIVE", line_type: "PROMOTION" }),
        { beforeVat: 0, vat: 0, total: 0 })
    assert.throws(() => calculateOrderAmounts({ quantity: 10, price_basis: "VAT_INCLUSIVE" }), /Thiếu/)
})

test("decimal rounding at half dong matches backend HALF_UP", () => {
    assert.equal(calculateOrderAmounts({ quantity: 3, unit_price_including_vat: 0.15, price_basis: "VAT_INCLUSIVE", vat_code: "VAT5" }).total, 0)
    assert.equal(calculateOrderAmounts({ quantity: 10, unit_price_including_vat: 0.15, price_basis: "VAT_INCLUSIVE", vat_code: "VAT5" }).total, 2)
    assert.equal(toPreVatInputPrice(11900, "VAT5", 1), 11333)
})
