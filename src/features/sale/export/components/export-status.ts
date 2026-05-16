export const EXPORT_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "DONE", label: "Hoàn thành" },
] as const

export const exportStatusLabel = (status?: string) =>
    EXPORT_STATUSES.find((item) => item.value === status)?.label ?? status ?? "-"
