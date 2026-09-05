import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, getDocs, getDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const coll = () => collection(db, "signature-projects");

/**
 * Saving must not depend on the security rules and the app shipping in step.
 * Rules are deployed by hand while the client ships from CI, so a client that
 * knows about `category` can briefly meet rules that don't. Rather than fail
 * the whole write — losing the list in front of the person — retry once
 * without the field. They keep their list; only the category waits.
 */
async function writeWithCategoryFallback(write, category) {
  try {
    return await write(category !== undefined ? { category } : {});
  } catch (error) {
    if (error?.code === "permission-denied" && category !== undefined) {
      console.warn("Save rejected with a category; retrying without it (rules may be behind).");
      return await write({});
    }
    throw error;
  }
}

/** Create a brand new list (does not overwrite older ones) */
export async function createProject({ userId, projectName, signatureNames, signatures, sport, category }) {
  const ref = await writeWithCategoryFallback(
    (categoryField) => addDoc(coll(), {
      userId,
      projectName,
      signatureNames,
      ...(signatures !== undefined ? { signatures } : {}),
      ...(sport !== undefined ? { sport } : {}),
      ...categoryField,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    category
  );
  return { id: ref.id };
}

/** Update an existing list by id */
export async function updateProject({ projectId, projectName, signatureNames, signatures, sport, category }) {
  const ref = doc(db, "signature-projects", projectId);
  await writeWithCategoryFallback(
    (categoryField) => updateDoc(ref, {
      ...(projectName !== undefined ? { projectName } : {}),
      ...(signatureNames !== undefined ? { signatureNames } : {}),
      ...(signatures !== undefined ? { signatures } : {}),
      ...(sport !== undefined ? { sport } : {}),
      ...categoryField,
      updatedAt: serverTimestamp(),
    }),
    category
  );
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
    // Lists saved before categories existed are autographs
    category: d.data().category || "Autographs",
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
    // Only the owner changes. Touching updatedAt would make a just-claimed
    // guest list look newer than everything the account already had.
    updateDoc(doc(db, "signature-projects", d.id), { userId: uid })
  ));
  localStorage.removeItem(ANON_KEY); // a fresh guest id is minted on next use
  return snap.size;
}
