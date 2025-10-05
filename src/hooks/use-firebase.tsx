import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { OAuthCredential, onAuthStateChanged, type Auth, type User } from "firebase/auth"
import { createContext, useContext, useEffect, useRef, useState } from "react"

import {
    getAuth,
    signOut,
    GoogleAuthProvider,
} from 'firebase/auth';
import { emailSignIn, emailSignUp, googleSignIn, getUserMetaInfo, updateUserMetaInfo, getSecretArweaveKey, setSecretArweaveKey } from './use-firebase-inner';
import type { JWKInterface } from 'arweave/web/lib/wallet';
import { LoadingPage } from './use-theme';

const DEFAULT_AVATAR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="

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

    user: UserMetaInfo | null
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

const FirebaseContext = createContext<UserContextType | null>(null)

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const appRef = useRef<FirebaseApp | null>(null)
    const dbRef = useRef<Firestore | null>(null)
    const authRef = useRef<Auth | null>(null)
    const [userMeta, setUserMeta] = useState<UserMetaInfo | null>(null)
    const googleProvider = new GoogleAuthProvider();

    const [loading, setLoading] = useState(true)
    const [initing, setIniting] = useState(true)

    useEffect(() => {
        // Initialize Firebase
        if (appRef.current) return
        appRef.current = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(appRef.current);
        authRef.current = getAuth(appRef.current);
    }, [])

    const _emailSignIn = async (email: string, password: string) => {
        return await emailSignIn(authRef.current!, email, password)
    }
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
            await _updateUserMeta(userMeta.uid, userMeta)
        }
    }

    useEffect(() => {
        if (!authRef.current || !dbRef.current) return
        setIniting(false)
        const unsubscribe = onAuthStateChanged(authRef.current, async (u: User | null) => {
            setLoading(true)
            if (u) {
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
            user: userMeta,
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

