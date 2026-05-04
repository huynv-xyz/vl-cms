export function OrderCustomer({ order }) {
    return (
        <div className="border-b pb-3 text-sm flex gap-6">

            <div>
                <span className="text-gray-400">KH: </span>
                <span className="font-medium">
                    {order.customer?.name}
                </span>
            </div>

            <div>
                <span className="text-gray-400">Sale: </span>
                <span className="font-medium">
                    {order.employee?.name}
                </span>
            </div>

        </div>
    )
}