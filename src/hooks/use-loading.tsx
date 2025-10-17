import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { memo, useCallback, useState } from 'react'

interface LoadingProps<FN extends (...args: any[]) => Promise<unknown>> {
    asyncfn: FN
    label?: string
}

// 无需考虑错误处理，因为错误处理在 ErrorBoundary 中处理
export function useLoading<FN extends (...args: any[]) => Promise<unknown>>({ asyncfn, label }: LoadingProps<FN>) {
    const [loading, setLoading] = useState<string | null>(label ?? "loading...")
    const [result, setResult] = useState<Awaited<ReturnType<FN>> | undefined>(undefined)

    const start = useCallback(async (...args: Parameters<FN>): Promise<void> => {
        setLoading(label ?? 'Loading...')
        try {
            const value = await asyncfn(...args)
            setResult(value as Awaited<ReturnType<FN>>)
        } catch (e) {
            throw e
        } finally {
            setLoading(null)
        }
    }, [label, asyncfn])

    const isLoading = loading !== null

    if (isLoading) {
        return {
            start,
            loading: true as const,
            result: undefined as undefined,
        }
    }

    return {
        start,
        loading: false as const,
        result: result as Awaited<ReturnType<FN>>,
    }
}


interface LoadingPageProps {
    label?: string
    children?: React.ReactNode
}

export const LoadingPage = memo(({ label = "Loading...", children = undefined }: LoadingPageProps) => {
    return (
        <div className="flex justify-center items-center h-screen"
            style={{
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--background-color-primary)',
            }}
        >
            <LoadingIndicator type="line-spinner" size="md" label={label} />
            {children && children}
        </div>
    )
})