import { createContext, useContext, useReducer, useState, useMemo, useCallback, memo, type FC } from "react"
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalOverlay } from "react-aria-components";
import { Dialog } from "react-aria-components";
import { cx } from "@/utils/cx";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { CloseIcon } from "@/components/tiptap-icons/close-icon";

export interface AppState {
    LOG_loading: string[]
    LOG_clear: () => void
    LOG_append: (message: string) => void
    error: string | null
    setError: (error: string | null) => void
}

const AppStateContext = createContext<AppState | null>(null)

interface LoadingPageProps {
    children: React.ReactNode
    logging?: string[]
    error?: string | null
}

const LoadingPage = memo(({ children, logging, error }: LoadingPageProps) => {
    if (!logging || logging.length === 0 && !error) {
        return null
    }
    return (
        <div className="absolute z-200 top-0 left-0 w-full h-full flex flex-col items-center justify-center">
            <LoadingIndicator type="line-spinner" size="md" label="Loading..." />
            {children}
        </div>
    )
})

const ErrorPage = memo(({ error }: { error: string | null }) => {
    if (!error) return null
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
        <div className="absolute z-300 top-0 left-0 w-full h-full flex flex-col items-center justify-center">
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
    return <AppStateContext.Provider value={contextValue}>
        <main className="flex-1 relative h-dvh overflow-y-auto">
            <LoadingPage logging={LOG_loading} error={error} >
                {LOG_loading.map((log, index) => (
                    <div key={`${log}-${index}`}>{log}</div>
                ))}
            </LoadingPage>
            {/* Error状态 */}
            <ErrorPage error={error} />

            {/* 正常内容 */}
            {children}
        </main>
    </AppStateContext.Provider >
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


interface GlobalPortalActions {
    label: string
    icon?: FC<{ className?: string }>
    onClick: () => void
}
interface GlobalPortalContextType {
    build: (
        title?: string,
        content?: React.ReactNode,
        actions?: GlobalPortalActions[],
        isDismissable?: boolean
    ) => void
    isOpen: boolean
    close: () => void
}
const GlobalPortalContext = createContext<GlobalPortalContextType | null>(null)

export const GlobalPortalProvider = ({ children }: { children: React.ReactNode }) => {
    const [_children, _setChildren] = useState<{
        title?: string
        content?: React.ReactNode
        actions?: GlobalPortalActions[]
    } | null>(null)

    const [isDismissable, setIsDismissable] = useState(true)
    const [isOpen, setOpen] = useState(false)
    const build = (title?: string, content?: React.ReactNode, actions?: GlobalPortalActions[], isDismissable?: boolean) => {
        setIsDismissable(isDismissable ?? true)
        setOpen(true)
        _setChildren({ title, content, actions })
    }

    
    return (
        <GlobalPortalContext.Provider value={{ build, isOpen, close: () => setOpen(false) }}>
            {children}
            <ModalOverlay
                isDismissable={isDismissable}
                isOpen={isOpen}
                onOpenChange={setOpen}
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 cursor-pointer backdrop-blur-md",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                <Dialog className="outline-hidden flex flex-col justify-center items-center w-full h-full">
                    <div className="bg-primary p-4 rounded-lg border border-secondary md:w-120 max-md:w-full max-h-full overflow-auto">
                        <header className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">{_children?.title}</h2>
                            <ButtonUtility onClick={close} color="secondary" size="sm" icon={CloseIcon} />
                        </header>
                        {_children?.content}
                        <footer className="flex justify-end mt-4">
                            <ButtonGroup>
                                {_children?.actions?.map((action) => (
                                    <ButtonGroupItem
                                        key={action.label}
                                        iconLeading={action.icon}
                                        onClick={() => {
                                            action.onClick()
                                        }}
                                    >
                                        {action.label}
                                    </ButtonGroupItem>
                                ))}
                            </ButtonGroup>
                        </footer>
                    </div>
                </Dialog>
            </ModalOverlay>
        </GlobalPortalContext.Provider>
    );
};

export function useGlobalPortal() {
    const context = useContext(GlobalPortalContext)
    if (!context) {
        throw new Error('useGlobalPortal must be used within a GlobalPortalProvider')
    }
    return context
}