import { create } from "zustand"
import { apiGet, apiPost } from "@/api/client"

const ACCESS_TOKEN_KEY = "access_token"

export interface AuthUser {
    id: number
    email: string
    name: string
}

export interface LoginResponse {
    accessToken: string
    tokenType: string
}

export interface AuthState {
    state: {
        user: AuthUser | null
        accessToken: string
        initialized: boolean
    }

    actions: {
        init: () => Promise<void>
        login: (email: string, password: string) => Promise<{ user: AuthUser; accessToken: string }>
        logout: () => Promise<void>
        setUser: (user: AuthUser | null) => void
        setAccessToken: (token: string) => void
        resetAccessToken: () => void
        reset: () => void
    }
}

export const useAuthStore = create<AuthState>()((set, get) => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? ""

    return {
        state: {
            user: null,
            accessToken: storedToken,
            initialized: false,
        },

        actions: {
            init: async () => {
                const { state, actions } = get()

                if (state.initialized) return

                if (!state.accessToken) {
                    set((s) => ({
                        state: {
                            ...s.state,
                            initialized: true,
                        },
                    }))
                    return
                }

                try {
                    const user = await apiGet<AuthUser>("/auth/me")

                    set((s) => ({
                        state: {
                            ...s.state,
                            user,
                            initialized: true,
                        },
                    }))
                } catch (error) {
                    console.error("Failed to init auth:", error)
                    actions.reset()
                }
            },

            login: async (email: string, password: string) => {
                const loginData = await apiPost<LoginResponse>("/auth/login", {
                    email,
                    password,
                })

                const accessToken = loginData.accessToken

                set((s) => {
                    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
                    return {
                        state: {
                            ...s.state,
                            accessToken,
                        },
                        actions: s.actions,
                    }
                })

                try {
                    const user = await apiGet<AuthUser>("/auth/me")

                    set((s) => ({
                        state: {
                            ...s.state,
                            user,
                            accessToken,
                            initialized: true,
                        },
                        actions: s.actions,
                    }))

                    return { user, accessToken }
                } catch (error) {
                    localStorage.removeItem(ACCESS_TOKEN_KEY)

                    set((s) => ({
                        state: {
                            ...s.state,
                            user: null,
                            accessToken: "",
                            initialized: true,
                        },
                        actions: s.actions,
                    }))

                    throw error
                }
            },

            logout: async () => {
                const { actions } = get()

                try {
                    await apiPost<string>("/auth/logout")
                } catch (error) {
                    console.error("Logout failed:", error)
                } finally {
                    actions.reset()
                }
            },

            setUser: (user) =>
                set((s) => ({
                    state: {
                        ...s.state,
                        user,
                    },
                    actions: s.actions,
                })),

            setAccessToken: (token) =>
                set((s) => {
                    localStorage.setItem(ACCESS_TOKEN_KEY, token)
                    return {
                        state: {
                            ...s.state,
                            accessToken: token,
                        },
                        actions: s.actions,
                    }
                }),

            resetAccessToken: () =>
                set((s) => {
                    localStorage.removeItem(ACCESS_TOKEN_KEY)
                    return {
                        state: {
                            ...s.state,
                            accessToken: "",
                        },
                        actions: s.actions,
                    }
                }),

            reset: () =>
                set((s) => {
                    localStorage.removeItem(ACCESS_TOKEN_KEY)
                    return {
                        state: {
                            user: null,
                            accessToken: "",
                            initialized: true,
                        },
                        actions: s.actions,
                    }
                }),
        },
    }
})