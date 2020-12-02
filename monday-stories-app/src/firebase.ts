import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import config from "./config";

const jwt = require('jsonwebtoken');


const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function loginLocal(email: string, password: string) {
    try {
        const res = await firebase.auth().signInWithEmailAndPassword(email, password);
        return res;
    } catch (err) {
        return Promise.reject(new Error(err.message));
    }
}

async function registerGoogle() {
    try {
        let provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        let exists = true;
        let body: any = {};
        await firebase.auth().signInWithPopup(provider).then(async (reg:any) => {
            body.id = reg.user.uid;
            const user = await db.collection('users').doc(reg.user.uid).collection("data").doc("userData").get();
            if(!user.exists) {
                await db.collection('users').doc(reg.user.uid).collection('data').doc("userData").set({
                    name: reg.user.displayName,
                    profilePhoto: reg.user.photoURL,
                });
                await db.collection('users').doc(reg.user.uid).collection("data").doc("userContactData").set({
                    email: reg.user.email,
                });
                exists = false;
            } else { 
                body = user.data();
                console.log(body)
                body.id = reg.user.uid;
            }
        })
        return Promise.resolve({ exists, body })
    } catch (err) {
        console.log(err);
        return Promise.reject(new Error(err.message));
    }
}

async function setUsername(newUser: { id: string, username: string }) {
    const { id, username } = newUser;
    console.log(newUser)
    try {
        const user = await db.collection('users').where("username", "==", username).get();
        console.log(user)
        if(user.empty) {
            await db.collection('users').doc(id).collection("data").doc("userData").update({
                username
            });
            return Promise.resolve();
        } else {
            return Promise.reject(new Error("User already exists"));
        }
    } catch (err) {
        console.log(err);
        return Promise.reject(new Error(err.message));
    }
}

async function registerLocal(newUser: {name: string, email: string, password: string, username: string}) {
    const { name, email, password, username } = newUser;

    console.log(newUser)
    try {
        const user = await db.collection('users').where("username", "==", username).get();
        console.log(user)
        if(user.empty) {
            const regRes:any = await firebase.auth().createUserWithEmailAndPassword(email, password)

            await db.collection('users').doc(regRes.user.uid).collection("data").doc("userData").set({
                name,
                username,
                profilePhoto: "https://firebasestorage.googleapis.com/v0/b/monday-stories.appspot.com/o/defaults%2Fempty_profile_photo.jpg?alt=media&token=22b807cd-dc38-42b6-8c84-b3777094fb55",
            });
            await db.collection('users').doc(regRes.user.uid).collection("data").doc("userContactData").set({
                email,
            })
            return Promise.resolve();
        } else {
            return Promise.reject(new Error("User already exists"));
        }
    } catch (err) {
        console.log(err)
        return Promise.reject(new Error(err.message));
    }
}

async function getAndValidateUserData(uid: string) {
    try {
        let user: any;
        let userData = await firebase.firestore().collection('users').doc(uid).collection('data').doc('userData').get();
        let contactData = await firebase.firestore().collection('users').doc(uid).collection('data').doc('userContactData').get();
        user = {
            ...userData.data(),
            ...contactData.data(),
        }
        if(!user.username) {
            try {
                await firebase.auth().signOut();
                return Promise.reject(new Error('The user does\'nt have a username'));
            } catch (err) {
                return Promise.reject(new Error('The user does\'nt have a username'));
            }
        }
        user = {
            profilePhoto: user.profilePhoto,
            name: user.name,
            email: user.email,
            username: user.username,
            uid,
            hasStory: user.hasStory ? user.hasStory : false
        }
        console.log(user)

        return Promise.resolve({ user });
    } catch (err) {
        console.log(err);
        return Promise.reject(new Error(err.message))
    }
}


export {
    loginLocal,
    registerLocal,
    registerGoogle,
    setUsername,
    getAndValidateUserData
}
