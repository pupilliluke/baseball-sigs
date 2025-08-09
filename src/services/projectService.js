import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, getDocs, getDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

const coll = () => collection(db, "signature-projects");

/** Create a brand new list (does not overwrite older ones) */
export async function createProject({ userId, projectName, signatureNames }) {
  const ref = await addDoc(coll(), {
    userId,
    projectName,
    signatureNames,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id };
}

/** Update an existing list by id */
export async function updateProject({ projectId, projectName, signatureNames }) {
  const ref = doc(db, "signature-projects", projectId);
  await updateDoc(ref, {
    ...(projectName !== undefined ? { projectName } : {}),
    ...(signatureNames !== undefined ? { signatureNames } : {}),
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

// Generate a simple user ID (in production, you'd use proper auth)
export const getUserId = () => {
  let userId = localStorage.getItem('baseball-sigs-user-id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('baseball-sigs-user-id', userId);
  }
  return userId;
};
