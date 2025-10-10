import { createContext, useContext, useEffect, useState } from "react"
import { useFirebase } from "./use-firebase"
import type { User } from "firebase/auth"


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

async function transfer(jwt: string, amount: number, toUid: string, fromUid: string) {
    const result = await fetch(CASHIER_URL + "/transfer", {
        method: "POST",
        body: JSON.stringify({
            "amount": amount,
            "to_uid": toUid,
            "from_uid": fromUid
        }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        }
    })
    return await result.text()
}

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
    transfer: (amount: number, toUid: string) => Promise<void>
}

const CashierContext = createContext<CashierContextType | null>(null)

export const ErrorCashier = {
    UserCashierNotFound: new Error("User cashier not found"),
    InvalidAmount: new Error("Invalid amount"),
    InsufficientBalance: new Error("Insufficient balance"),
    TransferFailed: new Error("Transfer failed"),
    SelfTransfer: new Error("Self transfer"),
}

export function CashierProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [initing, setIniting] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userFirebase, loading: fbloading, auth } = useFirebase()

    const [innerSecret, setInnerSecret] = useState<UserCashierSecret | null>(null)

    const tryLoadUserCashier = async (user: User) => {
        setLoading(true)
        const idToken = await user.getIdToken(true)
        const userCashier = await loadThisUserAccount(idToken)
        setInnerSecret({ userCashier })
        setLoading(false)
        return userCashier
    }

    useEffect(() => {
        if (fbloading) {
            console.log('Cashier hook: fbloading')
            return
        }
        if (!auth || !userFirebase) {
            console.log('Cashier hook: auth is null')
            return
        }
        try {
            tryLoadUserCashier(userFirebase).then(userCashier => {
                console.log('Cashier hook: userCashier', userCashier)
            })
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
            userCashier: innerSecret?.userCashier ?? null,
            transfer: async (amount: number, toUid: string) => {
                if (!innerSecret?.userCashier || !userFirebase) {
                    console.error("innerSecret?.userCashier || !userFirebase", innerSecret?.userCashier, userFirebase)
                    throw ErrorCashier.UserCashierNotFound
                }
                if (toUid === userFirebase.uid) {
                    console.error("toUid === userFirebase.uid", toUid)
                    throw ErrorCashier.SelfTransfer
                }
                if (amount <= 0) {
                    console.error("amount <= 0", amount)
                    throw ErrorCashier.InvalidAmount
                }
                if (amount > innerSecret.userCashier.balance_usd) {
                    console.error("amount > innerSecret.userCashier.balance_usd", amount, innerSecret.userCashier.balance_usd)
                    throw ErrorCashier.InsufficientBalance
                }
                const idToken = await userFirebase.getIdToken()
                await transfer(idToken, amount, toUid, userFirebase.uid)
            },
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
