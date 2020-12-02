import React, { Fragment, useState, useEffect } from 'react';
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore"; 
import "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import numeral from 'numeral-es6';

import LoadingScreen from "../components/LoadingScreen";
import CommentModal from "../components/CommentModal";
import CameraModal from "../components/CameraModal";
import StoryModal from "../components/StoryModal";
import { Tooltip, OverlayTrigger } from "react-bootstrap"
import { AiOutlinePlus, AiOutlinePlusCircle, AiFillHeart, AiOutlineHeart, AiOutlineComment } from "react-icons/ai";
import { BsFillImageFill, BsThreeDotsVertical } from "react-icons/bs"
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import { getAndValidateUserData } from "../firebase";
import { redirectTo } from "../functions/redirectTo";

import "./styles.css";

const storyVariants = { tap: { scale: 0.93 } };
const postsRef = firebase.firestore().collection("posts");

type commentModalType = {
    isOpen: boolean,
    post: any, 
    idx: number
}

const Dashboard: React.FC = () => {

    const [showLoadingScreen, setShowLoadingScreen] = useState(false);
    const [user, setUser] = useState({
        email: "",
        name: "",
        username: "",
        profilePhoto: "",
        uid: "",
        iat: 0,
        hasStory: false,
        likedPosts: []
    });
    const [postInput, setPostInput] = useState("");
    const [newPostImage, setNewPostImage] = useState("");
    const [cameraModalOpen, setCameraModalOpen] = useState(false);
    const [posts, setPosts] = useState<any>([])
    const [stories, setStories] = useState<any>([]);
    const [userSession] = useAuthState(firebase.auth());
    const [commentModal, setCommentModal] = useState<commentModalType>({
        post: {},
        isOpen: false,
        idx: 0
    });
    const [activeStory, setActiveStory] = useState({
        isOpen: false,
        imageUrl: "",
        userProfilePhoto: "",
        username: "",
        uid: "",
        createdAt: 0
    })

    const [reRender, setReRender] = useState(false);
    useEffect(() => {
        if(reRender) {
            setReRender(false);
        }
    }, [reRender]);
    function forceRender() {
        setReRender(true);
    }


    const inputPost = document.getElementById("postInput");

    inputPost?.addEventListener("input", () => {
        if(inputPost.innerText.length < 256) {
            setPostInput(inputPost.innerText);
        } else {
            inputPost.innerText = inputPost.innerText.substring(0, 256);
        }
    });

    async function likePost(postId, idx) {
        const likeRef = await firebase.firestore().collection("likes").add({
            from: firebase.auth().currentUser?.uid,
            to: postId
        });
        const post = await firebase.firestore().collection("posts").doc(postId).get();
        const postData = post.data();
        await firebase.firestore().collection("posts").doc(postId).update({
            likes: postData?.likes + 1
        });
        const likeId = likeRef.id;
        let postsContainer = posts;
        postsContainer[idx].userLiked = true;
        postsContainer[idx].likes = postData?.likes + 1
        postsContainer[idx].userLikeId = likeId;
        console.log(postsContainer)
        setPosts(postsContainer);
        forceRender()
    }

    async function removeLike(likeId, postId, idx) {
        await firebase.firestore().collection("likes").doc(likeId).delete();
        const post = await firebase.firestore().collection("posts").doc(postId).get();
        const postData = post.data();
        await firebase.firestore().collection("posts").doc(postId).update({
            likes: postData?.likes - 1
        });
        let postsContainer = posts;
        postsContainer[idx].userLiked = false;
        postsContainer[idx].likes = postData?.likes - 1
        postsContainer[idx].userLikeId = undefined;
        setPosts(postsContainer);
        forceRender()
    }

    async function submitPost() {
        if(postInput.length >= 10 && postInput.length <= 255) {
            if(userSession) {
                await postsRef.add({
                    text: postInput,
                    createdAt: new Date().getTime(),
                    uid: firebase.auth().currentUser?.uid,
                    likes: 0,
                    comments: 0
                });
                setPostInput("");
                if(inputPost) {
                    inputPost.innerText = "";
                }
                getPosts()
            } else {
                redirectTo("/login")
            }
        } else {
            setPostInput("");
            if(inputPost) {
                inputPost.innerText = "";
            }
        }
    }

    function updateCommentsCount(commentsCount: number) {
        const postsContainer = posts; 
        postsContainer[commentModal.idx].comments = commentsCount; 
        setPosts(postsContainer); 
        console.log(commentsCount);
        let commentModalContainer = {
            post: postsContainer[commentModal.idx],
            idx: commentModal.idx,
            isOpen: commentModal.isOpen,
        };
        setCommentModal(commentModalContainer);
    }

    async function deletePost(postId) {
        const post = await firebase.firestore().collection("posts").doc(postId).get();
        const postData = post.data();
        if(postData?.uid === firebase.auth().currentUser?.uid) {
            await firebase.firestore().collection("posts").doc(postId).delete();
            getPosts();
            const postLikeRef = await firebase.firestore().collection("likes").where("to", "==", postId).get();
            if(!postLikeRef.empty) {
                postLikeRef.forEach(doc => {
                    console.log(doc.id)
                    firebase.firestore().collection("likes").doc(doc.id).delete();
                })
            }
        }
    }

    async function updateUserData() {
        const unsuscribe = firebase.auth().onAuthStateChanged(user => {    
            if(user) {
                getAndValidateUserData(user.uid)
                    .then(res => {
                        setUser({...res.user });
                        setShowLoadingScreen(false);
                        unsuscribe()
                    }).catch(err => {
                        setShowLoadingScreen(false);
                        toast.error(err.message, {
                            position: "bottom-center",
                            autoClose: 2000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                        });
                    })
            } else {
                redirectTo("/login");
            }
        });
        getStories();
    }

    async function getStories() {
        let storiesContainer: any = [];
        let storiesList = await firebase.firestore().collection("stories").orderBy("createdAt", "desc").limit(20).get();
        console.log(storiesList.size);
        storiesList.forEach(async userStory => {
            const storyData = userStory.data();
            let userData: any = await firebase.firestore().collection("users").doc(storyData.uid).collection("data").doc("userData").get();
            userData = userData.data();
            console.log(storyData);
            const imageUrl = await firebase.storage().ref().child(`stories/${storyData.imageId}`).getDownloadURL();
            console.log(
                imageUrl
            )
            if(storyData.uid === user.uid) {
                storiesContainer.unshift({
                    ...userData,
                    ...storyData,
                    imageUrl
                });
            } else {
                storiesContainer.push({
                    ...userData,
                    ...storyData,
                    imageUrl
                });
            }
            if(storiesContainer.length === storiesList.size) {
                setStories(storiesContainer);
            }
        });
    }

    async function getMoreStories() {
        let lastStoryDate = 0;
        stories.forEach(story => {
            if(story.createdAt > lastStoryDate) {
                lastStoryDate = story.createdAt;
            }
        });
        let storiesContainer = stories;
        let storiesList = await firebase.firestore().collection("stories").where("createdAt", ">", lastStoryDate).limit(20).get();
        storiesList.forEach(async (doc: any) => {
            const story = doc.data();
            const user = await firebase.firestore().collection("users").doc(story.uid).get();
            const userData = user.data();
            const imageUrl = await firebase.storage().ref().child(`stories/${story.imageId}`).getDownloadURL();
            storiesContainer.push({
                ...userData,
                ...story,
                imageUrl
            });
            if(storiesContainer.length === storiesList.size) {
                setStories(storiesContainer);
            }
        });
    }

    async function getPosts() {
        let postsContainer: any = [];
        let postsList = await firebase.firestore().collection("posts").orderBy("createdAt", "desc").limit(10).get();
        postsList.forEach(async (doc: any) => {
            const post = doc.data();
            const user = await firebase.firestore().collection("users").doc(post.uid).collection("data").doc("userData").get();
            const userData = user.data();
            let userLike: any;
            let userLikeId: any;
            if(post.likes > 0) {
                try {
                    let userLikeRef = await firebase.firestore().collection("likes").where("from", "==", firebase.auth().currentUser?.uid).where("to", "==", doc.id).get();
                    if(!userLikeRef.empty) {
                        console.log(userLike.docs[0]?.id)
                        userLikeId = userLike.docs[0]?.id;
                        userLike = true;
                    } else {
                        userLike = false;
                    }
                } catch (err) {}
            }
            postsContainer.push({
                ...post,
                ...userData,
                key: doc.id,
                userLiked: userLike,
                userLikeId
            });
            if(postsContainer.length === postsList.size) {
                postsContainer.sort((a, b) => a.createdAt > b.createdAt ? -1 : 1);
                console.log(postsContainer)
                setPosts(postsContainer);
            }
        })
    }

    async function getMorePosts() {
        if(posts.length > 0) {
            const lastPostDate = posts[posts.length - 1].createdAt;
            let postsContainer: any = [];
            let postsList = await firebase.firestore().collection("posts").where("createdAt", "<", lastPostDate).limit(10).get();
            postsList.forEach(async (doc: any) => {
                const post = doc.data();
                const user = await firebase.firestore().collection("users").doc(post.uid).collection("data").doc("userData").get();
                const userData = user.data();
                let userLike: any;
                let userLikeId: any;
                if(post.likes > 0) {
                    let userLikeRef = await firebase.firestore().collection("likes").where("from", "==", firebase.auth().currentUser?.uid).where("to", "==", doc.id).get();
                    if(!userLikeRef.empty) {
                        userLikeId = userLike.docs[0].id;
                        userLike = true;
                    } else {
                        userLike = false;
                    }
                }
                postsContainer.push({
                    ...post,
                    ...userData,
                    key: doc.id,
                    userLiked: userLike,
                    userLikeId
                });
                if(postsContainer.length === postsList.size) {
                    postsContainer.sort((a, b) => a.createdAt > b.createdAt ? -1 : 1);
                    setPosts([...posts, ...postsContainer]);
                }
            });
        }
    }

    useEffect(() => {
        setShowLoadingScreen(true);
        firebase.auth().onAuthStateChanged(user => {    
            if(user) {
                getAndValidateUserData(user.uid)
                    .then(res => {
                        if(!res.user.username) {
                            firebase.auth().signOut().then(() => {redirectTo("/login")}).catch(() => {redirectTo("/login")});
                        }
                        setUser({...res.user });
                        setShowLoadingScreen(false);
                    }).catch(err => {
                        setShowLoadingScreen(false);
                        redirectTo("/login");
                        toast.error(err.message, {
                            position: "bottom-center",
                            autoClose: 2000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                        });
                    })
            } else {
                redirectTo("/login");
            }
        });
        getStories();
        getPosts();
    }, []);

    return (
        <Fragment>
            <CameraModal toggleOpen={() => setCameraModalOpen(false)} isOpen={cameraModalOpen} updateData={updateUserData}/>
            <CommentModal updateCommentsCount={updateCommentsCount} isOpen={commentModal.isOpen} post={commentModal.post} toggleOpen={() => {setCommentModal({ isOpen: false, post: commentModal.post ? commentModal.post : {}, idx: commentModal.idx ? commentModal.idx : 0 })}}/>
            <LoadingScreen
                show={showLoadingScreen}
                spinnerColor="light"
                backgroundColor="rgba(0,0,0,0.27)"
                backgroundBlur={5}
            />
            <StoryModal 
                isOpen={activeStory.isOpen} 
                imageUrl={activeStory.imageUrl} 
                userProflePhoto={activeStory.userProfilePhoto} 
                username={activeStory.username} uid={activeStory.uid} 
                createdAt={activeStory.createdAt}
                toggleOpen={() => {setActiveStory({...activeStory, isOpen: false});}}
            />
            <ToastContainer />
            <div className="notranslate dashboard-container">
                <div className="notranslate dashboard-feed col-12 col-md-12">
                    <div className="notranslate dashboard-nav">
                        <h2>Feed</h2>
                        <div className="notranslate nav-stories">
                            <div className="notranslate create-story-button">
                                <motion.div className="notranslate story"
                                    whileTap="tap"
                                    initial={{ scale: 1}}
                                    variants={storyVariants}
                                >
                                    {user.hasStory ? (
                                        <div className={`notranslate story-img-container ${stories[0] ? stories[0].viewed ? "story-viewed" : "" : ""}`}>
                                            <div
                                                className="notranslate story-img"
                                                style={{
                                                    background: `url('${user && user.profilePhoto ? user.profilePhoto : ""}')`,
                                                }}
                                                onClick={() => {setTimeout(()=>{const storiesContainer = stories; storiesContainer[0].viewed = true; setStories(storiesContainer); setActiveStory({ isOpen: true, imageUrl: stories[0].imageUrl, userProfilePhoto: user.profilePhoto, username: user.username, uid: user.uid, createdAt: stories[0].createdAt }) }, 500)}}
                                            >
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="notranslate story-img"
                                            style={{
                                                background: `url('${user && user.profilePhoto ? user.profilePhoto : ""}')`,
                                            }}
                                            onClick={() => setCameraModalOpen(true)}
                                        >
                                            <div className="notranslate add-story-icon">
                                                <AiOutlinePlus />
                                            </div>
                                        </div>
                                    )}
                                    <p>Your Story</p>
                                </motion.div>
                            </div>
                            {stories.map((story, idx) => {
                                if(story.uid !== user.uid) {
                                    return (
                                        <motion.div
                                            className="notranslate story"
                                            whileTap="tap"
                                            initial={{ scale: 1 }}
                                            variants={storyVariants}
                                        >
                                            <div className={`notranslate story-img-container ${story.viewed ? "story-viewed" : ""}`} onClick={() => {const storiesContainer = stories; storiesContainer[idx].viewed = true; setStories(storiesContainer); setTimeout(()=>{ setActiveStory({ isOpen: true, imageUrl: story.imageUrl, userProfilePhoto: story.profilePhoto, username: story.username, uid: story.uid, createdAt: story.createdAt }) }, 500)}}>
                                                <div
                                                    className="notranslate story-img"
                                                    style={{
                                                        background: `url('${story.profilePhoto ? story.profilePhoto : "#fff"}')`,
                                                    }}
                                                />
                                            </div>
                                            <p>{story.username}</p>
                                        </motion.div>
                                    );
                                } else {
                                    return (
                                        <></>
                                    )
                                }
                            })}
                        </div>
                    </div>
                    <div className="notranslate dashboard-feed-content">
                            <div className="notranslate posts-container">
                                <div className="notranslate create-post-form mb-2">
                                    <h2>Create Post</h2>
                                    <div className="notranslate post-input-container mb-3">
                                        <div id="postInput" contentEditable="true" className="notranslate post-input" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if(postInput.length < 256) { setPostInput(e.target.value) }}}></div>
                                    </div>
                                    <div className="notranslate new-post-data">
                                        {postInput.length < 10 ? <p>{10 - postInput.length} characters missing</p> : <p>{255 - postInput.length} characters left</p>}
                                        <label htmlFor="imageInput"><BsFillImageFill/></label>
                                        <input type="file" style={{display: "none"}} id="imageInput" accept="image/x-png,image/gif,image/jpeg" />
                                        <button className="notranslate btn btn-primary" onClick={submitPost}>Post</button>
                                    </div>
                                </div>
                                {posts?.map((post: any, idx: number) => {

                                    return (
                                        <div className="notranslate post-container">
                                            <div className="notranslate post-user" onClick={() => { setCommentModal({ isOpen: true, post, idx }); }}>
                                                <img src={post.profilePhoto} className="notranslate post-user-profile"/>                          
                                            </div>
                                            <div className="notranslate post-content">
                                                <div className="notranslate post-data">
                                                    <p className="notranslate post-user-name">{post.name}</p>
                                                    <a className="notranslate post-user-username">@{post.username}</a>
                                                    {post.uid === user.uid ? (
                                                        <div className="post-options">
                                                            <OverlayTrigger
                                                                key={`overlay-${post.key}`}
                                                                placement="bottom"
                                                                overlay={
                                                                    <Tooltip id={`toooltip-${post.key}`}>
                                                                        <div onClick={() => deletePost(post.key)}>Delete</div>
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <BsThreeDotsVertical/>
                                                            </OverlayTrigger>
                                                        </div>
                                                    ) : <></> }
                                                </div>
                                                <p>{post.text}</p>
                                                {post.image ? (
                                                    <img src={post.image} className="post-image"/>
                                                ) : <></>}
                                                <div className="notranslate post-interactions">
                                                    <div className="notranslate post-interactions-button" onClick={() => { post.userLiked ? removeLike(post.userLikeId, post.key, idx) : likePost(post.key, idx)}}>
                                                        {post.userLiked ? <AiFillHeart/> : <AiOutlineHeart/>}
                                                        <p>{post.likes > 0 ? post.likes > 999 ? numeral(post.likes).format("0.0a") : post.likes : ""}</p>
                                                    </div>
                                                    <div className="notranslate post-interactions-button" onClick={() => { setCommentModal({ isOpen: true, post, idx }); }}>
                                                        <AiOutlineComment/> 
                                                        <p>{post.comments > 0 ? post.comments > 999 ? numeral(post.comments).format("0.0a") : post.comments : ""}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="get-more-posts" onClick={getMorePosts}>
                                <AiOutlinePlusCircle/>
                            </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

export default Dashboard;