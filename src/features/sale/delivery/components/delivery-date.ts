export function formatDeliveryDate(value?: string | number[] | null, emptyValue = "-") {
    const parts = parseDateParts(value)
    if (!parts) return emptyValue
    return `${parts.day}/${parts.month}/${parts.year}`
}

export function toDeliveryDateInputValue(value?: string | number[] | null) {
    const parts = parseDateParts(value)
    if (!parts) return ""
    return `${parts.year}-${parts.month}-${parts.day}`
}

export function todayDeliveryDateInputValue() {
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function parseDateParts(value?: string | number[] | null) {
    if (!value) return null

    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return null
        return {
            year: String(year).padStart(4, "0"),
            month: String(month).padStart(2, "0"),
            day: String(day).padStart(2, "0"),
        }
    }

    const text = String(value).trim()
    const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymd) {
        return { year: ymd[1], month: ymd[2], day: ymd[3] }
    }

    const dmy = text.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
    if (dmy) {
        return { year: dmy[3], month: dmy[2], day: dmy[1] }
    }

    return null
}
