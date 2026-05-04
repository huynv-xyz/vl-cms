export function OrderHeader({ order }) {
    return (
        <div className="flex justify-between items-center border-b pb-3">

            <div>
                <div className="text-lg font-semibold">
                    {order.order_no}
                </div>

                <div className="text-sm text-gray-500">
                    {order.order_date}
                </div>
            </div>

            <span className="px-2 py-1 text-xs rounded bg-gray-100">
                {order.status}
            </span>

        </div>
    )
}