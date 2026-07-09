import { type ColumnDef } from '@tanstack/react-table'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { buildBadgeColumn } from '@/components/crud/build-badge-column'
import { buildIndexColumn } from '@/components/crud/build-index-column'
import { buildTextColumn } from '@/components/crud/build-text-column'
import type { Customer } from '../data/schema'
import { CustomerRowActions } from './customer-row-actions'
import { useCustomers } from './customers-provider'

const gridCell = 'border-r border-slate-200 last:border-r-0'
const centerCell = `${gridCell} text-center`

function TruncatedCustomerText({
    value,
    className,
}: {
    value: unknown
    className?: string
}) {
    const display =
        value === null || value === undefined || value === '' ? '-' : String(value)

    return (
        <span className={`block min-w-0 truncate ${className ?? ''}`}>
            {display}
        </span>
    )
}

function CustomerInvoiceInfoButton({ customer }: { customer: Customer }) {
    const { openDetail } = useCustomers()

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Thông tin xuất HĐ"
            onClick={() => openDetail(customer)}
        >
            <FileText className="h-4 w-4" />
            <span className="sr-only">Thông tin xuất HĐ</span>
        </Button>
    )
}

export const customerColumns: ColumnDef<Customer>[] = [
    {
        ...buildIndexColumn<Customer>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<Customer>({
        accessorKey: 'code',
        title: 'Mã khách hàng',
        width: 170,
        className: `w-[170px] whitespace-nowrap ${centerCell}`,
        render: (row) => (
            <TruncatedCustomerText
                value={row.code}
                className="text-center font-mono text-sm font-semibold"
            />
        ),
    }),

    buildTextColumn<Customer>({
        accessorKey: 'name',
        title: 'Tên khách hàng',
        width: 340,
        className: `w-[340px] ${gridCell}`,
        render: (row) => (
            <TruncatedCustomerText
                value={row.name}
                className="text-sm font-medium"
            />
        ),
    }),

    buildTextColumn<Customer>({
        accessorKey: 'address',
        title: 'Địa chỉ',
        width: 320,
        className: `w-[320px] ${gridCell}`,
        render: (row) => (
            <TruncatedCustomerText
                value={row.address}
                className="text-sm"
            />
        ),
    }),

    buildTextColumn<Customer>({
        title: 'Nhân viên phụ trách',
        width: 210,
        className: `w-[210px] ${centerCell}`,
        render: (row) => (
            <div className="min-w-0 text-center">
                <div className="truncate text-sm font-medium">
                    {row.employee?.name || row.employee_id || '-'}
                </div>
                {row.employee?.code && (
                    <div className="truncate text-xs text-muted-foreground">
                        {row.employee.code}
                    </div>
                )}
            </div>
        ),
    }),

    {
        ...buildBadgeColumn<Customer>({
            accessorKey: 'type',
            title: 'Loại khách hàng',
            width: 130,
            mapValueToLabel: (value) => String(value || '-'),
            mapValueToVariant: () => 'outline',
        }),
        meta: {
            thClassName: `w-[130px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[130px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        ...buildBadgeColumn<Customer>({
            accessorKey: 'region',
            title: 'Khu vực',
            width: 110,
            mapValueToLabel: (value) => String(value || '-'),
            mapValueToVariant: () => 'secondary',
        }),
        meta: {
            thClassName: `w-[110px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[110px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        ...buildBadgeColumn<Customer>({
            accessorKey: 'status',
            title: 'Trạng thái',
            width: 120,
            mapValueToLabel: (value) => (Number(value) === 1 ? 'Hoạt động' : 'Ngừng'),
            mapValueToVariant: (value) => (Number(value) === 1 ? 'default' : 'outline'),
            mapValueToClassName: (value) =>
                Number(value) === 1 ? 'text-xs' : 'text-xs text-muted-foreground',
        }),
        meta: {
            thClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<Customer>({
        accessorKey: 'note',
        title: 'Ghi chú',
        width: 220,
        className: `w-[220px] ${gridCell}`,
        render: (row) => (
            <TruncatedCustomerText
                value={row.note}
                className="text-sm"
            />
        ),
    }),

    {
        id: 'invoice_info',
        header: 'Thông tin xuất HĐ',
        size: 180,
        cell: ({ row }) => (
            <div className="flex justify-center">
                <CustomerInvoiceInfoButton customer={row.original} />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            thClassName: `w-[180px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[180px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        enableHiding: false,
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                <CustomerRowActions row={row} />
            </div>
        ),
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
        },
    },
]
