import { type ColumnDef } from '@tanstack/react-table'

import type { Customer } from '../data/schema'
import { buildSelectColumn } from '@/components/crud/build-select-column'
import { buildIndexColumn } from '@/components/crud/build-index-column'
import { buildActionsColumn } from '@/components/crud/build-actions-column'
import { buildTextColumn } from '@/components/crud/build-text-column'
import { buildBadgeColumn } from '@/components/crud/build-badge-column'
import { CustomerRowActions } from './customer-row-actions'

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

    buildActionsColumn<Customer>({
        renderActions: (_, row) => <CustomerRowActions row={row} />,
    }),
]