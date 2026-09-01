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

// Anonymous per-browser identity, used only while signed out
export const getAnonymousUserId = () => {
  let userId = localStorage.getItem('baseball-sigs-user-id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('baseball-sigs-user-id', userId);
  }
  return userId;
};

// Signed in → the Firebase account uid (projects follow the account across
// devices); signed out → the legacy per-browser anonymous id.
export const getUserId = () => auth.currentUser?.uid || getAnonymousUserId();

/**
 * Adopt projects this browser saved anonymously into the signed-in account,
 * so they show up everywhere the user signs in. Returns how many moved.
 */
export async function migrateAnonymousProjects(uid) {
  const anonId = localStorage.getItem('baseball-sigs-user-id');
  if (!anonId || anonId === uid) return 0;
  const snap = await getDocs(query(coll(), where("userId", "==", anonId)));
  await Promise.all(snap.docs.map(d =>
    updateDoc(doc(db, "signature-projects", d.id), { userId: uid, updatedAt: serverTimestamp() })
  ));
  return snap.size;
}
