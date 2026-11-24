import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  sanitizeCreationFields,
  sanitizeUserProfileFields,
} from '../utils/videoValidation';

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  credits: number;
  planId: 'free' | 'pro' | 'live' | 'max';
}

export interface PersistedCreation {
  id: string;
  userId: string;
  mode: 'text-to-video' | 'image-to-video' | 'mix' | 'multi-editor' | 'pinoc' | 'live';
  title: string;
  prompt: string;
  model: string;
  aspectRatio: '16:9' | '9:16';
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  creditsUsed: number;
  mediaType: 'video' | 'image';
  videoId?: string;
  outputUrl: string;
  interactionId?: string;
  errorMessage?: string;
  createdAtIso: string;
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  profile: UserProfileRecord | null;
  creations: PersistedCreation[];
  authError: string | null;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  createPersistedCreation: (params: {
    id: string;
    mode: PersistedCreation['mode'];
    title: string;
    prompt: string;
    model: string;
    aspectRatio: '16:9' | '9:16';
    creditsUsed: number;
    mediaType: 'video' | 'image';
    status?: 'rendering' | 'completed' | 'failed';
    outputUrl: string;
    videoId?: string;
    interactionId?: string;
  }) => Promise<void>;
  completePersistedCreation: (
    creationId: string,
    update: {
      status: 'completed' | 'failed';
      outputUrl: string;
      videoId?: string;
      interactionId?: string;
      errorMessage?: string;
    }
  ) => Promise<void>;
  deletePersistedCreation: (creationId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [creations, setCreations] = useState<PersistedCreation[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Sync Firebase Auth state & ensure user document exists in Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        setProfile(null);
        setCreations([]);
        return;
      }

      const userPath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);

      try {
        const snap = await getDoc(userRef);
        const clean = sanitizeUserProfileFields({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });

        if (!snap.exists()) {
          await setDoc(userRef, {
            ...clean,
            credits: 80,
            planId: 'free',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = snap.data();
          if (
            existingData.displayName !== clean.displayName ||
            (clean.photoUrl && existingData.photoUrl !== clean.photoUrl)
          ) {
            await updateDoc(userRef, {
              displayName: clean.displayName,
              ...(clean.photoUrl ? { photoUrl: clean.photoUrl } : {}),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
    });

    return () => unsub();
  }, []);

  // Attach real-time Firestore listeners only when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const userPath = `users/${user.uid}`;
    const creationsPath = `users/${user.uid}/creations`;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        setProfile({
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoUrl: data.photoUrl,
          credits: typeof data.credits === 'number' ? data.credits : 80,
          planId: data.planId || 'free',
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    const creationsQuery = query(
      collection(db, 'users', user.uid, 'creations'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubCreations = onSnapshot(
      creationsQuery,
      (snapshot) => {
        const items: PersistedCreation[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdTs = data.createdAt?.toDate?.();
          return {
            id: data.id || d.id,
            userId: data.userId,
            mode: data.mode,
            title: data.title,
            prompt: data.prompt,
            model: data.model,
            aspectRatio: data.aspectRatio === '9:16' ? '9:16' : '16:9',
            status: data.status,
            creditsUsed: typeof data.creditsUsed === 'number' ? data.creditsUsed : 0,
            mediaType: data.mediaType === 'video' ? 'video' : 'image',
            videoId: data.videoId,
            outputUrl: data.outputUrl,
            interactionId: data.interactionId,
            errorMessage: data.errorMessage,
            createdAtIso: createdTs ? createdTs.toISOString() : new Date().toISOString(),
          };
        });
        setCreations(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, creationsPath);
      }
    );

    return () => {
      unsubProfile();
      unsubCreations();
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(msg);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const createPersistedCreation = useCallback(
    async (params: {
      id: string;
      mode: PersistedCreation['mode'];
      title: string;
      prompt: string;
      model: string;
      aspectRatio: '16:9' | '9:16';
      creditsUsed: number;
      mediaType: 'video' | 'image';
      status?: 'rendering' | 'completed' | 'failed';
      outputUrl: string;
      videoId?: string;
      interactionId?: string;
    }) => {
      if (!user) return;
      const creationPath = `users/${user.uid}/creations/${params.id}`;
      const clean = sanitizeCreationFields({
        id: params.id,
        userId: user.uid,
        title: params.title,
        prompt: params.prompt,
        model: params.model,
        outputUrl: params.outputUrl,
        videoId: params.videoId,
        interactionId: params.interactionId,
      });

      const currentCredits = profile?.credits ?? 80;
      const nextCredits = Math.max(0, currentCredits - Math.max(0, Math.round(params.creditsUsed)));

      try {
        // Atomic batch satisfies Pillar 7 (getAfter user.updatedAt == request.time)
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        const creationRef = doc(db, 'users', user.uid, 'creations', clean.id);

        batch.update(userRef, {
          credits: nextCredits,
          updatedAt: serverTimestamp(),
        });

        batch.set(creationRef, {
          ...clean,
          mode: params.mode,
          aspectRatio: params.aspectRatio,
          status: params.status || 'completed',
          creditsUsed: Math.max(0, Math.min(100, Math.round(params.creditsUsed))),
          mediaType: params.mediaType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, creationPath);
      }
    },
    [user, profile?.credits]
  );

  const completePersistedCreation = useCallback(
    async (
      creationId: string,
      update: {
        status: 'completed' | 'failed';
        outputUrl: string;
        videoId?: string;
        interactionId?: string;
        errorMessage?: string;
      }
    ) => {
      if (!user) return;
      const creationPath = `users/${user.uid}/creations/${creationId}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'creations', creationId), {
          status: update.status,
          outputUrl: update.outputUrl.slice(0, 500),
          ...(update.videoId ? { videoId: update.videoId.slice(0, 128) } : {}),
          ...(update.interactionId ? { interactionId: update.interactionId.slice(0, 200) } : {}),
          ...(update.errorMessage ? { errorMessage: update.errorMessage.slice(0, 400) } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, creationPath);
      }
    },
    [user]
  );

  const deletePersistedCreation = useCallback(
    async (creationId: string) => {
      if (!user) return;
      const creationPath = `users/${user.uid}/creations/${creationId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'creations', creationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, creationPath);
      }
    },
    [user]
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        profile,
        creations,
        authError,
        signingIn,
        signInWithGoogle,
        logOut,
        createPersistedCreation,
        completePersistedCreation,
        deletePersistedCreation,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside a FirebaseProvider');
  }
  return ctx;
}
