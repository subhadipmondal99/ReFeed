import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import app from "./config";

// ================================
// FIREBASE SERVICES
// ================================

const auth = getAuth(app);
const db = getFirestore(app);

// ================================
// LOGIN
// ================================

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};

// ================================
// REGISTER
// ================================

export const registerUser = async ({
  name,
  email,
  phone,
  password,
  userType,
}) => {
  // Create Firebase Authentication account
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const user = userCredential.user;

  // Add display name to Firebase Authentication profile
  await updateProfile(user, {
    displayName: name,
  });

  // Save additional user information in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    phone,
    userType,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
};

// ================================
// LOGOUT
// ================================

export const logoutUser = async () => {
  await signOut(auth);
};

// ================================
// AUTH STATE
// ================================

export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ================================
// EXPORT FIREBASE SERVICES
// ================================

export { auth, db };