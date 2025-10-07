import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { OAuthCredential, updateProfile, onAuthStateChanged, type Auth, type User, sendEmailVerification, browserLocalPersistence, setPersistence } from "firebase/auth"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import {
    getAuth,
    signOut,
    GoogleAuthProvider,
} from 'firebase/auth';
import { emailSignIn, emailSignUp, googleSignIn, getUserMetaInfo, updateUserMetaInfo, getSecretArweaveKey, setSecretArweaveKey } from './use-firebase-inner';
import type { JWKInterface } from 'arweave/web/lib/wallet';
import { LoadingPage } from './use-theme';
import { useNavigate } from 'react-router-dom';
import { useApi } from './use-backend';

export const DEFAULT_AVATAR = "https://cdn4.iconfinder.com/data/icons/glyphs/24/icons_user-1024.png"

const firebaseConfig = {
    apiKey: "AIzaSyAaIFNTfCj5TH7iDE3pqwt6yTY7FcIUzs4",
    authDomain: "cg2-b8751.firebaseapp.com",
    projectId: "cg2-b8751",
    storageBucket: "cg2-b8751.firebasestorage.app",
    messagingSenderId: "340933287651",
    appId: "1:340933287651:web:ca5e162c2fd45177f7afd6",
    measurementId: "G-5DXDW8RXBR"
};

interface UserContextType {
    loading: boolean

    auth: Auth | null
    user: UserMetaInfo | null
    userCashier: UserCashier | null
    setUserMeta: (userMeta: UserMetaInfo | null) => Promise<void>
    getUserMeta: (uid: string) => Promise<UserMetaInfo | null>
    updateUserMeta: (uid: string, userMeta: UserMetaInfo) => Promise<void>

    emailSignIn: (email: string, password: string) => Promise<{ user: User }>
    emailSignUp: (email: string, password: string) => Promise<{ user: User }>
    googleSignIn: () => Promise<{ user: User, credential: OAuthCredential | null }>
    signOut: () => Promise<void>

    getSecretArweaveKey: (uid: string) => Promise<JWKInterface | null>
    setSecretArweaveKey: (uid: string, key: JWKInterface) => Promise<void>
}

export interface UserMetaInfo {
    uid: string
    displayName: string
    email: string
    photoURL: string
    arweaveAddress?: string
    solanaAddress?: string
}

export interface UserCashier {
    uid_firebase: string
    balance_usd: number
    misc: string
    created_at: string
    updated_at: string
}

