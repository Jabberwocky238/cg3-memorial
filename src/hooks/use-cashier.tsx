import { createContext, useContext, useEffect, useState } from "react"
import { useFirebase } from "./use-firebase"
import type { User } from "firebase/auth"

export interface UserCashier {
    uid_firebase: string
    balance_usd: number
    misc: string
    created_at: string
    updated_at: string
}

export interface UserCashierSecret {
    userCashier: UserCashier
}

interface CashierContextType {
    loading: boolean
    initing: boolean
    error: string | null
    userCashier: UserCashier | null
}

const CashierContext = createContext<CashierContextType | null>(null)

export function CashierProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [initing, setIniting] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userFirebase: user, loading: fbloading, auth } = useFirebase()

    const [innerSecret, setInnerSecret] = useState<UserCashierSecret | null>(null)

    const tryLoadUserCashier = async (user: User) => {
        setLoading(true)
        const idToken = await user.getIdToken(true)
        const userCashier = await loadThisUserAccount(idToken)
        setInnerSecret({ userCashier })
        setLoading(false)
    }

    useEffect(() => {
        if (fbloading) {
            console.log('Cashier hook: fbloading')
            return
        }
        if (!auth || !user) {
            console.log('Cashier hook: auth is null')
            return
        }
        try {
            tryLoadUserCashier(user)
        } catch (error) {
            console.error('Cashier hook: tryLoadUserCashier failed: ' + error)
            setError('Cashier hook: tryLoadUserCashier failed: ' + error)
        } finally {
            setIniting(false)
        }
    }, [fbloading, auth])


    return (
        <CashierContext.Provider value={{
            loading,
            initing,
            error,
            userCashier: innerSecret?.userCashier || null,
        }}>
            {children}
        </CashierContext.Provider>
    )
}

export function useCashier() {
    const context = useContext(CashierContext)
    if (!context) {
        throw new Error('useCashier must be used within a CashierProvider')
    }
    return context
}

// const CASHIER_URL = "http://localhost:8787" 
const CASHIER_URL = "https://cashier.permane.world"

async function loadThisUserAccount(jwt: string) {
    const result = await fetch(CASHIER_URL + "/my_account", {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        }
    })
    if (!result.ok) {
        throw new Error("Failed to load this user account")
    }
    const data = await result.json() as UserCashier
    return data
}