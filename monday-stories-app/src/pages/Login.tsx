import React, { Fragment, useState, useEffect } from "react";
import firebase from "firebase/app";
import "firebase/auth";

import LoadingScreen from "../components/LoadingScreen";
import { ToastContainer, toast } from "react-toastify";
import { loginLocal, registerGoogle, setUsername } from "../firebase";
import { redirectTo } from "../functions/redirectTo";

import { motion } from "framer-motion";
import { AiOutlineGoogle, AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

type User = {
    email: string,
    password: string,
}

const Login:React.FC = () => {

    const [form, setForm] = useState<User>({
        email: "",
        password: "",
    });
    const [askUsername, setAskUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [userId, setUserId] = useState("");
    const [showPasswordButton, setShowPasswordButton] = useState({
        show: false,
        icon: <AiFillEye />,
        inputType: "password"
    });
    const [showLoadingScreen, setShowLoadingScreen] = useState(false);
    const [authEventListen, setAuthEventListen] = useState(true);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, value: string) {
        setForm({
            email: value === "email" ? e.target.value : form.email,
            password: value === "password" ? e.target.value : form.password,
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

        e.preventDefault()

        if(form.email !== "" && form.password !== "") {
            try {
                setShowLoadingScreen(true)
                await loginLocal(form.email, form.password);
                setAuthEventListen(true)
                setShowLoadingScreen(false);
                redirectTo("/dashboard");
            } catch(err) {
                setShowLoadingScreen(false);
                toast.error(
                    err.message,
                    {
                        position: "bottom-center",
                        autoClose: 2000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                    }
                );
            }
        }
    }

    async function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (userId !== "") {
            try {
                if (newUsername.match(/^[a-zA-Z0-9\-_]{0,40}$/)) {
                    setShowLoadingScreen(true)
                    await setUsername({ id: userId, username: newUsername });
                    setShowLoadingScreen(false)
                    redirectTo("/dashboard");
                } else {
                    setShowLoadingScreen(false);
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
                setShowLoadingScreen(false);
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

    function googleLogin() {
        setShowLoadingScreen(true);
        registerGoogle()
            .then((res: any) => {
                console.log(res)
                if (res.exists && res.body.username) {
                    setAuthEventListen(true);
                    setShowLoadingScreen(false);
                    redirectTo("/dashboard");
                } else {
                    setAuthEventListen(false)
                    setShowLoadingScreen(false);
                    setUserId(res.body.id);
                    setAskUsername(true);
                }
            })
            .catch((err) => {
                setShowLoadingScreen(false);
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
        if(showPasswordButton.show) {
            setShowPasswordButton({
                show: false,
                icon: <AiFillEye />,
                inputType: "password"
            });
        } else {
            setShowPasswordButton({
                show: true,
                icon: <AiFillEyeInvisible />,
                inputType: "text"
            });
        }
    }

    useEffect(() => {
        const unsuscribe = firebase.auth().onAuthStateChanged(user => {
            if(user && authEventListen) {
                redirectTo("/dashboard");
            } else {
                setAuthEventListen(false);
                unsuscribe();
            }
        });
    }, []);

    return (
        <Fragment>
            <LoadingScreen
                show={showLoadingScreen}
                spinnerColor="light"
                backgroundColor="rgba(0,0,0,0.27)"
                backgroundBlur={5}
            />
            <ToastContainer />
            <div className="notranslate login-container">
                <motion.div
                    className="notranslate form-container"
                    initial={{
                        x: "0vw",
                        opacity: 1,
                    }}
                    animate={
                        askUsername
                            ? { x: "100vw", opacity: 0 }
                            : { x: "-0vw", opacity: 1 }
                    }
                >
                    <form className="notranslate login-form" onSubmit={handleSubmit}>
                        <h2>Login</h2>
                        <p>
                            Don't have an account?{" "}
                            <a href="/register">Register</a>
                        </p>
                        <div className="notranslate login-input-container mb-3">
                            <input
                                type="email"
                                className="notranslate form-control login-input"
                                placeholder="E-Mail"
                                onChange={(e) => {
                                    handleInputChange(e, "email");
                                }}
                                required
                            />
                        </div>
                        <div className="notranslate login-input-container login-input-password mb-3">
                            <input
                                type={showPasswordButton.inputType}
                                className="notranslate form-control login-input"
                                placeholder="Password"
                                onChange={(e) => {
                                    handleInputChange(e, "password");
                                }}
                                required
                            />
                            <div
                                className="notranslate toggle-password-button"
                                onClick={toggleShowPassword}
                            >
                                {showPasswordButton.icon}
                            </div>
                        </div>
                        <button className="notranslate btn btn-primary mb-2">
                            Sign Up
                        </button>
                        <button
                            className="notranslate btn btn-light google-login-button"
                            type="button"
                            onClick={googleLogin}
                        >
                            <AiOutlineGoogle /> Sign In with Google
                        </button>
                    </form>
                </motion.div>
                <motion.div
                    className="notranslate form-container"
                    initial={{
                        x: "-100vw",
                        opacity: 0,
                    }}
                    animate={
                        askUsername ? { x: "0vw", opacity: 1 } : { x: "-100vw" }
                    }
                >
                    <form
                        className="notranslate login-form"
                        onSubmit={handleUsernameSubmit}
                    >
                        <h2>Login</h2>
                        <p>Write your username</p>
                        <input
                            type="text"
                            className="notranslate form-control login-input mb-3"
                            placeholder="Username"
                            onChange={(e) => setNewUsername(e.target.value)}
                            required
                        />
                        <button className="notranslate btn btn-primary mb-2">
                            Sign Up
                        </button>
                    </form>
                </motion.div>
            </div>
        </Fragment>
    );
}

export default Login;