const FirebaseContext = createContext<UserContextType | null>(null)

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const appRef = useRef<FirebaseApp | null>(null)
    const dbRef = useRef<Firestore | null>(null)
    const authRef = useRef<Auth | null>(null)
    const [userMeta, setUserMeta] = useState<UserMetaInfo | null>(null)
    const [userCashier, setUserCashier] = useState<UserCashier | null>(null)
    const googleProvider = new GoogleAuthProvider();
    const navigate = useNavigate()
    const { loadThisUserAccount } = useApi()

    const [loading, setLoading] = useState(true)
    const [initing, setIniting] = useState(true)

    useEffect(() => {
        // Initialize Firebase
        if (appRef.current) return
        appRef.current = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(appRef.current);
        authRef.current = getAuth(appRef.current);
        authRef.current.useDeviceLanguage();
        setPersistence(authRef.current, browserLocalPersistence);
    }, [])


    const _emailSignUp = async (email: string, password: string) => {
        return await emailSignUp(authRef.current!, email, password)
    }
    const _googleSignIn = async () => {
        return await googleSignIn(authRef.current!, googleProvider)
    }
    const _signOut = async () => {
        await signOut(authRef.current!)
    }
    const _getUserMeta = async (uid: string) => {
        return await getUserMetaInfo(dbRef.current!, uid)
    }
    const _updateUserMeta = async (uid: string, userMeta: UserMetaInfo) => {
        await updateUserMetaInfo(dbRef.current!, uid, userMeta)
    }
    const _getSecretArweaveKey = async (uid: string) => {
        return await getSecretArweaveKey(dbRef.current!, uid)
    }
    const _setSecretArweaveKey = async (uid: string, key: JWKInterface) => {
        await setSecretArweaveKey(dbRef.current!, uid, key)
    }

    const _setUserMeta = async (userMeta: UserMetaInfo | null) => {
        setUserMeta(userMeta)
        if (userMeta) {
            console.log('setUserMeta', userMeta)
            await _updateUserMeta(userMeta.uid, userMeta)
            await updateProfile(authRef.current!.currentUser!, {
                displayName: userMeta.displayName || `user-${userMeta.uid.slice(0, 4)}`,
                photoURL: userMeta.photoURL || DEFAULT_AVATAR,
            })
        }
    }
    const _emailSignIn = async (email: string, password: string) => {
        const { user } = await emailSignIn(authRef.current!, email, password)
        await authRef.current?.currentUser?.reload()
        if (authRef.current?.currentUser?.emailVerified !== true) {
            await sendEmailVerification(user);
            await signOut(authRef.current!);
            throw new Error('邮箱未验证，请先完成邮箱验证，已发送验证邮件')
        }
        _setUserMeta({
            uid: user.uid,
            displayName: user.displayName || `user-${user.uid.slice(0, 4)}`,
            email: user.email || '',
            photoURL: user.photoURL || DEFAULT_AVATAR,
        })
        await navigate('/')
        return { user }
    }

    useEffect(() => {
        if (!authRef.current || !dbRef.current) return
        setIniting(false)
        const unsubscribe = onAuthStateChanged(authRef.current, async (u: User | null) => {
            setLoading(true)
            if (u) {
                if (u.emailVerified !== true) {
                    setUserMeta(null)
                    setLoading(false)
                    await navigate('/auth#login')
                    return
                }
                const userMeta = await _getUserMeta(u.uid)
                if (!userMeta) {
                    // 新用户
                    setUserMeta({
                        uid: u.uid,
                        displayName: u.displayName || `user-${u.uid.slice(0, 4)}`,
                        email: u.email || '',
                        photoURL: u.photoURL || DEFAULT_AVATAR,
                    })
                } else {
                    // 老用户
                    setUserMeta({
                        uid: u.uid,
                        displayName: u.displayName || userMeta.displayName,
                        email: u.email || userMeta.email,
                        photoURL: u.photoURL || userMeta.photoURL,
                    })
                }
                const idToken = await u.getIdToken(true)
                const userCashier = await loadThisUserAccount(idToken)
                console.log('userCashier', userCashier)
                setUserCashier(userCashier)
            } else {
                setUserMeta(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [authRef.current, dbRef.current])

    if (initing) {
        return <LoadingPage label="APP Initializing..." />
    }

    return (
        <FirebaseContext.Provider value={{
            loading,

            auth: authRef.current,
            user: userMeta,
            userCashier: userCashier,
            setUserMeta: _setUserMeta,
            getUserMeta: _getUserMeta,
            updateUserMeta: _updateUserMeta,

            emailSignIn: _emailSignIn,
            emailSignUp: _emailSignUp,
            googleSignIn: _googleSignIn,
            signOut: _signOut,

            getSecretArweaveKey: _getSecretArweaveKey,
            setSecretArweaveKey: _setSecretArweaveKey,
        }}>
            {/* <Profiler id="FirebaseProvider" onRender={(ID, phase, actualDuration, baseDuration, startTime, commitTime) => {
                console.log({ ID, phase, actualDuration, baseDuration, startTime, commitTime })
            }}> */}
            {children}
            {/* </Profiler> */}
        </FirebaseContext.Provider>
    )
}

export function useFirebase() {
    const context = useContext(FirebaseContext)

    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}

