import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_NAME = 'signature-projects';

// Generate a simple user ID (in production, you'd use proper auth)
const getUserId = () => {
  let userId = localStorage.getItem('baseball-sigs-user-id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('baseball-sigs-user-id', userId);
  }
  return userId;
};

// Save a new project
export const saveProject = async (projectName, signatureNames) => {
  try {
    const userId = getUserId();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      projectName,
      signatureNames,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing project
export const updateProject = async (projectId, projectName, signatureNames) => {
  try {
    const projectRef = doc(db, COLLECTION_NAME, projectId);
    await updateDoc(projectRef, {
      projectName,
      signatureNames,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, projectId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
};

// Load all projects for the current user
export const loadUserProjects = async () => {
  try {
    const userId = getUserId();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });
    
    return { success: true, projects };
  } catch (error) {
    console.error('Error loading projects:', error);
    return { success: false, error: error.message, projects: [] };
  }
};

// Load a specific project
export const loadProject = async (projectId) => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, projectId));
    
    if (docSnap.exists()) {
      return {
        success: true,
        project: {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        }
      };
    } else {
      return { success: false, error: 'Project not found' };
    }
  } catch (error) {
    console.error('Error loading project:', error);
    return { success: false, error: error.message };
  }
};