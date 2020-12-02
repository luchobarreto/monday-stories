import React, { Fragment, useState } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

import LoadingScreen from "../components/LoadingScreen";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import { registerLocal, registerGoogle, setUsername } from "../firebase";
import { redirectTo } from "../functions/redirectTo";

import { AiOutlineGoogle, AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

type User = {
    email: string,
    username: string,
    password: string,
    name: string
}

const Register:React.FC = () => {

    const [form, setForm] = useState<User>({
        email: "",
        username: "",
        password: "",
        name: ""
    });
    const [askUsername, setAskUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [userId, setUserId] = useState("");
    const [showPasswordButton, setShowPasswordButton] = useState({
        show: false,
        icon: <AiFillEye />,
        inputType: "password",
    });
    const [showLoadingScreen, setShowLoadingScreen] = useState(false);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, value: string) {
        setForm({
            email: value === "email" ? e.target.value : form.email,
            password: value === "password" ? e.target.value : form.password,
            username: value === "username" ? e.target.value : form.username,
            name: value === "name" ? e.target.value : form.name,
        });
    }

    async function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if(userId !== "") {
            try {
                if (newUsername.match(/^[a-zA-Z0-9\-_]{0,40}$/)) {
                    await setUsername({ id: userId, username: newUsername });
                    redirectTo("/login");
                } else {
                    toast.error(
                        'Only letters, numbers and dashes are allowed on the "username" field',
                        {
                            position: "bottom-center",
                            autoClose: 5000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                        }
                    );
                }
            } catch (err) {
                toast.error(err.message, {
                    position: "bottom-center",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                });
            }
        } else {
            redirectTo("/register");
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            if(form.email !== "" && form.password !== "" && form.username !== "" && form.name !== "") {
                if (form.username.match(/^[a-zA-Z0-9\-_]{0,40}$/)) {
                    if (form.username.match(/^(?![0-9]*$)[a-zA-Z0-9\s_]+$/)) {
                        setShowLoadingScreen(true);
                        firebase.firestore().collection("users").where("username", "==", form.username).get()
                            .then(queryResponse => {    
                                if(queryResponse.empty) {
                                    console.log(queryResponse.empty);
                                    firebase.auth().createUserWithEmailAndPassword(form.email, form.password)
                                        .then(async (user:any) => {
                                            console.log(user)
                                            firebase.firestore().collection("users").doc(user.user.uid).collection("data").doc("userData").set({
                                                username:form.username,
                                                name: form.name,
                                                profilePhoto: "https://firebasestorage.googleapis.com/v0/b/monday-stories.appspot.com/o/defaults%2Fempty_profile_photo.jpg?alt=media&token=22b807cd-dc38-42b6-8c84-b3777094fb55"
                                            })
                                            firebase.firestore().collection("users").doc(user.user.uid).collection("data").doc("userContactData").set({
                                                email:form.email,
                                            })
                                            firebase.firestore().collection("users").doc(user.user.uid).set({
                                                likedPosts: []
                                            }).then(async res => {
                                                console.log(res)
                                                firebase
                                                    .auth()
                                                    .onAuthStateChanged(
                                                        (user) => {
                                                            if (user) {
                                                                redirectTo(
                                                                    "/dashboard"
                                                                );
                                                            }
                                                        }
                                                    );
                                            }).catch(err => {
                                            setShowLoadingScreen(false);
                                            toast.error(
                                                err.message,
                                                {
                                                    position: "bottom-center",
                                                    autoClose: 5000,
                                                    hideProgressBar: true,
                                                    closeOnClick: true,
                                                    pauseOnHover: true,
                                                }
                                            );
                                        });
                                        }).catch(err => {
                                            setShowLoadingScreen(false);
                                            toast.error(
                                                err.message,
                                                {
                                                    position: "bottom-center",
                                                    autoClose: 5000,
                                                    hideProgressBar: true,
                                                    closeOnClick: true,
                                                    pauseOnHover: true,
                                                }
                                            );
                                        });
                                } else {
                                    setShowLoadingScreen(false);
                                    toast.error("The username is already taken.", {
                                        position: "bottom-center",
                                        autoClose: 5000,
                                        hideProgressBar: true,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                    });
                                }
                            }).catch(err => {
                                setShowLoadingScreen(false);
                                toast.error(
                                    err.message,
                                    {
                                        position: "bottom-center",
                                        autoClose: 5000,
                                        hideProgressBar: true,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                    }
                                );
                            });
                            
                    } else {
                        toast.error(
                            'Only letters and numbers are allowed on the "name" field',
                            {
                                position: "bottom-center",
                                autoClose: 5000,
                                hideProgressBar: true,
                                closeOnClick: true,
                                pauseOnHover: true,
                            }
                        );
                    }
                } else {
                    toast.error(
                        'Only letters, numbers and dashes are allowed on the "username" field',
                        {
                            position: "bottom-center",
                            autoClose: 5000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                        }
                    );
                }
            } else {
                toast.error("All the fields are required", {
                    position: "bottom-center",
                    autoClose: 5000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                });
            }   
        } catch (err) {
            toast.error(err.message, {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
            });
        }
    }

    function googleLogin() {
        registerGoogle()
            .then((res: any) => {
                if (res.exists && res.body.username) {
                    const unsuscribe = firebase.auth().onAuthStateChanged((user) => {
                        if (user) {
                            redirectTo("/dashboard");
                            unsuscribe();
                        }
                    });
                } else {
                    setUserId(res.body.id)
                    setAskUsername(true);
                }
            })
            .catch((err) => {
                toast.error(err.message, {
                    position: "bottom-center",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                });
            });
    }

    function toggleShowPassword() {
        if (showPasswordButton.show) {
            setShowPasswordButton({
                show: false,
                icon: <AiFillEye />,
                inputType: "password",
            });
        } else {
            setShowPasswordButton({
                show: true,
                icon: <AiFillEyeInvisible />,
                inputType: "text",
            });
        }
    }

    return (
        <Fragment>
            <LoadingScreen
                show={showLoadingScreen}
                spinnerColor="light"
                backgroundColor="rgba(0,0,0,0.27)"
                backgroundBlur={5}
            />
            <ToastContainer/>
            <div className="notranslate login-container">
                <motion.div 
                    className="notranslate form-container"
                    initial={{
                        x: "0vw",
                        opacity: 1
                    }}
                    animate={askUsername ? { x: "100vw", opacity: 0 } : { x: "-0vw", opacity: 1 }}
                >
                    <form className="notranslate login-form" onSubmit={handleSubmit}>
                        <h2>Register</h2>
                        <p>Already have an account? <a href="/login">Login</a></p>
                        <div className="notranslate login-input-container mb-3">
                            <input type="email" className="notranslate form-control login-input" placeholder="E-Mail" onChange={e => { handleInputChange(e, "email"); }} required/>
                        </div>
                        <div className="notranslate login-input-container mb-3">
                            <input type="text" className="notranslate form-control login-input" placeholder="Username" onChange={e => { handleInputChange(e, "username"); }} required/>
                        </div>
                        <div className="notranslate login-input-container mb-3">
                            <input type="text" className="notranslate form-control login-input" placeholder="Name" onChange={e => { handleInputChange(e, "name"); }} required/>
                        </div>
                        <div className="notranslate login-input-container login-input-password mb-3">
                            <input type={showPasswordButton.inputType} className="notranslate form-control login-input" placeholder="Password" onChange={e => { handleInputChange(e, "password"); }} required/>
                            <div className="notranslate toggle-password-button" onClick={toggleShowPassword}>
                                {showPasswordButton.icon}
                            </div>
                        </div>
                        <button className="notranslate btn btn-primary mb-2">Sign Up</button>
                        <button className="notranslate btn btn-light google-login-button" type="button" onClick={googleLogin}><AiOutlineGoogle/> Sign up with Google</button>
                    </form>
                </motion.div>
                <motion.div 
                    className="notranslate form-container"
                    initial={{
                        x: "-100vw",
                        opacity: 0
                    }}
                    animate={askUsername ? { x: "0vw", opacity: 1 } : { x: "-100vw" }}
                >
                    <form className="notranslate login-form" onSubmit={handleUsernameSubmit}>
                        <h2>Register</h2>
                        <p>Write your username</p>
                        <input type="text" className="notranslate form-control login-input mb-3" placeholder="Username" onChange={e => setNewUsername(e.target.value)} required/>
                        <button className="notranslate btn btn-primary mb-2">Sign Up</button>
                    </form>
                </motion.div>
            </div>
        </Fragment>
    )
}

export default Register;