export type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"


export const ORDER_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
] as const

export const orderStatusMeta: Record<
    string,
    { label: string; variant: BadgeVariant }
> = {
    NEW: {
        label: "Mới",
        variant: "secondary",
    },

    CONFIRMED: {
        label: "Đã xác nhận",
        variant: "default",
    },

    DONE: {
        label: "Hoàn thành",
        variant: "outline",
    },

    CANCELLED: {
        label: "Hủy",
        variant: "destructive",
    },
}

export const getNextStatuses = (current?: string): string[] => {
    switch (current) {
        case "NEW":
            return ["CONFIRMED", "CANCELLED"]

        case "CONFIRMED":
            return ["DONE", "CANCELLED"]

        default:
            return []
    }
}

export function getOrderStatusMeta(status?: string) {
    return orderStatusMeta[String(status ?? "").toUpperCase()] ?? {
        label: status || "-",
        variant: "outline" as BadgeVariant,
    }
}
