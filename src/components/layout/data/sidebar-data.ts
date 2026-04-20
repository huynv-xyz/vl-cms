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
    FileText
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
                /*{
                    title: 'Nhân viên',
                    url: '/employees',
                    icon: UserCircle, // 👤 rõ hơn Users
                },*/
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
                    title: 'Bán hàng',
                    url: '/transactions',
                    icon: ShoppingCart, // 🛒 hợp lý hơn Receipt
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
            ],
        },

        /*{
            title: 'Hợp đồng năm',
            items: [
                {
                    title: 'VIP',
                    url: '/vip/customers',
                    icon: Crown, // 👑 chuẩn
                },
                {
                    title: 'Tính điểm VIP',
                    url: '/vip/point-rules',
                    icon: Calculator, // 🧮 OK
                },
                {
                    title: 'Mã riêng',
                    url: '/vip/private-rules',
                    icon: KeyRound, // 🔑 OK
                },
                {
                    title: 'Cấp bậc VIP',
                    url: '/vip/tiers',
                    icon: Layers3, // 🧱 tầng
                }
            ],
        },

        {
            title: 'Lương sale',
            items: [
                {
                    title: 'Chỉ tiêu tháng',
                    url: '/salary/sales-targets',
                    icon: Target, // 🎯 chuẩn hơn Crown
                },
                {
                    title: 'Thực hiện',
                    url: '/salary/sales-actuals',
                    icon: TrendingUp, // 📈 logic
                }
            ],
        },*/

        {
            title: 'Xuất nhập khẩu',
            items: [
                {
                    title: 'Hợp đồng',
                    url: '/purchasing/contracts',
                    icon: FileText, // 📄 hợp đồng chuẩn hơn Package
                },
                {
                    title: 'Nhà cung cấp',
                    url: '/purchasing/suppliers',
                    icon: Warehouse, // 🏭 supplier ≠ user
                },
                {
                    title: 'Cảng',
                    url: '/purchasing/ports',
                    icon: Anchor, // ⚓ chuẩn domain logistics
                }
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
                    title: 'Thu tiền',
                    url: '/sales/receipts',
                    icon: DollarSign,
                },
                {
                    title: 'Công nợ',
                    url: '/sales/ar',
                    icon: BarChart3,
                },
            ],
        }
    ],

}