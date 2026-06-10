import { useState } from 'react'
import type { PaginationState } from '@tanstack/react-table'
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listVipPointRules } from '@/api/vip-point-rule'
import { listVipPointGroups } from '@/api/vip-point-group'
import { VipPointRuleTable } from './components/vip-point-rule-table'
import { VipPointGroupTable } from './components/vip-point-group-table'
import { CreateVipPointRuleButton } from './components/create-vip-point-rule-button'
import { CreateVipPointGroupButton } from './components/create-vip-point-group-button'
import { VipPointRulesProvider } from './components/vip-point-rules-provider'
import { VipPointGroupsProvider } from './components/vip-point-groups-provider'
import { VipPointRuleDiaLog } from './components/vip-point-rule-dialog'
import { VipPointGroupDialog } from './components/vip-point-group-dialog'
import { Route } from '@/routes/_authenticated/vip/point-rules'
import { useUrlPagination } from '@/hooks/use-url-pagination'

export default function VipPointRulePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const ruleFilters = useUrlListFilters(search, navigate, ['group_code'] as const)

    const keyword = search.keyword ?? ''
    const [groupKeyword, setGroupKeyword] = useState('')
    const [groupPagination, setGroupPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 20,
    })

    const {
        data: groupData,
        isLoading: isGroupLoading,
        error: groupError,
    } = usePaginatedList(
        ['vip-point-group', groupPagination.pageIndex, groupPagination.pageSize, groupKeyword],
        listVipPointGroups,
        {
            page: groupPagination.pageIndex + 1,
            size: groupPagination.pageSize,
            keyword: groupKeyword,
        },
        20,
        true,
    )

    const { data, isLoading, error } = usePaginatedList(
        ['vip-point-rule', ruleFilters.requestFilters.group_code],
        listVipPointRules,
        {
            page: search.page,
            size: search.size,
            keyword,
            group_code: ruleFilters.requestFilters.group_code,
        },
        20,
        true,
    )

    return (
        <VipPointGroupsProvider>
            <VipPointRulesProvider>
                <PageSection
                    isLoading={(isLoading && !data) || (isGroupLoading && !groupData)}
                    error={error || groupError}
                    title='Hệ số tính điểm VIP'
                    description='Danh sách nhóm và quy tắc tính điểm VIP.'
                    actions={
                        <div className='flex items-center gap-2'>
                            <CreateVipPointGroupButton />
                            <CreateVipPointRuleButton />
                        </div>
                    }
                    data={data && groupData ? { ruleData: data, groupData } : undefined}
                >
                    {({ ruleData, groupData }) => (
                        <div className='space-y-8'>
                            <section className='space-y-3'>
                                <div>
                                    <h2 className='text-lg font-semibold'>Nhóm tính điểm VIP</h2>
                                    <p className='text-sm text-muted-foreground'>
                                        Quản lý nhóm chung theo mã nhóm, đơn vị tính và hệ số vùng.
                                    </p>
                                </div>
                                <VipPointGroupTable
                                    data={groupData.items}
                                    pagination={groupPagination}
                                    onPaginationChange={setGroupPagination}
                                    pageCount={groupData.total_page}
                                    keyword={groupKeyword}
                                    onKeywordChange={(value) => {
                                        setGroupKeyword(value)
                                        setGroupPagination((prev) => ({
                                            ...prev,
                                            pageIndex: 0,
                                        }))
                                    }}
                                    onRowClick={(group) => {
                                        ruleFilters.setMulti('group_code', [group.group_code])
                                    }}
                                />
                            </section>

                            <section className='space-y-3'>
                                <div>
                                    <h2 className='text-lg font-semibold'>Quy tắc VTHH con</h2>
                                    <p className='text-sm text-muted-foreground'>
                                        Danh sách quy tắc chi tiết theo VTHH con.
                                    </p>
                                </div>
                                <VipPointRuleTable
                                    data={ruleData.items}
                                    pagination={pagination}
                                    onPaginationChange={setPagination}
                                    pageCount={ruleData.total_page}
                                    keyword={keyword}
                                    groupCodes={ruleFilters.getMulti('group_code')}
                                    onGroupCodesChange={(values) =>
                                        ruleFilters.setMulti('group_code', values)
                                    }
                                    onKeywordChange={(value) =>
                                        navigate({
                                            search: (prev) => ({
                                                ...prev,
                                                keyword: value || '',
                                                page: 1,
                                            }),
                                            replace: true,
                                        })
                                    }
                                />
                            </section>

                            <VipPointGroupDialog />
                            <VipPointRuleDiaLog />
                        </div>
                    )}
                </PageSection>
            </VipPointRulesProvider>
        </VipPointGroupsProvider>
    )
}
