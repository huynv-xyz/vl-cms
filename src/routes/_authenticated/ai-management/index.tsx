import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMyAdminStatus } from "@/api/auth/permission";
import AiAdminPage from "@/features/ai-admin";

export const Route = createFileRoute("/_authenticated/ai-management/")({
  beforeLoad: async () => {
    const { admin } = await getMyAdminStatus();
    if (!admin) throw redirect({ to: "/403" });
  },
  component: AiAdminPage,
});
