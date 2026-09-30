import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./auth";

export const addDocument = async (
  collectionName,
  data
) => {
  const ref = await addDoc(
    collection(db, collectionName),
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return ref.id;
};

export const getDocument = async (
  collectionName,
  documentId
) => {
  const ref = doc(
    db,
    collectionName,
    documentId
  );

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const updateDocument = async (
  collectionName,
  documentId,
  data
) => {
  const ref = doc(
    db,
    collectionName,
    documentId
  );

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getCollection = async (
  collectionName
) => {
  const snapshot = await getDocs(
    collection(db, collectionName)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};