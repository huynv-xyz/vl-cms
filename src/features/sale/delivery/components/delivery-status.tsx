export type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"

export const DELIVERY_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "DELIVERING", label: "Đang giao" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
] as const

export const deliveryStatusMeta: Record<
    string,
    { label: string; variant: BadgeVariant }
> = {
    NEW: {
        label: "Mới",
        variant: "secondary",
    },

    DELIVERING: {
        label: "Đang giao",
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

export const getNextDeliveryStatuses = (current?: string): string[] => {
    switch (current) {
        case "NEW":
            return ["DELIVERING", "CANCELLED"]

        case "DELIVERING":
            return ["DONE", "CANCELLED"]

        default:
            return []
    }
}