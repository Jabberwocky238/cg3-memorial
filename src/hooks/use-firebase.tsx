import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import { getAuth, GoogleAuthProvider, type UserCredential } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { 
    signInWithEmailAndPassword, 
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";
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
    return { user: result.user };
}

async function emailSignUp(email: string, password: string) {
    const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
}

async function googleSignIn() {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, credential };
}

export function useFirebase() {
    return {
        auth,
        user: auth.currentUser,
        emailSignIn,
        emailSignUp,
        googleSignIn,
    }
}