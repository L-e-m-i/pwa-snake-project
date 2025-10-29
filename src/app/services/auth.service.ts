import { inject, Injectable } from '@angular/core';
import {
    Auth,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    user,
    UserCredential,
} from '@angular/fire/auth';
import { collection, doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { User as UserModel } from '../models/user';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly auth = inject(Auth);
    private readonly firestore = inject(Firestore);


    readonly user = toSignal(user(this.auth));

    constructor() {
        this.setSessionStoragePersistence();
    }

    private setSessionStoragePersistence(): void {
        setPersistence(this.auth, browserSessionPersistence);
    }

    login(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    async googleLogin(): Promise<UserCredential> {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(this.auth, provider);
        const user = userCredential.user;

        const userDocRef = doc(this.firestore, `Users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            await this.createUserData(user.uid, {
                id: user.uid,
                email: user.email || '',
                username: user.displayName || 'Google User',
            });
        }
        return userCredential;
    }

    private createUserData(uid: string, userData: Partial<UserModel>) {
        const userRef = doc(collection(this.firestore, 'Users'), uid);
        return setDoc(userRef, userData);
    }

    async signUp(
        email: string,
        password: string,
        userData: Partial<UserModel>
    ): Promise<UserCredential> {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        await this.createUserData(userCredential.user.uid, {
            ...userData,
            id: userCredential.user.uid,
            email: email,
            username: userData.username,
        });

        return userCredential;
    }

    logout(): Promise<void> {
        return signOut(this.auth);
    }
}