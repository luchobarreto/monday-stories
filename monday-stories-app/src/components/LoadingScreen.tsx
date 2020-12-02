import React, { Fragment } from 'react';

import { motion } from "framer-motion";
import "./LoadingScreen.css";

type props = {
    backgroundBlur?: number;
    backgroundColor?: string;
    show: boolean;
    spinnerColor?:
        | "primary"
        | "secondary"
        | "success"
        | "danger"
        | "warning"
        | "info"
        | "light"
        | "dark";
};

const LoadingScreen = ({ backgroundBlur, backgroundColor, show, spinnerColor }: props) => {
    return (
        <Fragment>
            <motion.div
                initial={{ opacity: 0, display: 'none' }}
                animate={show ? { opacity: 1, display: "flex" } : { opacity: 0, display: 'none' }}
                className="notranslate loading-screen-container" 
                style={{backgroundColor: `${backgroundColor || "rgba(0,0,0,0.5)"}`, backdropFilter: `blur(${backgroundBlur || 8}px)` }}
            >
                <div className={`spinner-border text-${spinnerColor || "primary"}`} role="status">
                    <span className="notranslate visually-hidden"></span>
                </div>
            </motion.div>
        </Fragment>
    );
}

export default LoadingScreen;