export type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"


export const ORDER_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "REJECTED", label: "Từ chối" },
    { value: "COMPLETED", label: "Hoàn thành" },
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

    APPROVED: {
        label: "Đã duyệt",
        variant: "default",
    },

    REJECTED: {
        label: "Từ chối",
        variant: "destructive",
    },

    COMPLETED: {
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
            return ["APPROVED", "CANCELLED"]

        case "APPROVED":
            return ["COMPLETED", "REJECTED"]

        default:
            return []
    }
}