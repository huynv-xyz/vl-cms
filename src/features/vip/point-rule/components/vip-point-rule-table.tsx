import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { CrudTable } from '@/components/crud/crud-table'
import { AsyncMultiSelect } from '@/components/rjsf/async-multi-select'
import { listVipPointGroups } from '@/api/vip-point-group'
import type { VipPointRule } from '../data/schema'
import { vipPointRuleColumns } from './vip-point-rule-columns'

type VipPointRuleTableProps = {
    data: VipPointRule[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    groupCodes: string[]
    onGroupCodesChange: (values: string[]) => void
}

export function VipPointRuleTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    groupCodes,
    onGroupCodesChange,
}: VipPointRuleTableProps) {
    return (
        <CrudTable<VipPointRule>
            data={data}
            columns={vipPointRuleColumns}
            entityName='quy tắc tính điểm VIP'
            searchPlaceholder='Tìm theo mã hàng hoặc ghi chú...'
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
                {
                    columnId: 'group_code',
                    title: '',
                    render: () => (
                        <AsyncMultiSelect
                            className="h-9 min-w-[260px] border-slate-300 bg-white shadow-xs"
                            value={groupCodes}
                            onChange={onGroupCodesChange}
                            placeholder="Mã chung"
                            searchPlaceholder="Nhập mã hoặc tên nhóm..."
                            emptyText="Không có nhóm tính điểm"
                            dataSource={{
                                getList: listVipPointGroups,
                                getById: async (groupCode: string) => {
                                    const res = await listVipPointGroups({
                                        page: 1,
                                        size: 20,
                                        keyword: groupCode,
                                        status: 1,
                                    })

                                    return res.items.find((item) => item.group_code === groupCode)
                                        ?? res.items[0]
                                },
                                params: {
                                    page: 1,
                                    size: 20,
                                    status: 1,
                                },
                            }}
                            mapOption={(group: any) => ({
                                value: group.group_code,
                                label: group.group_name
                                    ? `${group.group_code} - ${group.group_name}`
                                    : group.group_code,
                                raw: group,
                            })}
                        />
                    ),
                },
            ]}
        />
    )
}
