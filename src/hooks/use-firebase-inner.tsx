import { getDoc, doc, setDoc, updateDoc, Firestore } from 'firebase/firestore/lite';
import type { JWKInterface } from 'arweave/node/lib/wallet';
import {
    type Auth,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    type UserCredential,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import type { UserMetaInfo } from './use-firebase';


async function emailSignIn(auth: Auth, email: string, password: string) {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
}

async function emailSignUp(auth: Auth, email: string, password: string) {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
}

async function googleSignIn(auth: Auth, googleProvider: GoogleAuthProvider) {
    await setPersistence(auth, browserLocalPersistence);
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, credential };
}

export {
    emailSignIn,
    emailSignUp,
    googleSignIn,
}

/// ##################### User Meta #########################

async function getUserMetaInfo(db: Firestore, uid: string): Promise<UserMetaInfo | null> {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as UserMetaInfo
    }
    return null
}

async function updateUserMetaInfo(db: Firestore, uid: string, data: Record<string, any>) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
}

export {
    getUserMetaInfo,
    updateUserMetaInfo,
}

/// ##################### Arweave #########################

function parseArweaveKey(key: Record<string, unknown>): JWKInterface | null {
    if (!key) {
        return null
    }
    const COMPONENTS = ['e', 'n', 'd', 'p', 'q', 'dp', 'dq', 'qi']
    const components = COMPONENTS.map(component => key[component])
    if (components.some(component => component === undefined)) {
        return null
    }
    return {
        kty: key.kty,
        e: key.e,
        n: key.n,

        d: key.d,
        p: key.p,
        q: key.q,
        dp: key.dp,
        dq: key.dq,
        qi: key.qi,
    } as JWKInterface
}

async function getSecretArweaveKey(db: Firestore, uid: string): Promise<JWKInterface | null> {
    console.log(uid)
    const userDocRef = doc(db, 'secrets', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return parseArweaveKey(userDoc.data() as Record<string, unknown>)
    }
    return null
}

async function setSecretArweaveKey(db: Firestore, uid: string, key: JWKInterface) {
    const userDocRef = doc(db, 'secrets', uid);
    await setDoc(userDocRef, key);
}

export {
    getSecretArweaveKey,
    setSecretArweaveKey,
}

/// ##################### Solana #########################
