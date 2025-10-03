import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getDoc, doc, getFirestore, setDoc } from 'firebase/firestore/lite';
import { onAuthStateChanged, type User } from "firebase/auth"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    type UserCredential,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAaIFNTfCj5TH7iDE3pqwt6yTY7FcIUzs4",
    authDomain: "cg2-b8751.firebaseapp.com",
    projectId: "cg2-b8751",
    storageBucket: "cg2-b8751.firebasestorage.app",
    messagingSenderId: "340933287651",
    appId: "1:340933287651:web:ca5e162c2fd45177f7afd6",
    measurementId: "G-5DXDW8RXBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

async function emailSignIn(email: string, password: string) {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
}

async function emailSignUp(email: string, password: string) {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
}

async function googleSignIn() {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, credential };
}


interface UserContextType {
    user: User | null
    loading: boolean
}

export interface UserMetaInfo {
    displayName: string
    email: string
    photoURL: string
}

async function getUserMetaInfo(uid: string): Promise<UserMetaInfo> {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.data() as UserMetaInfo;
}

async function setUserMetaInfo(uid: string, displayName: string, email: string, photoURL: string) {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, { displayName, email, photoURL });
}   

const FirebaseContext = createContext<UserContextType | null>(null)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u: User | null) => {
            setUser(u)
            if (u && u.displayName && u.email && u.photoURL) {
                setUserMetaInfo(u.uid, u.displayName, u.email, u.photoURL)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [auth])

    const value = useMemo<UserContextType>(() => ({ user, loading }), [user, loading])

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    )
}

export function useFirebase() {
    const context = useContext(FirebaseContext)

    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return {
        auth,
        user: context.user,
        emailSignIn,
        emailSignUp,
        googleSignIn,
        signOut: () => signOut(auth),
        getUserMetaInfo,
        setUserMetaInfo,
    }
}

