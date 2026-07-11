import * as React from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { exportXlsx } from '@/lib/xlsx-export'
import { listCustomerVips, type CustomerVipListParams } from '@/api/customer-vip'
import type { CustomerVip } from '../data/schema'
import type { CustomerVipFilters } from './customer-vip-table'

type ExportCustomerVipButtonProps = {
    keyword: string
    filters: CustomerVipFilters
}

export function ExportCustomerVipButton({ keyword, filters }: ExportCustomerVipButtonProps) {
    const [isExporting, setIsExporting] = React.useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const rows = await fetchAllCustomerVips(buildExportFilters(keyword, filters))
            if (!rows.length) {
                toast.warning('Không có dữ liệu để xuất')
                return
            }

            exportCustomerVipXlsx(rows)
            toast.success(`Đã xuất ${rows.length} khách hàng VIP`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Xuất Excel thất bại')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="h-10 border-slate-300 bg-white px-3 shadow-xs"
        >
            {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
        </Button>
    )
}

function buildExportFilters(keyword: string, filters: CustomerVipFilters): Omit<CustomerVipListParams, 'page' | 'size'> {
    return {
        keyword: keyword || undefined,
        region: stringifyFilter(filters.regions),
        tier_code: stringifyFilter(filters.tier_codes),
        group_code: stringifyFilter(filters.group_codes),
        customer_type: stringifyFilter(filters.customer_types),
        customer_code: stringifyFilter(filters.customer_codes),
        calc_year: filters.calc_year,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined,
    }
}

function stringifyFilter(values?: string[]) {
    return values && values.length > 0 ? values.join(',') : undefined
}

async function fetchAllCustomerVips(filters: Omit<CustomerVipListParams, 'page' | 'size'>) {
    const size = 200
    const rows: CustomerVip[] = []
    let page = 1

    for (let guard = 0; guard < 300; guard += 1) {
        const res = await listCustomerVips({
            ...filters,
            page,
            size,
        })
        const items = getItems(res)
        rows.push(...items)
        if (page >= (res.total_page || 1) || items.length === 0) break
        page += 1
    }

    return rows
}

const getItems = (res: any): CustomerVip[] =>
    res?.items ?? res?.data?.items ?? []

function exportCustomerVipXlsx(rows: CustomerVip[]) {
    const sheetRows: (string | number)[][] = [
        ['DANH SÁCH KHÁCH HÀNG VIP'],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        [
            'STT',
            'Năm tính',
            'Mã khách hàng',
            'Tên khách hàng',
            'Loại KH',
            'Khu vực',
            'Nhóm',
            'Tổng điểm VIP',
            'Điểm nhóm chung',
            'Điểm mã riêng',
            'Hạng hiện tại',
            'Hạng kế tiếp',
            'Điểm còn thiếu',
            'Thông báo còn thiếu',
            'Thưởng / điểm',
            'Tổng thưởng',
            'Thưởng riêng',
            'Thưởng cuối',
            'Ghi chú',
        ],
    ]

    rows.forEach((row, index) => {
        sheetRows.push([
            index + 1,
            Number(row.calc_year || 0),
            row.customer_code || '',
            row.customer_name || '',
            row.customer_type || '',
            row.region || '',
            row.group_code || '',
            Number(row.total_vip_point || 0),
            Number(row.common_group_point || 0),
            Number(row.ma_rieng_point || 0),
            row.tier_name || row.tier_code || '',
            row.next_tier_name || row.next_tier_code || '',
            Number(row.missing_point_to_next || 0),
            row.missing_point_message || '',
            Number(row.reward_amount || 0),
            Number(row.total_reward_amount || 0),
            Number(row.private_bonus_amount || 0),
            Number(row.final_bonus_amount || 0),
            row.note || '',
        ])
    })

    exportXlsx(`khach-hang-vip-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        { name: 'Khách hàng VIP', rows: sheetRows },
    ])
}
