import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'
import { useAuthStore } from '@/stores/auth-store'

const searchSchema = z.object({
    redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
    beforeLoad: async () => {
        const { state, actions } = useAuthStore.getState()

        if (!state.initialized) {
            await actions.init()
        }

        const { accessToken, user } = useAuthStore.getState().state

        if (accessToken && user) {
            throw redirect({ to: '/' })
        }
    },
    component: SignIn,
    validateSearch: searchSchema,
})
