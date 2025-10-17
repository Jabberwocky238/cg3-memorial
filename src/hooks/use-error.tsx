import { createContext, useContext, useReducer, useState, useMemo, useCallback, memo, type PropsWithChildren } from "react"
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/base/buttons/button";
import React from "react";

export class EasyError extends Error {
    constructor(...args: unknown[]) {
        const errorString = args.length > 0 ? args.map(arg => String(arg)).join(' ') : 'Unknown error'
        super(errorString)
    }
}

export class ErrorThenNavigate extends EasyError {
    public readonly __brand = 'ErrorThenNavigate'
    constructor(public navigateTo: string | -1, ...args: unknown[]) {
        super(...args)
    }

    static is(error: unknown): error is ErrorThenNavigate {
        if (!error || typeof error !== 'object') return false
        const maybe: any = error
        return maybe.__brand === 'ErrorThenNavigate'
    }
}

// export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
//     const navigate = useNavigate()

//     try {
//         return children
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error'
//         console.error(error)
//         if (error instanceof ErrorWithOptions) {
//             const { message, options } = error
//             if (options && !options.navigateTo) {
//                 const handleBack = () => navigate(options.navigateTo as string)
//                 return <div className="absolute z-300 top-0 left-0 w-full h-full flex flex-col items-center justify-center">
//                     <span className="text-secondary text-center">{message}</span>
//                     <Button onClick={handleBack}>前往{options.navigateTo}</Button>
//                 </div>
//             }
//         }
//         return (
//             <div className="absolute z-300 top-0 left-0 w-full h-full flex flex-col items-center justify-center">
//                 <span className="text-secondary text-center">{errorMessage}</span>
//                 <Button onClick={() => navigate('/')}>返回首页</Button>
//             </div>
//         )
//     }
// }



type Navigate = ReturnType<typeof useNavigate>

interface ErrorBoundaryState {
    hasError: boolean,
    errorInstance: Error | null,
}

interface ErrorBoundaryProps extends PropsWithChildren {
    navigate: Navigate
}

class _ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorInstance: null,
        };
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, errorInstance: error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // logErrorToMyService(
        //     error,
        //     // Example "componentStack":
        //     //   in ComponentThatThrows (created by App)
        //     //   in ErrorBoundary (created by App)
        //     //   in div (created by App)
        //     //   in App
        //     info.componentStack,
        //     // Warning: `captureOwnerStack` is not available in production.
        //     React.captureOwnerStack(),
        // );
        // console.error("ErrorBoundary: ", error, info);
        this.setState({ hasError: true, errorInstance: error });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children
        }
        // if (this.state.hasError) {
        //     // You can render any custom fallback UI
        //     return this.props.fallback;
        // }

        // return this.props.children;
        const error = this.state.errorInstance
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (ErrorThenNavigate.is(error)) {
            const { message, navigateTo } = error
            const handleBack = () => {
                if (navigateTo === -1) {
                    this.props.navigate(-1)
                } else {
                    this.props.navigate(navigateTo)
                }
            }
            return <div className="z-300 w-full h-full flex flex-col items-center justify-center">
                <span className="text-secondary text-center">{message}</span>
                <Button onClick={handleBack}>{navigateTo === -1 ? '返回' : '前往' + navigateTo}</Button>
            </div>
        }
        return (
            <div className="z-300 w-full h-full flex flex-col items-center justify-center">
                <span className="text-secondary text-center">{errorMessage}</span>
                <Button onClick={() => this.props.navigate('/')}>返回首页</Button>
            </div>
        )
    }
}

export const ErrorBoundary = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate()
    return <_ErrorBoundary navigate={navigate}>
        {children}
    </_ErrorBoundary>
}
