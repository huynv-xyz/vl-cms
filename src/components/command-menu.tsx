import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun } from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { useQuery } from '@tanstack/react-query'
import { getMyPermissions } from '@/api/auth/permission'
import { filterSidebarByPermissions } from '@/lib/navigation-permissions'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { sidebarData } from './layout/data/sidebar-data'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
    const navigate = useNavigate()
    const { setTheme } = useTheme()
    const { open, setOpen } = useSearch()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const navigationData = React.useMemo(
        () => filterSidebarByPermissions(sidebarData, permissions),
        [permissions]
    )

    const runCommand = React.useCallback(
        (command: () => unknown) => {
            setOpen(false)
            command()
        },
        [setOpen]
    )

    return (
        <CommandDialog modal open={open} onOpenChange={setOpen}>
            <CommandInput placeholder='Nhập lệnh hoặc tìm kiếm...' />
            <CommandList>
                <ScrollArea type='hover' className='h-72 pe-1'>
                    <CommandEmpty>Không tìm thấy kết quả nào.</CommandEmpty>
                    {navigationData.navGroups.map((group) => (
                        <CommandGroup key={group.title} heading={group.title}>
                            {group.items.map((navItem, i) => {
                                if (navItem.url)
                                    return (
                                        <CommandItem
                                            key={`${navItem.url}-${i}`}
                                            value={navItem.title}
                                            onSelect={() => {
                                                runCommand(() => navigate({ to: navItem.url }))
                                            }}
                                        >
                                            <div className='flex size-4 items-center justify-center'>
                                                <ArrowRight className='text-muted-foreground/80 size-2' />
                                            </div>
                                            {navItem.title}
                                        </CommandItem>
                                    )

                                return navItem.items?.map((subItem, i) => (
                                    <CommandItem
                                        key={`${navItem.title}-${subItem.url}-${i}`}
                                        value={`${navItem.title}-${subItem.url}`}
                                        onSelect={() => {
                                            runCommand(() => navigate({ to: subItem.url }))
                                        }}
                                    >
                                        <div className='flex size-4 items-center justify-center'>
                                            <ArrowRight className='text-muted-foreground/80 size-2' />
                                        </div>
                                        {navItem.title} <ChevronRight /> {subItem.title}
                                    </CommandItem>
                                ))
                            })}
                        </CommandGroup>
                    ))}
                    <CommandSeparator />
                    <CommandGroup heading='Giao diện'>
                        <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                            <Sun /> <span>Sáng</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                            <Moon className='scale-90' />
                            <span>Tối</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                            <Laptop />
                            <span>Hệ thống</span>
                        </CommandItem>
                    </CommandGroup>
                </ScrollArea>
            </CommandList>
        </CommandDialog>
    )
}
