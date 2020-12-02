import React, { Fragment, useState, useEffect } from 'react';
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from 'framer-motion';
import { AiOutlineHeart, AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi"
import numeral from 'numeral-es6';

import "./CommentModal.css";

type props = {
    isOpen: boolean,
    post: any,
    toggleOpen: any,
    updateCommentsCount: any
}

const modalVariants = {
    show: {
        display: 'flex',
        x: "0vw",
        opacity: 1
    },
    hide: {
        display: ['flex', 'none'],
        x: ["0vw", "-100vw"],
        opacity: [1, 0]
    },
}

const CommentModal = ({ isOpen, toggleOpen, post, updateCommentsCount }: props) => {

    const [comment, setComment] = useState("");
    const [user] = useAuthState(firebase.auth());
    const [postComments, setPostComments] = useState<any[]>([]);
    
    function likePost(_id) {

    }

    async function submitComment(e) {
        e.preventDefault();
        if(comment.length <= 150) {
            const docRef = await firebase.firestore().collection("posts").doc(post.key).collection("comments").add({
                uid: user.uid,
                text: comment,
                createdAt: new Date().getTime()
            });
            console.log(docRef.id)
            let comments = post.comments;
            const updatedPost = await firebase.firestore().collection("posts").doc(post.key).get();
            const updatedPostData = updatedPost.data();
            console.log(updatedPostData);
            if(updatedPostData) {
                await firebase.firestore().collection("posts").doc(post.key).update({
                    comments: updatedPostData.comments + 1,
                });
            }
            updateCommentsCount(comments + 1);
            setComment("");
            getComments();
        } else {
            toast.error("Comments should not be greater than 150 characthers", {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
            });
        }
    }
    
    async function getComments() {
        if(post.comments > 0) {
            const commentsList = await firebase.firestore().collection("posts").doc(post.key).collection("comments").orderBy("createdAt", "desc").limit(20).get();
            const commentsContainer: any = [];
            commentsList.forEach(async (comment: any) => {
                const commentData = comment.data();
                const user = await firebase.firestore().collection("users").doc(commentData.uid).collection("data").doc("userData").get();
                const userData = user.data();
                commentsContainer.push({
                    ...commentData,
                    ...userData
                });
                if(commentsList.size === commentsContainer.length) {
                    console.log("setting comments")
                    commentsContainer.sort((a, b) => a.createdAt > b.createdAt ? -1 : 1);
                    updateCommentsCount(commentsList.size);
                    setPostComments(commentsContainer);
                }                               
            })
        } else {
            setPostComments([])    
        }
    }

    useEffect(() => {
        console.log(post)
        if(isOpen) {
            setPostComments([]);
            getComments();
        }
    }, [isOpen])

    if(post ? Object.keys(post).length > 0 : false) {
        return(
            <Fragment>
                <motion.div
                    className="notranslate comment-modal-container"
                    initial={{ opacity: 0, display: 'none', x: "-100vw" }}
                    animate={isOpen ? "show" : "hide"}
                    transition={{ stiffness: 40, duration: 0.3 }}
                    variants={modalVariants}
                >
                    <ToastContainer/>
                    <div className="notranslate comment-modal-header" onClick={toggleOpen}>
                        <FiArrowLeft/>
                        <p>Comments</p>
                    </div>
                    <div className="comment-modal-content">
                        <div className="notranslate comment-modal-post-container">
                            <div className="notranslate comment-modal-post">
                                <div className="notranslate comment-modal-post-user-image">
                                    <img src={post.profilePhoto} />
                                </div>
                                <div className="notranslate comment-modal-post-content">
                                    <div className="notranslate comment-modal-post-content-data">
                                        <p>{post.name}</p>
                                        <p>@{post.username}</p>
                                    </div>
                                    <p>{post.text}</p>
                                    <div className="notranslate comment-modal-post-interactions">
                                        <div className="notranslate comment-modal-post-interactions-button" onClick={() => {likePost(post.id)}}>
                                            {post.userLiked ? <AiFillHeart/> : <AiOutlineHeart/>}
                                            <p>{post.likes > 0 ? post.likes > 999 ? numeral(post.likes).format("0.0a") : post.likes : ""}</p>
                                        </div>
                                        <div className="notranslate comment-modal-post-interactions-button">
                                            <AiOutlineComment/> 
                                            <p>{post.comments > 0 ? post.comments > 999 ? numeral(post.comments).format("0.0a") : post.comments : ""}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {postComments?.map((comment: any) => {
                                return (
                                    <div className="notranslate comment-modal-comment">
                                        <div className="notranslate comment-modal-comment-user-image">
                                            <img src={comment.profilePhoto} />
                                        </div>
                                        <div className="notranslate comment-modal-comment-content">
                                            <div className="notranslate comment-modal-comment-content-data">
                                                <p>@{comment.username}</p>
                                            </div>
                                            <p>{comment.text}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <form className="notranslate comment-modal-form" onSubmit={submitComment}>
                        <div className="comment-modal-form-content">
                            <input type="text" className="notranslate form-control" placeholder="Comment something" value={comment} onChange={e => setComment(e.target.value)} required/>
                            <button className="notranslate btn btn-primary"><FiArrowRight/></button>
                        </div>
                    </form>
                </motion.div>
            </Fragment>
        )
    } else {
        return (
            <Fragment></Fragment>
        )
    }
}

export default CommentModal;    