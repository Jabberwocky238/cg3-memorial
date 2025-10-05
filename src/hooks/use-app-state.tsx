import { createContext, useContext, useReducer, useState } from "react"
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";

export interface AppState {
    LOG_loading: string[]
    LOG_clear: () => void
    LOG_append: (message: string) => void
    error: string | null
    setError: (error: string | null) => void
}

const AppStateContext = createContext<AppState | null>(null)

function ErrorIndicator({ error }: { error: string }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <span className="text-secondary">{error}</span>
        </div>
    )
}

function loadingLogsReducer(state: string[], action: string | 'clear') {
    if (action === 'clear') {
        return []
    }
    return [...state, action]
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [LOG_loading, dispatchLoadingLogs] = useReducer(loadingLogsReducer, [])
    const [error, setError] = useState<string | null>(null)
    const LOG_clear = () => {
        dispatchLoadingLogs('clear')
    }
    const LOG_append = (message: string) => {
        // console.log('LOG_append', message)
        dispatchLoadingLogs(message)
    }

    return <AppStateContext.Provider value={{ LOG_loading, LOG_clear, LOG_append, error, setError }}>
        {LOG_loading.length > 0 && !error && <>
            <LoadingIndicator type="line-spinner" size="md" label="Loading..." />
            {LOG_loading.map((log) => (
                <div key={log}>{log}</div>
            ))}
        </>}
        {error && <ErrorIndicator error={error} />}
        {LOG_loading.length === 0 && !error && children}
    </AppStateContext.Provider>
}

export function useAppState() {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}