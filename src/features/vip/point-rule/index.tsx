import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listVipPointRules } from '@/api/ vip-point-rule'
import { VipPointRuleTable } from './components/vip-point-rule-table'
import { CreateVipPointRuleButton } from './components/create-vip-point-rule-button'
import { VipPointRulesProvider } from './components/vip-point-rules-provider'
import { VipPointRuleDiaLog } from './components/vip-point-rule-dialog'
import { Route } from '@/routes/_authenticated/vip/point-rule'
import { useUrlPagination } from '@/hooks/use-url-pagination'

export default function VipPointRulePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const keyword = search.keyword ?? ''

    const { data, isLoading, error } = usePaginatedList(
        ['vip-point-rule'],
        listVipPointRules,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <VipPointRulesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Hệ số tính điểm VIP'
                description='Danh sách quy tắc tính điểm VIP.'
                actions={<CreateVipPointRuleButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <VipPointRuleTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
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

                        <VipPointRuleDiaLog />
                    </div>
                )}
            </PageSection>
        </VipPointRulesProvider>
    )
}