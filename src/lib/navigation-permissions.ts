import type { Permission } from "@/api/auth/permission"
import type { NavItem, SidebarData } from "@/components/layout/types"
import { sidebarData } from "@/components/layout/data/sidebar-data"

function normalizePath(path: string) {
    if (!path || path === "/") return "/"
    const [pathname] = path.split("?")
    return pathname.replace(/\/+$/, "")
}

export function urlToPermissionModule(url: string) {
    return normalizePath(url).replace(/^\/+/, "").replace(/\//g, ".")
}

function permissionSet(permissions: Permission[]) {
    return new Set(permissions.map((permission) => `${permission.module}.${permission.action}`))
}

export function hasViewPermissionForUrl(url: string, permissions: Permission[]) {
    const module = urlToPermissionModule(url)
    if (!module) return true
    return permissionSet(permissions).has(`${module}.view`)
}

function filterItems(items: NavItem[], permissions: Permission[]): NavItem[] {
    return items.reduce<NavItem[]>((filtered, item) => {
        if ("url" in item && item.url) {
            if (hasViewPermissionForUrl(String(item.url), permissions)) filtered.push(item)
            return filtered
        }

        if ("items" in item && item.items) {
            const children = item.items.filter((child) =>
                hasViewPermissionForUrl(String(child.url), permissions)
            )
            if (children.length) filtered.push({ ...item, items: children })
            return filtered
        }

        return filtered
    }, [])
}

export function filterSidebarByPermissions(data: SidebarData, permissions: Permission[]): SidebarData {
    return {
        ...data,
        navGroups: data.navGroups
            .map((group) => ({
                ...group,
                items: filterItems(group.items, permissions),
            }))
            .filter((group) => group.items.length > 0),
    }
}

function collectUrls(data: SidebarData) {
    const urls: string[] = []

    for (const group of data.navGroups) {
        for (const item of group.items) {
            if ("url" in item && item.url) {
                urls.push(normalizePath(String(item.url)))
                continue
            }

            if ("items" in item && item.items) {
                for (const child of item.items) {
                    urls.push(normalizePath(String(child.url)))
                }
            }
        }
    }

    return urls
}

export function getRequiredViewModuleForPath(path: string, data: SidebarData = sidebarData) {
    const pathname = normalizePath(path)
    if (pathname === "/") return null

    const matchedUrl = collectUrls(data)
        .filter((url) => pathname === url || pathname.startsWith(`${url}/`))
        .sort((a, b) => b.length - a.length)[0]

    return matchedUrl ? urlToPermissionModule(matchedUrl) : urlToPermissionModule(pathname)
}

export function hasViewPermissionForPath(path: string, permissions: Permission[], data: SidebarData = sidebarData) {
    const module = getRequiredViewModuleForPath(path, data)
    if (!module) return true
    return permissionSet(permissions).has(`${module}.view`)
}
