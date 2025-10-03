import { initializeApp, type FirebaseApp } from 'firebase/app';
import { createContext, useContext } from 'react';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore/lite';
import { EmailAuthProvider, getAuth, GoogleAuthProvider, OAuthCredential, type Auth, type UserCredential } from 'firebase/auth';
import { getAnalytics, type Analytics } from "firebase/analytics";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
    const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const userid = result.user.uid;
    const token = await result.user.getIdToken();
    return { userid, token };
}

async function googleSignIn() {
    // Sign in using a redirect.
    
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    // The signed-in user info.
    const userid = result.user.uid;
    // This gives you a Facebook Access Token.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const jwt = await result.user.getIdToken();
    return { userid, jwt };
}

const firebaseContext = createContext<{
    app: FirebaseApp;
    analytics: Analytics;
    db: Firestore;
    auth: Auth;
}>({
    app,
    analytics,
    db,
    auth,
});

export const FirebaseProvider = firebaseContext.Provider;
export const useFirebase = () => useContext(firebaseContext);
export const firebaseValue = {
    app,
    analytics,
    db,
    auth,
};
