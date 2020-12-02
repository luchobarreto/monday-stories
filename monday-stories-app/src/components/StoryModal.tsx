import React, { Fragment } from 'react';
import firebase from "firebase/app";
import "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { VscChromeClose } from "react-icons/vsc";
import { BsThreeDotsVertical } from "react-icons/bs";

import "./StoryModal.css";

type props = {
    isOpen: boolean,
    imageUrl: string,
    userProflePhoto: string,
    username: string,
    uid: string,
    createdAt: number,
    toggleOpen: any
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

dayjs.extend(relativeTime);
dayjs().fromNow();

const StoryModal = ({ isOpen, imageUrl, userProflePhoto, username, uid, createdAt, toggleOpen }: props) => {
    const [user] = useAuthState(firebase.auth());

    if(isOpen) {
        return (
            <Fragment>
                <motion.div
                    className="modal-story-container"
                    initial={{opacity: 0, display: 'none', x: "-100vw"}}
                    animate={isOpen ? "open" : "closed"}
                    transition={{stiffness: 40, duration: 0.3 }}
                    variants={variants}
                >
                    <div className="modal-story-data">
                        <div className="modal-story-user">
                            <img src={userProflePhoto} />
                            <p>{username}</p>
                            <p>{dayjs().to(dayjs(createdAt))}</p>
                            <VscChromeClose onClick={() => toggleOpen()} />
                        </div>
                        <div className="modal-story-options">
                            {
                                uid === user.uid ? (
                                    <Fragment>
                                        <div className="modal-story-popover">
                                            <BsThreeDotsVertical/>
                                        </div>
                                    </Fragment>
                                ) : (
                                    <Fragment></Fragment>
                                )
                            }
                        </div>
                    </div>
                    <div className="modal-story-image" style={{ background: `url(${imageUrl})` }}></div>
                </motion.div>
            </Fragment>
        );
    } else {
        return (
            <Fragment></Fragment>
        )
    }
}

export default StoryModal;