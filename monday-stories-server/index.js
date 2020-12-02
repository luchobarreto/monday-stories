const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const firebase = require("firebase");
const { CronJob } = require("cron");
const cors = require("cors");
const e = require("express");
global.XMLHttpRequest = require("xhr2");
require("firebase/firestore");
require("firebase/storage");

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDA-vyphYNQ8D-YYamZXzEsx4yiE_aWDxs",
    authDomain: "monday-stories.firebaseapp.com",
    databaseURL: "https://monday-stories.firebaseio.com",
    projectId: "monday-stories",
    storageBucket: "monday-stories.appspot.com",
    messagingSenderId: "314452822057",
    appId: "1:314452822057:web:550d64dab031285edcb438",
    measurementId: "G-9MB8TFP4FE"
};


const app = express();

app.use(bodyParser.json());
app.use(cors({ allowOrigin: "*" }))

firebase.initializeApp(firebaseConfig)

firebase.auth().signInWithEmailAndPassword("admin@server.com", "83dl23qdli23mdulqro2q");

const storage = firebase.storage();
const storageRef = storage.ref();

app.route("/uploadStory")
    .post(async (req, res) => {
        console.log("juan")
        const { imageId, docId, uid } = req.body;
        if(imageId && docId && uid) {
            try {
                res.send("lul")
                const job = new CronJob('59 59 23 * * *', async () => {
                    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
                    await firebase.firestore().collection("stories").doc(docId).delete();
                    await storageRef.child(`imagesToApprove/${imageId}`).delete();
                    await firebase.firestore().collection("users").doc(uid).collection("data").doc("userData").update({
                        hasStory: false,
                    });
                    job.stop();
                });
                job.start()
            } catch (err) {
                res.json({ error: "session invalid" });
            }
        } else {
            res.json({ error: "missing data" });
        }
    })

    process.on('unhandledRejection', (reason, promise) => {
        console.log('Unhandled Rejection at:', reason.stack || reason)
        // Recommended: send the information to sentry.io
        // or whatever crash reporting service you use
      })    

app.listen(8000, () => {
    console.log("server started");
})