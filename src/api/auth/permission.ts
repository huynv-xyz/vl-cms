import { apiGet } from "@/api/client"

export type Permission = {
    module: string
    action: string
    name?: string
}

export function getMyPermissions() {
    return apiGet<Permission[]>("/auth/me/permissions")
}