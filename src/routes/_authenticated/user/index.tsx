import { createFileRoute, redirect } from "@tanstack/react-router"

// Route /user đã được chuyển sang /access/users.
// Giữ file này như một redirect để không gãy bookmark cũ.
export const Route = createFileRoute("/_authenticated/user/")({
    beforeLoad: () => {
        throw redirect({ to: "/access/users", search: { page: 1, size: 20, keyword: "", status: undefined } })
    },
})
