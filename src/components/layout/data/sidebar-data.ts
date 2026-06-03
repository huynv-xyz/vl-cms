import {
    Crown,
    Users,
    Calculator,
    KeyRound,
    Layers3,
    ReceiptText,
    Package,
    Truck,
    DollarSign,
    BarChart3,
    MapPin,
    Map,
    Boxes,
    ListOrdered,
    UserCircle,
    ShoppingCart,
    Warehouse,
    Anchor,
    Globe,
    TrendingUp,
    Target,
    FileText,
    Ship,
    ShieldCheck,
    UserCog,
    UsersRound,
    SlidersHorizontal,
    GitMerge,
    History,
    Building2,
} from 'lucide-react'
import { SidebarData } from '../types'
import { Logo } from '@/assets/logo'

export const sidebarData: SidebarData = {
    teams: [
        {
            name: 'VLife',
            logo: Logo,
            plan: 'Admin Tool',
        }
    ],
    navGroups: [
        {
            title: 'Dữ liệu',
            items: [
                {
                    title: 'Nhân viên',
                    url: '/employees',
                    icon: UserCircle,
                },
                {
                    title: 'Khách hàng',
                    url: '/customers',
                    icon: Users, // 👥 OK
                },
                {
                    title: 'Sản phẩm',
                    url: '/products',
                    icon: Package, // 📦 chuẩn domain
                },
                {
                    title: 'Nhóm sản phẩm',
                    url: '/product-groups',
                    icon: Layers3,
                },
                {
                    title: 'Kho hàng',
                    url: '/warehouses',
                    icon: Warehouse,
                },
                {
                    title: 'Bán hàng',
                    url: '/transactions',
                    icon: ShoppingCart,
                },
                {
                    title: 'Mô tả HH',
                    url: '/sales/goods-descriptions',
                    icon: ReceiptText,
                },
                {
                    title: 'Khu vực',
                    url: '/provinces',
                    icon: MapPin, // 📍 OK
                },
                {
                    title: 'Vùng',
                    url: '/regions',
                    icon: Globe, // 🌍 better than Map
                },
                {
                    title: 'Quốc gia',
                    url: '/nations',
                    icon: Globe,
                },
                {
                    title: 'Tiền tệ',
                    url: '/currencies',
                    icon: DollarSign,
                },
                {
                    title: 'Công ty',
                    url: '/companies',
                    icon: Building2,
                },
            ],
        },

        /*
        {
            title: 'Lương sale',
            items: [
                {
                    title: 'Chỉ tiêu tháng',
                    url: '/salary/sales-targets',
                    icon: Target, 
                },
                {
                    title: 'Thực hiện',
                    url: '/salary/sales-actuals',
                    icon: TrendingUp, 
                }
            ],
        },*/

        {
            title: 'Xuất nhập khẩu',
            items: [
                {
                    title: 'Hợp đồng',
                    url: '/purchasing/contracts',
                    icon: FileText,
                },
                {
                    title: 'Lịch hàng về',
                    url: '/purchasing/shipments',
                    icon: Ship,
                },
                {
                    title: 'Nhà cung cấp',
                    url: '/purchasing/suppliers',
                    icon: Warehouse,
                },
                {
                    title: 'Cảng',
                    url: '/purchasing/ports',
                    icon: Anchor,
                }
            ],
        },
        {
            title: 'Giá thành',
            items: [
                {
                    title: 'Tính giá bán',
                    url: '/pricing',
                    icon: Calculator,
                },
            ],
        },
        {
            title: 'Bán hàng & Công nợ',
            items: [
                {
                    title: 'Đơn hàng',
                    url: '/sales/orders',
                    icon: ListOrdered,
                },
                {
                    title: 'Giao hàng',
                    url: '/sales/deliveries',
                    icon: Truck,
                },
                {
                    title: 'Xuất kho',
                    url: '/sales/exports',
                    icon: Boxes,
                },
                {
                    title: 'Trả hàng',
                    url: '/sales/returns',
                    icon: ReceiptText,
                },
                {
                    title: 'Nợ đầu kỳ',
                    url: '/sales/ar-openings',
                    icon: DollarSign,
                },
                {
                    title: 'Ngân hàng',
                    url: '/sales/cash-bank-ledger',
                    icon: ReceiptText,
                },
                {
                    title: 'Tổng hợp công nợ',
                    url: '/sales/ar-summary',
                    icon: BarChart3,
                },
                {
                    title: 'Chi tiết công nợ',
                    url: '/sales/ar-ledgers',
                    icon: ListOrdered,

                },
                {
                    title: 'Điều chỉnh công nợ',
                    url: '/sales/ar-adjustments',
                    icon: Calculator,
                },
            ],
        },
        {
            title: 'Tồn kho',
            items: [
                {
                    title: 'Tồn kho',
                    url: '/inventory/summary',
                    icon: BarChart3,
                },
                {
                    title: 'Sổ kho',
                    url: '/inventory/ledgers',
                    icon: ListOrdered,
                },
            ],
        },
        {
            title: 'Sản xuất',
            items: [
                {
                    title: 'Lệnh sản xuất',
                    url: '/production/orders',
                    icon: Package,
                },

                {
                    title: 'Định mức BOM',
                    url: '/production/boms',
                    icon: Layers3,
                },
            ],
        },
        {
            title: 'Hợp đồng năm',
            items: [
                {
                    title: 'VIP',
                    url: '/vip/customer',
                    icon: Crown,
                },
                {
                    title: 'Tính điểm VIP',
                    url: '/vip/point-rules',
                    icon: Calculator,
                },
                {
                    title: 'Mã riêng',
                    url: '/vip/private-rules',
                    icon: KeyRound,
                },
                {
                    title: 'Cấp bậc VIP',
                    url: '/vip/tiers',
                    icon: Layers3,
                },
                {
                    title: 'Điểm hàng hóa',
                    url: '/vip/product-mapping',
                    icon: GitMerge,
                },
            ],
        },
        {
            title: 'Quản trị hệ thống',
            items: [
                {
                    title: 'Tài khoản',
                    url: '/access/users',
                    icon: UsersRound,
                },
                {
                    title: 'Vai trò',
                    url: '/access/roles',
                    icon: ShieldCheck,
                },
                {
                    title: 'Phân quyền',
                    url: '/access/user-roles',
                    icon: UserCog,
                },
                {
                    title: 'Danh mục quyền',
                    url: '/access/permissions',
                    icon: SlidersHorizontal,
                },
            ],
        },
    ],

}
