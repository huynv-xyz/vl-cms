export const RETURN_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
] as const

export const returnStatusLabel = (status?: string) =>
    RETURN_STATUSES.find((item) => item.value === status)?.label ?? status ?? "-"
