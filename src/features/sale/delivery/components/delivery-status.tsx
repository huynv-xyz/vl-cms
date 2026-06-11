import { CheckCircle2, FileText, Truck, XCircle, type LucideIcon } from "lucide-react"

export type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"

export type DeliveryStatusMeta = {
    label: string
    variant: BadgeVariant
    icon: LucideIcon
    tone: string
    badgeClass: string
    dotClass: string
}

export const DELIVERY_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "DELIVERING", label: "Đang giao" },
    { value: "DONE", label: "Đã giao" },
    { value: "CANCELLED", label: "Hủy" },
] as const

export const deliveryStatusMeta: Record<string, DeliveryStatusMeta> = {
    NEW: {
        label: "Mới",
        variant: "secondary",
        icon: FileText,
        tone: "text-slate-600 dark:text-slate-300",
        badgeClass:
            "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
        dotClass: "bg-slate-400",
    },
    DELIVERING: {
        label: "Đang giao",
        variant: "default",
        icon: Truck,
        tone: "text-blue-600 dark:text-blue-400",
        badgeClass:
            "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
        dotClass: "bg-blue-500",
    },
    DONE: {
        label: "Đã giao",
        variant: "outline",
        icon: CheckCircle2,
        tone: "text-emerald-600 dark:text-emerald-400",
        badgeClass:
            "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
        dotClass: "bg-emerald-500",
    },
    CANCELLED: {
        label: "Hủy",
        variant: "destructive",
        icon: XCircle,
        tone: "text-rose-600 dark:text-rose-400",
        badgeClass:
            "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
        dotClass: "bg-rose-500",
    },
}

export const getNextDeliveryStatuses = (current?: string): string[] => {
    switch (current) {
        case "NEW":
            return ["DELIVERING", "CANCELLED"]

        case "DELIVERING":
            return ["NEW", "DONE", "CANCELLED"]

        case "CANCELLED":
            return ["NEW", "DELIVERING"]

        default:
            return []
    }
}

export function getDeliveryStatusMeta(status?: string): DeliveryStatusMeta {
    return (
        deliveryStatusMeta[String(status ?? "").toUpperCase()] ?? {
            label: status || "-",
            variant: "outline" as BadgeVariant,
            icon: FileText,
            tone: "text-muted-foreground",
            badgeClass: "border-border bg-muted text-muted-foreground",
            dotClass: "bg-muted-foreground/40",
        }
    )
}
