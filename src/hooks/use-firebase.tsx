import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { OAuthCredential, updateProfile, onAuthStateChanged, type Auth, type User, sendEmailVerification, browserLocalPersistence, setPersistence, type UserInfo, type UserCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import {
    getAuth,
    signOut,
    GoogleAuthProvider,
} from 'firebase/auth';
import {
    getFirebaseUser,
    setFirebaseUser,
    setFirebaseSecret,
    getFirebasePublic,
    setFirebasePublic,
    getFirebaseSecret,
} from './use-firebase-inner';
import { LoadingPage } from './use-loading';
import { useNavigate } from 'react-router-dom';
import { EasyError } from './use-error';

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
    auth: Auth | null
    userFirebase: User | null

    setUserFirebase: (uid: string, userFirebase: {
        displayName?: string
        photoURL?: string
    }) => Promise<void>
    getUserFirebase: (uid: string) => Promise<UserInfo | null>

    // Auth
    emailSignIn: (email: string, password: string) => Promise<{ user: User }>
    emailSignUp: (email: string, password: string) => Promise<{ user: User }>
    googleSignIn: () => Promise<{ user: User, credential: OAuthCredential | null }>
    signOut: () => Promise<void>

    getFirebaseSecret: (uid: string) => Promise<Record<string, unknown> | null>
    setFirebaseSecret: (uid: string, data: Record<string, unknown>) => Promise<void>
    getFirebasePublic: (uid: string) => Promise<Record<string, unknown> | null>
    setFirebasePublic: (uid: string, data: Record<string, unknown>) => Promise<void>
}

const FirebaseContext = createContext<UserContextType | null>(null)

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const appRef = useRef<FirebaseApp | null>(null)
    const dbRef = useRef<Firestore | null>(null)
    const authRef = useRef<Auth | null>(null)

    const googleProvider = new GoogleAuthProvider();
    const navigate = useNavigate()

    useEffect(() => {
        // Initialize Firebase
        console.log('Firebase: Initializing Firebase app...')
        if (appRef.current) {
            console.log('Firebase: Firebase app already initialized')
            return
        }
        appRef.current = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(appRef.current);
        authRef.current = getAuth(appRef.current);
        authRef.current.useDeviceLanguage();
        setPersistence(authRef.current, browserLocalPersistence);
    }, [])


    const _emailSignUp = async (email: string, password: string) => {
        if (!authRef.current) throw new EasyError('Firebase [emailSignUp]: Firebase 未初始化')
        const result: UserCredential = await createUserWithEmailAndPassword(authRef.current, email, password);
        await result.user.reload();
        await sendEmailVerification(result.user, {
            url: `${window.location.origin}/`,
            handleCodeInApp: false,
        });
        await signOut(authRef.current);
        return { user: result.user };
    }
    const _signOut = async () => {
        await signOut(authRef.current!)
        await authRef.current?.currentUser?.reload()
    }
    const _getUserFirebase = async (uid: string) => {
        return await getFirebaseUser(dbRef.current!, uid)
    }
    const _setUserFirebase = async (uid: string, userFirebase: {
        displayName?: string
        photoURL?: string
    }) => {
        const currentUser = authRef.current!.currentUser
        if (!currentUser) throw new EasyError('Firebase [setUserFirebase]: 用户未登录')
        const obj = {
            email: currentUser.email,
            displayName: userFirebase.displayName || currentUser.displayName || `user-${uid.slice(0, 4)}`,
            photoURL: userFirebase.photoURL || currentUser.photoURL || DEFAULT_AVATAR,
        }
        await updateProfile(currentUser, obj)
        await setFirebaseUser(dbRef.current!, uid, obj)
    }
    const _googleSignIn = async () => {
        if (!authRef.current) throw new EasyError('Firebase [googleSignIn]: Firebase 未初始化')
        const result: UserCredential = await signInWithPopup(authRef.current, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;
        await authRef.current?.currentUser?.reload()
        await _setUserFirebase(user.uid, {})
        await navigate('/')
        return { user, credential }
    }
    const _emailSignIn = async (email: string, password: string) => {
        const { user }: UserCredential = await signInWithEmailAndPassword(authRef.current!, email, password);
        await authRef.current?.currentUser?.reload()
        if (authRef.current?.currentUser?.emailVerified !== true) {
            await sendEmailVerification(user);
            await signOut(authRef.current!);
            throw new Error('邮箱未验证，请先完成邮箱验证，已发送验证邮件')
        }
        await _setUserFirebase(user.uid, {});
        await navigate('/')
        return { user }
    }

    // 用于退出登陆后的用户信息更新
    const [userFirebaseReactive, setUserFirebaseReactive] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (!authRef.current || !dbRef.current) return
        console.log('Firebase: Listening to user state changes...')
        const unsubscribe = onAuthStateChanged(authRef.current, async (u: User | null) => {
            try {
                setLoading(true)
                if (u) {
                    if (u.emailVerified !== true) {
                        await navigate('/auth#login')
                        return
                    }
                    await _setUserFirebase(u.uid, {})
                    setUserFirebaseReactive(u)
                } else {
                    setUserFirebaseReactive(null)
                }
                setLoading(false)
            } catch (error) {
                throw new EasyError('Firebase: 监听用户状态变化失败: ', error)
            } finally {
                setLoading(false)
            }
        })
        return unsubscribe
    }, [authRef.current, dbRef.current])

    if (loading) {
        return <LoadingPage label="APP Initializing..." />
    }

    return (
        <FirebaseContext.Provider value={{
            auth: authRef.current,
            userFirebase: userFirebaseReactive,
            setUserFirebase: _setUserFirebase,
            getUserFirebase: _getUserFirebase,

            emailSignIn: _emailSignIn,
            emailSignUp: _emailSignUp,
            googleSignIn: _googleSignIn,
            signOut: _signOut,

            getFirebaseSecret: async (uid: string) => {
                return await getFirebaseSecret(dbRef.current!, uid)
            },
            setFirebaseSecret: async (uid: string, data: Record<string, unknown>) => {
                await setFirebaseSecret(dbRef.current!, uid, data)
            },
            getFirebasePublic: async (uid: string) => {
                return await getFirebasePublic(dbRef.current!, uid)
            },
            setFirebasePublic: async (uid: string, key: Record<string, unknown>) => {
                await setFirebasePublic(dbRef.current!, uid, key)
            },
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

