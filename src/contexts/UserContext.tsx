import { onAuthStateChanged } from "firebase/auth"
import { createContext, useContext, useEffect } from "react"
import { useFirebase } from "@/hooks/use-firebase"

interface UserContextType {}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { auth } = useFirebase()

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (u) {
                
            } else {
                
            }
        })
    }, [auth])

    return (
        <UserContext.Provider value={{}}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}