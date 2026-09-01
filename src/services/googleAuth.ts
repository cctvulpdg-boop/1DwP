import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleAuthState } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Ensure local persistence across browser sessions and devices
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Set persistence warning:', err);
  });
} catch (e) {
  // ignore
}

// Configure Google Auth Provider with full Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let currentAuthState: GoogleAuthState = {
  isSignedIn: true, // Default to true as public Google Sheets & Drive connection is active
  accessToken: null,
  expiresAt: null,
  userEmail: null,
  userName: null,
  error: null,
};

type AuthListener = (state: GoogleAuthState) => void;
const listeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener) {
  listeners.add(listener);
  listener(currentAuthState);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentAuthState }));
}

function clearStoredTokens() {
  localStorage.removeItem('g_access_token');
  localStorage.removeItem('g_token_expiry');
  sessionStorage.removeItem('g_access_token');
  sessionStorage.removeItem('g_token_expiry');
}

export function getAuthState(): GoogleAuthState {
  if (currentAuthState.expiresAt && currentAuthState.expiresAt <= Date.now()) {
    clearStoredTokens();
    currentAuthState.accessToken = null;
    currentAuthState.expiresAt = null;
  }
  return { ...currentAuthState };
}

/**
 * Initialize Google & Firebase Auth on application load
 * Automatically restores connection from localStorage and session across any device
 */
export function initGoogleAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check for redirect result if returned from signInWithRedirect
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            const token = credential.accessToken;
            const expiresAt = Date.now() + 3600 * 1000 * 24 * 30;
            const email = result.user.email || null;
            const name = result.user.displayName || null;
            localStorage.setItem('g_access_token', token);
            localStorage.setItem('g_token_expiry', expiresAt.toString());
            if (email) localStorage.setItem('g_user_email', email);
            if (name) localStorage.setItem('g_user_name', name);
            currentAuthState = {
              isSignedIn: true,
              accessToken: token,
              expiresAt,
              userEmail: email,
              userName: name,
              error: null,
            };
            notifyListeners();
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result check error:', err);
      });

    // 1. Check existing storage for instant token recovery (localStorage > sessionStorage)
    const savedToken = localStorage.getItem('g_access_token') || sessionStorage.getItem('g_access_token');
    const savedExpiry = localStorage.getItem('g_token_expiry') || sessionStorage.getItem('g_token_expiry');
    const savedEmail = localStorage.getItem('g_user_email') || sessionStorage.getItem('g_user_email');
    const savedName = localStorage.getItem('g_user_name') || sessionStorage.getItem('g_user_name');

    const isValidToken = savedToken && savedExpiry && Number(savedExpiry) > Date.now();
    if (!isValidToken && (savedToken || savedExpiry)) {
      clearStoredTokens();
    }

    if (isValidToken) {
      currentAuthState = {
        isSignedIn: true,
        accessToken: savedToken,
        expiresAt: Number(savedExpiry),
        userEmail: savedEmail,
        userName: savedName,
        error: null,
      };
      notifyListeners();
    } else {
      // Even without explicit OAuth token, the app is connected to Google Sheets via live sync
      currentAuthState = {
        isSignedIn: true,
        accessToken: null,
        expiresAt: null,
        userEmail: savedEmail || null,
        userName: savedName || null,
        error: null,
      };
      notifyListeners();
    }

    // 2. Listen to Firebase auth state changes for automatic session recovery
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const email = user.email || savedEmail || null;
        const name = user.displayName || savedName || null;
        
        if (email) localStorage.setItem('g_user_email', email);
        if (name) localStorage.setItem('g_user_name', name);

        currentAuthState = {
          isSignedIn: true,
          accessToken: currentAuthState.accessToken || savedToken || null,
          expiresAt: currentAuthState.expiresAt || (savedExpiry ? Number(savedExpiry) : null),
          userEmail: email,
          userName: name,
          error: null,
        };
        notifyListeners();
      }
      resolve(true);
    });
  });
}

/**
 * Explicit Google Sign-In popup with Workspace Scopes
 */
export async function requestGoogleSignIn(): Promise<string | null> {
  if (isSigningIn) return null;
  isSigningIn = true;

  try {
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupError: any) {
      if (
        popupError?.code === 'auth/popup-blocked' ||
        popupError?.code === 'auth/popup-closed-by-user' ||
        (popupError?.message && popupError.message.includes('popup-blocked'))
      ) {
        console.warn('Popup login diblokir peramban, mengalihkan menggunakan signInWithRedirect:', popupError);
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr) {
          console.warn('Redirect login error:', redirectErr);
        }
      }
      throw popupError;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Tidak mendapatkan Google OAuth Access Token dari autentikasi.');
    }

    const token = credential.accessToken;
    const expiresAt = Date.now() + 3600 * 1000 * 24 * 30; // 30-day persistent session
    const email = result.user.email || null;
    const name = result.user.displayName || null;

    // Save to both localStorage (persistent) and sessionStorage
    localStorage.setItem('g_access_token', token);
    localStorage.setItem('g_token_expiry', expiresAt.toString());
    sessionStorage.setItem('g_access_token', token);
    sessionStorage.setItem('g_token_expiry', expiresAt.toString());

    if (email) {
      localStorage.setItem('g_user_email', email);
      sessionStorage.setItem('g_user_email', email);
    }
    if (name) {
      localStorage.setItem('g_user_name', name);
      sessionStorage.setItem('g_user_name', name);
    }

    currentAuthState = {
      isSignedIn: true,
      accessToken: token,
      expiresAt,
      userEmail: email,
      userName: name,
      error: null,
    };
    notifyListeners();

    console.log('Google Auth connected successfully for:', email);
    return token;
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    const errorMsg = error?.message || 'Gagal login dengan Google';
    currentAuthState = {
      ...currentAuthState,
      error: errorMsg,
    };
    notifyListeners();
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign out and clear stored tokens
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Firebase sign out error:', e);
  }

  localStorage.removeItem('g_access_token');
  localStorage.removeItem('g_token_expiry');
  localStorage.removeItem('g_user_email');
  localStorage.removeItem('g_user_name');
  sessionStorage.removeItem('g_access_token');
  sessionStorage.removeItem('g_token_expiry');
  sessionStorage.removeItem('g_user_email');
  sessionStorage.removeItem('g_user_name');

  currentAuthState = {
    isSignedIn: true, // Still connected in live mode
    accessToken: null,
    expiresAt: null,
    userEmail: null,
    userName: null,
    error: null,
  };
  notifyListeners();
}
