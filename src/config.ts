declare global {
    interface Window {
        __APP_CONFIG__?: {
            API_URL?: string
        }
    }
}

type AppConfig = {
    API_URL: string
}

const defaultConfig: AppConfig = {
    API_URL: import.meta.env.VITE_API_URL || "",
}

function loadConfig(): AppConfig {
    const runtimeConfig = typeof window !== "undefined" ? window.__APP_CONFIG__ : undefined

    return {
        ...defaultConfig,
        ...runtimeConfig,
    }
}

export const appConfig = loadConfig()
export const API_BASE = appConfig.API_URL