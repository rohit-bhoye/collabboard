import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDFF3T4ivRoKsNAlKgCeI0S_UURJx0DDlY",
    authDomain: "collabboard-00.firebaseapp.com",
    databaseURL: "https://collabboard-00-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "collabboard-00",
    storageBucket: "collabboard-00.firebasestorage.app",
    messagingSenderId: "753314518464",
    appId: "1:753314518464:web:ff83d8819f7ac82ec5a425",
    measurementId: "G-8FMH2TD0QP"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };