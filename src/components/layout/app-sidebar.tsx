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
import { filterSidebarByPermissions } from "@/lib/navigation-permissions"

export function AppSidebar() {
    const { collapsible, variant } = useLayout()

    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })

    const dynamicSidebarData = useMemo(() => {
        return filterSidebarByPermissions(sidebarData, permissions)
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
