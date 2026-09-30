import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyABUt-ffIRohPl4bU0bX6rrZQuuLGZKIUU",
  authDomain: "refeed-f370b.firebaseapp.com",
  projectId: "refeed-f370b",
  storageBucket: "refeed-f370b.firebasestorage.app",
  messagingSenderId: "531391830956",
  appId: "1:531391830956:web:3a14ba0a3699b33020b809"
};

const app = initializeApp(firebaseConfig);

export default app;