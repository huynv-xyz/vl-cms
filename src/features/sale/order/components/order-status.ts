import { CheckCircle2, CircleDashed, FileText, XCircle, type LucideIcon } from "lucide-react"

export type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"

export type OrderStatusMeta = {
    label: string
    variant: BadgeVariant
    icon: LucideIcon
    /** Tailwind class for icon and dot tone */
    tone: string
    /** Background + border for badge */
    badgeClass: string
}

export const ORDER_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
] as const

export const orderStatusMeta: Record<string, OrderStatusMeta> = {
    NEW: {
        label: "Mới",
        variant: "secondary",
        icon: FileText,
        tone: "text-slate-600 dark:text-slate-300",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
    },
    CONFIRMED: {
        label: "Đã xác nhận",
        variant: "default",
        icon: CircleDashed,
        tone: "text-blue-600 dark:text-blue-400",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    },
    DONE: {
        label: "Hoàn thành",
        variant: "outline",
        icon: CheckCircle2,
        tone: "text-emerald-600 dark:text-emerald-400",
        badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    CANCELLED: {
        label: "Hủy",
        variant: "destructive",
        icon: XCircle,
        tone: "text-rose-600 dark:text-rose-400",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
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

export function getOrderStatusMeta(status?: string): OrderStatusMeta {
    return orderStatusMeta[String(status ?? "").toUpperCase()] ?? {
        label: status || "-",
        variant: "outline" as BadgeVariant,
        icon: FileText,
        tone: "text-muted-foreground",
        badgeClass: "border-border bg-muted text-muted-foreground",
    }
}
