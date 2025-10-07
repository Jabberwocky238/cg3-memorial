import { getDoc, doc, setDoc, updateDoc, Firestore } from 'firebase/firestore/lite';
import {
    type Auth,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    type UserCredential,
    setPersistence,
    browserLocalPersistence,
    sendEmailVerification,
    fetchSignInMethodsForEmail,
    signOut,
    type UserInfo,
} from 'firebase/auth';

async function emailSignIn(auth: Auth, email: string, password: string) {
    const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    await result.user.reload();
    return { user: result.user };
}

async function emailSignUp(auth: Auth, email: string, password: string) {
    const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    await result.user.reload();
    await sendEmailVerification(result.user, {
        url: `${window.location.origin}/`,
        handleCodeInApp: false,
    });
    await signOut(auth);
    return { user: result.user };
}

async function googleSignIn(auth: Auth, googleProvider: GoogleAuthProvider) {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, credential };
}

export {
    emailSignIn,    
    emailSignUp,
    googleSignIn,
}

/// ##################### Arweave #########################

async function META_getFirebase<T>(db: Firestore, store: string, uid: string): Promise<T | null> {
    const objRef = doc(db, store, uid);
    const obj = await getDoc(objRef);
    if (obj.exists()) {
        return obj.data() as T
    }
    return null
}

async function META_updateFirebase<T extends Record<string, unknown>>(db: Firestore, store: string, uid: string, data: T) {
    const objRef = doc(db, store, uid);
    const obj = await getDoc(objRef);
    if (!obj.exists()) {
        await setDoc(objRef, data);
        return;
    }
    await updateDoc(objRef, data);
}

async function getFirebaseUser(db: Firestore, uid: string): Promise<UserInfo | null> {
    return await META_getFirebase<UserInfo>(db, 'users', uid)
}

async function setFirebaseUser(db: Firestore, uid: string, data: {
    displayName?: string
    photoURL?: string
}) {
    return await META_updateFirebase<Record<string, any>>(db, 'users', uid, data)
}

async function getFirebaseSecret(db: Firestore, uid: string): Promise<Record<string, unknown> | null> {
    return await META_getFirebase<Record<string, unknown>>(db, 'secrets', uid)
}

async function setFirebaseSecret(db: Firestore, uid: string, data: Record<string, unknown>) {
    return await META_updateFirebase<Record<string, unknown>>(db, 'secrets', uid, data)
}

async function getFirebasePublic(db: Firestore, uid: string): Promise<Record<string, unknown> | null> {
    return await META_getFirebase<Record<string, unknown>>(db, 'public', uid)
}

async function setFirebasePublic(db: Firestore, uid: string, data: Record<string, unknown>) {
    return await META_updateFirebase<Record<string, unknown>>(db, 'public', uid, data)
}

export {
    getFirebaseUser,
    setFirebaseUser,
    getFirebaseSecret,
    setFirebaseSecret,
    getFirebasePublic,
    setFirebasePublic,
}
