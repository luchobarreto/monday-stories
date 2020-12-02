import React, { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import firebase from "firebase/app";
import axios from "axios";
import config from "../config"
import { v4 as uuid } from "uuid"
import "firebase/firestore";
import "firebase/storage";
import "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import LoadingScreen from "./LoadingScreen";
import { motion } from "framer-motion";
import Webcam from "react-webcam";
import ImageEditor from '@toast-ui/react-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css'

import { VscChromeClose } from "react-icons/vsc"

import "./CameraModal.css";

const request = require("request")

type props = {
    isOpen: boolean,
    toggleOpen: any,
    updateData: any
}

const variants = {
    open: {
        opacity: 1,
        display: "flex",
        x: "0vw"
    },
    closed: {
        opacity: [1, 0], 
        display: ['flex', 'none'], 
        x: ["0vw", "-100vw"]
    }
}

const storage = firebase.storage();
const storageRef = storage.ref();
const imagesToApproveRef = storageRef.child('imagesToApprove/');
const storiesRef = storageRef.child('stories/');

const CameraModal = ({ isOpen, toggleOpen, updateData }: props) => {
    const webcamRef = useRef<any>(null);
    const editorRef = useRef<any>();
    const [imgSrc, setImgSrc] = useState<any>(null)
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef, setImgSrc]);
    const [loadingScreenOpen, setLoadingScreenOpen] = useState(false);
    const [user] = useAuthState(firebase.auth());

    async function uploadImage() {
        const editorInstance = editorRef.current.getInstance();
        setLoadingScreenOpen(true);
        const imageId = uuid();
        await storageRef.child(`imagesToApprove/${imageId}`).putString(editorInstance.toDataURL(), 'data_url');
        const imageUrl = await storageRef.child(`imagesToApprove/${imageId}`).getDownloadURL();
        console.log(imageUrl)


        const apiKey = '';
        const apiSecret = '';


        let canBeUploaded = false;
        console.log(imageUrl)
        await request.get('https://api.imagga.com/v2/categories/nsfw_beta?image_url='+encodeURIComponent(imageUrl), async function (error, response, body) {
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);
            const res = JSON.parse(`${body}`);
            const resultt = res.result
            res.result.categories.forEach(async (category, idx) => {
                console.log(category);
                if(category.name.en === "safe" && category.confidence > 60) {
                    canBeUploaded = true
                    await storageRef.child(`imagesToApprove/${imageId}`).delete();
                    await storageRef.child(`stories/${imageId}`).putString(editorInstance.toDataURL(), 'data_url');
                    const newStory = await firebase.firestore().collection("stories").add({
                        uid: user.uid,
                        imageId,
                        createdAt: new Date().getTime()
                    });
                    await firebase.firestore().collection("users").doc(user.uid).collection("data").doc("userData").update({
                        hasStory: true
                    });
                    try {
                        const res = await axios({
                            method: "POST",
                            url: `${config.server}/uploadStory`,
                            data: {
                                imageId,
                                docId: newStory.id,
                                uid: user.uid
                            }
                        });
                    } catch (error) {
                        
                    }
                    updateData()
                    setLoadingScreenOpen(false);
                    setImgSrc(null);
                    toggleOpen();  
                }
                if((idx + 1) === resultt.categories.length) {
                    if(!canBeUploaded) {
                        await storageRef.child(`imagesToApprove/${imageId}`).delete();
                        console.log('deleting')
                        updateData()
                        setLoadingScreenOpen(false);
                        setImgSrc(null);
                        toggleOpen();
                    }
                }
            })
        }).auth(apiKey, apiSecret, true);
    }

    useEffect(() => {
        let toastUiFilters = document.querySelectorAll(".tui-image-editor-checkbox");
        let toastUiLigthining = document.querySelectorAll(".tui-image-editor-checkbox-group");
        let toastUiFilterColorItems = document.querySelectorAll(".filter-color-item");
        let toastUiEffects = document.querySelector(".tui-image-editor-menu");
        try {
            if(toastUiFilters) {
                (toastUiFilters[1] as HTMLElement).style.display = "none";
                (toastUiFilters[3] as HTMLElement).style.display = "none";
                (toastUiFilters[4] as HTMLElement).style.display = "none";
                (toastUiFilters[5] as HTMLElement).style.display = "none";
            }
            if(toastUiLigthining) {
                (toastUiLigthining[0] as HTMLElement).style.display = "none";
                (toastUiLigthining[1] as HTMLElement).style.display = "none";
                (toastUiLigthining[2] as HTMLElement).style.display = "none";
            }
            if(toastUiFilterColorItems) {
                (toastUiFilterColorItems[0] as HTMLElement).style.display = "none";
                (toastUiFilterColorItems[1] as HTMLElement).style.display = "none";
                (toastUiFilterColorItems[2] as HTMLElement).style.display = "none";
            }
            if(toastUiEffects) {
                document.querySelectorAll(".submit-photo-button").forEach(button => {
                    (button as HTMLElement).remove()
                })
                let submitPhotoButton = document.createElement('div');
                submitPhotoButton.onclick = () => {uploadImage()};
                submitPhotoButton.className = "submit-photo-button tui-image-editor-item normal";
                submitPhotoButton.innerHTML = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"></path></svg>`;
                (toastUiEffects as HTMLElement).appendChild(submitPhotoButton)
            }
        } catch (err) {}
    }, [imgSrc])

    return (
        <Fragment>
            <motion.div 
                className="camera-modal-container"
                initial={{opacity: 0, display: 'none', x: "-100vw"}}
                animate={isOpen ? "open" : "closed"}
                transition={{stiffness: 40, duration: 0.3}}
                variants={variants}
            >
                <LoadingScreen show={loadingScreenOpen} spinnerColor="light" backgroundColor="rgba(0,0,0,0.27)" backgroundBlur={5} />
                {
                    imgSrc ? 
                    <Fragment>
                        <div className="camera-modal-buttons-editor">
                            <div className="close-modal-button">
                                <VscChromeClose onClick={() => {setImgSrc(null);toggleOpen();}} stroke="#fff"/>
                            </div>
                        </div>
                        <ImageEditor
                            ref={editorRef}
                            includeUI={{
                                loadImage: {
                                    path: imgSrc,
                                    name: "new photo"
                                },
                                menu: ['filter', 'text', 'crop'],
                                initMenu: "filter",
                                removeFilter: ['blur', 'emboss'],
                                uiSize: {
                                    width: '100%',
                                    height: '100%'
                                },
                                menuBarPosition: 'bottom'
                            }}
                        />
                    </Fragment> : 
                    <Fragment>
                        <div className="camera-modal-buttons">
                            <div className="close-modal-button" onClick={() => toggleOpen()}>
                                <VscChromeClose stroke="#fff"/>
                            </div>
                            <div className="capture-button" onClick={capture}>
                                <div></div>
                            </div>
                        </div>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            className="camera-modal-camera"
                            screenshotFormat="image/jpeg"
                            screenshotQuality={1}
                            mirrored={false}
                        />
                    </Fragment>
                }
            </motion.div>
        </Fragment>
    )
}

export default CameraModal;
