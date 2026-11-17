import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Optional Firebase App Check when VITE_FIREBASE_APP_CHECK_KEY is configured
const appCheckKey = import.meta.env.VITE_FIREBASE_APP_CHECK_KEY || firebaseConfig.recaptchaSiteKey;
if (typeof window !== 'undefined' && appCheckKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // App Check skipped cleanly if unavailable
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Non-blocking connection probe
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

const VALID_ID_RE = /^[a-zA-Z0-9_\-]+$/;
function sanitizeId(raw: string, fallback = 'item'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 64);
  return VALID_ID_RE.test(cleaned) && cleaned.length > 0 ? cleaned : fallback;
}

function clampStr(val: unknown, max: number, fallback = ''): string {
  const s = String(val ?? fallback).trim();
  return (s || fallback).slice(0, max);
}

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  moharCoins: number;
  preferredTheme: 'dhoop' | 'raat';
  wishlistIds: string[];
}

export async function getPatronIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export async function completeRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export async function signInWithGooglePatron(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  containerId: string
): Promise<ConfirmationResult> {
  const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function signOutPatron(): Promise<void> {
  await signOut(auth);
}

export async function ensurePatronFirestoreProfile(
  user: User,
  localDefaults: { moharCoins: number; preferredTheme: 'dhoop' | 'raat'; wishlistIds: string[] }
): Promise<void> {
  const profilePath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;

  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const displayName = clampStr(
      user.displayName || user.email?.split('@')[0] || user.phoneNumber,
      100,
      'Patron'
    );
    const photoURL = user.photoURL ? clampStr(user.photoURL, 500) : undefined;

    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        moharCoins: Math.max(0, Math.min(1000000, Math.trunc(localDefaults.moharCoins))),
        preferredTheme: localDefaults.preferredTheme,
        wishlistIds: localDefaults.wishlistIds.slice(0, 100).map((id) => clampStr(id, 64)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload);
    } else {
      const updates: Record<string, unknown> = {
        displayName,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) updates.photoURL = photoURL;
      await updateDoc(ref, updates);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  if (user.email || user.phoneNumber) {
    try {
      const privRef = doc(db, 'users', user.uid, 'private', 'info');
      const privSnap = await getDoc(privRef);
      const email = clampStr(user.email || '', 160);
      const phone = user.phoneNumber ? clampStr(user.phoneNumber, 24) : undefined;
      if (!privSnap.exists()) {
        await setDoc(privRef, {
          uid: user.uid,
          email,
          ...(phone ? { phone } : {}),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privRef, {
          email,
          ...(phone ? { phone } : {}),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

export async function deletePatronFirestoreProfile(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'private', 'info'));
  } catch {
    // Continue
  }
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch {
    // Continue
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: FirestoreUserProfile) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onData({
        uid: String(d.uid ?? uid),
        displayName: String(d.displayName ?? 'Patron'),
        photoURL: typeof d.photoURL === 'string' ? d.photoURL : undefined,
        moharCoins: typeof d.moharCoins === 'number' ? d.moharCoins : 150,
        preferredTheme: d.preferredTheme === 'raat' ? 'raat' : 'dhoop',
        wishlistIds: Array.isArray(d.wishlistIds) ? d.wishlistIds.map(String) : [],
      });
    },
    (error) => {
      console.warn('User profile listener warning:', path, error.message);
    }
  );
}

export async function syncWishlistToFirestore(uid: string, wishlistIds: string[]): Promise<void> {
  const path = `users/${uid}`;
  try {
    const bounded = Array.from(new Set(wishlistIds)).slice(0, 100).map((id) => clampStr(id, 64));
    await updateDoc(doc(db, 'users', uid), {
      wishlistIds: bounded,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncThemeToFirestore(uid: string, preferredTheme: 'dhoop' | 'raat'): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      preferredTheme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
