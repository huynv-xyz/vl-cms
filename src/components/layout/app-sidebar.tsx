import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLayout } from "@/context/layout-provider"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarData } from "./data/sidebar-data"
import { NavGroup } from "./nav-group"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import { getMyPermissions } from "@/api/auth/permission"

type Permission = {
    module: string
    action: string
}

function urlToModule(url: any) {
    const module = url.replace(/^\/+/, "").replace(/\//g, ".")
    if (module === "pricing" || module.startsWith("pricing.")) {
        return "pricing"
    }
    return module
}

function filterSidebar(data: typeof sidebarData, permissions: Permission[]) {
    const permissionSet = new Set(
        permissions.map((p) => `${p.module}.${p.action}`)
    )

    return {
        ...data,
        navGroups: data.navGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    const module = urlToModule(item.url)
                    return permissionSet.has(`${module}.view`)
                }),
            }))
            .filter((group) => group.items.length > 0),
    }
}

export function AppSidebar() {
    const { collapsible, variant } = useLayout()

    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })

    const dynamicSidebarData = useMemo(() => {
        return filterSidebar(sidebarData, permissions)
    }, [permissions])

    return (
        <Sidebar collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                <TeamSwitcher teams={dynamicSidebarData.teams} />
            </SidebarHeader>

            <SidebarContent>
                {dynamicSidebarData.navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
