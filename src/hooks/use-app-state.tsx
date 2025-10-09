import { createContext, useContext, useReducer, useState, useMemo, useCallback, memo } from "react"
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/base/buttons/button";

export interface AppState {
    LOG_loading: string[]
    LOG_clear: () => void
    LOG_append: (message: string) => void
    error: string | null
    setError: (error: string | null) => void
}

const AppStateContext = createContext<AppState | null>(null)

const LoadingPage = memo(({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-full items-center justify-center">
            <LoadingIndicator type="line-spinner" size="md" label="Loading..." />
            {children}
        </div>
    )
})

const ErrorPage = memo(({ error }: { error: string }) => {
    const navigate = useNavigate()
    const handleBack = () => {
        // 如果有上一页
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }
    return (
        <div className="flex flex-col h-full items-center justify-center">
            <span className="text-secondary text-center">{error}</span>
            <Button onClick={handleBack}>返回上一页</Button>
        </div>
    )
})

function loadingLogsReducer(state: string[], action: string | 'clear') {
    if (action === 'clear') {
        return []
    }
    return [...state, action]
}

export const AppStateProvider = memo(({ children }: { children: React.ReactNode }) => {
    const [LOG_loading, dispatchLoadingLogs] = useReducer(loadingLogsReducer, [])
    const [error, setError] = useState<string | null>(null)
    
    const LOG_clear = useCallback(() => {
        dispatchLoadingLogs('clear')
    }, [])
    
    const LOG_append = useCallback((message: string) => {
        // console.log('LOG_append', message)
        dispatchLoadingLogs(message)
    }, [])

    const contextValue = useMemo(() => ({
        LOG_loading,
        LOG_clear,
        LOG_append,
        error,
        setError
    }), [LOG_loading, LOG_clear, LOG_append, error, setError])

    // 计算状态
    const isLoading = LOG_loading.length > 0 && !error
    const hasError = !!error
    const showContent = LOG_loading.length === 0 && !error

    return <AppStateContext.Provider value={contextValue}>
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Loading状态 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isLoading ? 1 : 0,
                visibility: isLoading ? 'visible' : 'hidden',
                transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
                willChange: 'opacity, visibility',
                zIndex: isLoading ? 10 : -1,
                pointerEvents: isLoading ? 'auto' : 'none'
            }}>
                <LoadingPage>
                    <LoadingIndicator type="line-spinner" size="md" label="Loading..." />
                    {LOG_loading.map((log, index) => (
                        <div key={`${log}-${index}`}>{log}</div>
                    ))}
                </LoadingPage>
            </div>
            
            {/* Error状态 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: hasError ? 1 : 0,
                visibility: hasError ? 'visible' : 'hidden',
                transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
                willChange: 'opacity, visibility',
                zIndex: hasError ? 10 : -1,
                pointerEvents: hasError ? 'auto' : 'none'
            }}>
                {error && <ErrorPage error={error} />}
            </div>
            
            {/* 正常内容 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: showContent ? 1 : 0,
                visibility: showContent ? 'visible' : 'hidden',
                transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
                willChange: 'opacity, visibility',
                zIndex: showContent ? 10 : -1,
                pointerEvents: showContent ? 'auto' : 'none'
            }}>
                {children}
            </div>
        </div>
    </AppStateContext.Provider>
})

export function useAppState() {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}

export function isUUID(str: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}