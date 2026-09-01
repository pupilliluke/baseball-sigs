import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { migrateAnonymousProjects } from "./projectService";

/** Subscribe to auth state; returns the unsubscribe function. */
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Google sign-in. On success, adopts any projects this browser saved
 * anonymously into the signed-in account so they follow the user.
 * Returns { user, migrated }.
 */
export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  let migrated = 0;
  try {
    migrated = await migrateAnonymousProjects(credential.user.uid);
  } catch (error) {
    console.error("Anonymous project migration failed:", error);
  }
  return { user: credential.user, migrated };
}

export function signOutUser() {
  return signOut(auth);
}

/** Human-readable message for sign-in failures. Returns null for benign cancellations. */
export function signInErrorMessage(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // user changed their mind — not an error
    case "auth/popup-blocked":
      return "The sign-in popup was blocked — allow popups for this site and try again.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Google sign-in isn't enabled for this project yet — enable the Google provider in the Firebase console.";
    case "auth/network-request-failed":
      return "Couldn't reach Google — check your connection and try again.";
    default:
      return "Sign-in failed — please try again.";
  }
}
