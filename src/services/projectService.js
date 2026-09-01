import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, getDocs, getDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const coll = () => collection(db, "signature-projects");

/** Create a brand new list (does not overwrite older ones) */
export async function createProject({ userId, projectName, signatureNames, signatures, sport }) {
  const ref = await addDoc(coll(), {
    userId,
    projectName,
    signatureNames,
    ...(signatures !== undefined ? { signatures } : {}),
    ...(sport !== undefined ? { sport } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id };
}

/** Update an existing list by id */
export async function updateProject({ projectId, projectName, signatureNames, signatures, sport }) {
  const ref = doc(db, "signature-projects", projectId);
  await updateDoc(ref, {
    ...(projectName !== undefined ? { projectName } : {}),
    ...(signatureNames !== undefined ? { signatureNames } : {}),
    ...(signatures !== undefined ? { signatures } : {}),
    ...(sport !== undefined ? { sport } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** Load all lists for the current user (newest first) */
export async function getUserProjects({ userId }) {
  const q = query(
    coll(),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate()
  }));
}

/** Load a single list by id (to open it) */
export async function getProjectById(projectId) {
  const ref = doc(db, "signature-projects", projectId);
  const d = await getDoc(ref);
  if (d.exists()) {
    return { 
      id: d.id, 
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
      updatedAt: d.data().updatedAt?.toDate()
    };
  }
  return null;
}

/** Optional: delete a list */
export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "signature-projects", projectId));
}

const ANON_KEY = 'baseball-sigs-user-id';

// Anonymous per-browser identity, used only while signed out
export const getAnonymousUserId = () => {
  let userId = localStorage.getItem(ANON_KEY);
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(ANON_KEY, userId);
  }
  return userId;
};

// Signed in → the Firebase account uid (projects follow the account across
// devices); signed out → the legacy per-browser anonymous id.
export const getUserId = () => auth.currentUser?.uid || getAnonymousUserId();

/**
 * Resolve the owner id to query with, after Firebase has restored any
 * persisted session. Without this wait, a query fired during page load would
 * fall back to the anonymous id and show the wrong account's projects.
 */
export async function resolveUserId() {
  await auth.authStateReady?.();
  return getUserId();
}

/**
 * Adopt projects this browser saved anonymously into the signed-in account,
 * so they show up everywhere the user signs in. Returns how many moved.
 *
 * The anonymous id is retired afterwards: it identifies "designs made on this
 * browser while logged out", and once an account claims them a later account
 * must not inherit that same guest history.
 */
export async function migrateAnonymousProjects(uid) {
  const anonId = localStorage.getItem(ANON_KEY);
  if (!anonId || anonId === uid) return 0;
  const snap = await getDocs(query(coll(), where("userId", "==", anonId)));
  await Promise.all(snap.docs.map(d =>
    updateDoc(doc(db, "signature-projects", d.id), { userId: uid, updatedAt: serverTimestamp() })
  ));
  localStorage.removeItem(ANON_KEY); // a fresh guest id is minted on next use
  return snap.size;
}
