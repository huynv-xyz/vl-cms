export const PRODUCT_NATURE_OPTIONS = [
    { value: "THANH_PHAM", label: "Th\u00e0nh ph\u1ea9m" },
    { value: "NGUYEN_VAT_LIEU", label: "Nguy\u00ean v\u1eadt li\u1ec7u" },
    { value: "BAO_BI", label: "Bao b\u00ec" },
    { value: "CONG_CU_DUNG_CU", label: "C\u00f4ng c\u1ee5 d\u1ee5ng c\u1ee5" },
    { value: "HANG_HOA", label: "H\u00e0ng h\u00f3a" },
] as const

export function formatProductNature(value?: string | null) {
    if (!value) return "-"
    return PRODUCT_NATURE_OPTIONS.find((item) => item.value === value)?.label || value
}

export function toProductNatureValue(value?: string | null) {
    if (!value) return undefined
    return PRODUCT_NATURE_OPTIONS.find((item) => item.value === value || item.label === value)?.value || value
}
