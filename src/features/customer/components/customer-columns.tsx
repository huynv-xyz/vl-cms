import { type ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { buildActionsColumn } from '@/components/crud/build-actions-column'
import { buildBadgeColumn } from '@/components/crud/build-badge-column'
import { buildIndexColumn } from '@/components/crud/build-index-column'
import { buildSelectColumn } from '@/components/crud/build-select-column'
import { buildTextColumn } from '@/components/crud/build-text-column'
import type { Customer } from '../data/schema'
import { CustomerRowActions } from './customer-row-actions'
import { useCustomers } from './customers-provider'

function CustomerInvoiceInfoButton({ customer }: { customer: Customer }) {
    const { openDetail } = useCustomers()

    return (
        <Button type="button" variant="outline" size="sm" onClick={() => openDetail(customer)}>
            Thông tin xuất HĐ
            {customer.alias_count && customer.alias_count > 1 ? ` (${customer.alias_count})` : ""}
        </Button>
    )
}

export const customerColumns: ColumnDef<Customer>[] = [
    buildSelectColumn<Customer>(),

    buildIndexColumn<Customer>(),

    buildTextColumn<Customer>({
        accessorKey: 'code',
        title: 'Mã khách hàng',
        width: 140,
        maxWidth: 140,
        textClassName: 'font-medium text-sm',
    }),

    buildTextColumn<Customer>({
        accessorKey: 'name',
        title: 'Tên khách hàng',
        width: 320,
        maxWidth: 320,
    }),

    buildTextColumn<Customer>({
        accessorKey: 'address',
        title: 'Địa chỉ',
        width: 260,
        maxWidth: 260,
    }),

    buildTextColumn<Customer>({
        title: 'Nhân viên phụ trách',
        width: 190,
        maxWidth: 190,
        accessorFn: (row) =>
            row.employee
                ? row.employee.code
                    ? `${row.employee.code} - ${row.employee.name}`
                    : row.employee.name
                : row.employee_id,
    }),

    buildBadgeColumn<Customer>({
        accessorKey: 'type',
        title: 'Loại khách hàng',
        width: 120,
        mapValueToLabel: (value) => String(value || '-'),
        mapValueToVariant: () => 'outline',
    }),

    buildBadgeColumn<Customer>({
        accessorKey: 'region',
        title: 'Khu vực',
        width: 120,
        mapValueToLabel: (value) => String(value || '-'),
        mapValueToVariant: () => 'secondary',
    }),

    buildBadgeColumn<Customer>({
        accessorKey: 'status',
        title: 'Trạng thái',
        width: 120,
        mapValueToLabel: (value) => (Number(value) === 1 ? 'Hoạt động' : 'Tắt'),
        mapValueToVariant: (value) => (Number(value) === 1 ? 'default' : 'outline'),
        mapValueToClassName: (value) =>
            Number(value) === 1 ? 'text-xs' : 'text-xs text-muted-foreground',
    }),

    buildTextColumn<Customer>({
        accessorKey: 'note',
        title: 'Ghi chú',
        width: 220,
        maxWidth: 220,
    }),

    {
        id: 'invoice_info',
        header: 'Thông tin xuất HĐ',
        cell: ({ row }) => <CustomerInvoiceInfoButton customer={row.original} />,
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: 'text-left',
            tdClassName: 'text-left',
        },
    },

    buildActionsColumn<Customer>({
        renderActions: (_, row) => <CustomerRowActions row={row} />,
    }),
]
