// ================= FIREBASE CONFIGURATION =================
const firebaseConfig = {
  apiKey: "AIzaSyC6ADkW2grhCzynLXG02UqM4mrWtQuXPLc",
  authDomain: "platfrom-app.firebaseapp.com",
  projectId: "platfrom-app",
  storageBucket: "platfrom-app.firebasestorage.app",
  messagingSenderId: "115893301278",
  appId: "1:115893301278:web:2880a267b68c37a817be0f",
  measurementId: "G-7XZ8S3X45R"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Application State
let currentUser = null;
let isRegistering = false;
let userCreatedPosts = [];

// Note Expiration Constant (5 Hours in milliseconds)
const NOTE_EXPIRATION_MS = 5 * 60 * 60 * 1000;

// ================= LIQUID GLASS STYLES INJECTION =================
(function injectGlassStyles() {
  const style = document.createElement('style');
  style.id = 'glass-theme-styles';
  style.innerHTML = `
    :root {
      --glass-bg: rgba(18, 18, 26, 0.72);
      --glass-border: rgba(255, 255, 255, 0.14);
      --glass-blur: blur(20px) saturate(190%);
      --accent-color: #007aff;
      --accent-glow: rgba(0, 122, 255, 0.4);
      --card-bg: rgba(26, 26, 36, 0.65);
    }
    
    body {
      background: #09090d !important;
      color: #f0f0f5 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding-bottom: 90px;
    }

    /* Navigation */
    .bottom-nav, .glass-nav, .navbar {
      position: fixed !important;
      bottom: 18px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 320px !important;
      max-width: 88vw !important;
      height: 54px !important;
      background: var(--glass-bg) !important;
      backdrop-filter: var(--glass-blur) !important;
      -webkit-backdrop-filter: var(--glass-blur) !important;
      border: 1px solid var(--glass-border) !important;
      border-radius: 35px !important;
      padding: 0 16px !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      z-index: 9999 !important;
    }

    .nav-item {
      color: rgba(255, 255, 255, 0.45);
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .nav-item.active, .nav-item:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      text-shadow: 0 0 10px var(--accent-color);
    }

    /* Avatar Edit Container */
    .avatar-edit-wrapper {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }

    .avatar-edit-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .avatar-edit-wrapper:hover .avatar-edit-overlay {
      opacity: 1;
    }

    /* Post Cards */
    .post, .glass-card {
      background: var(--card-bg) !important;
      backdrop-filter: var(--glass-blur) !important;
      -webkit-backdrop-filter: var(--glass-blur) !important;
      border: 1px solid var(--glass-border) !important;
      border-radius: 20px !important;
      margin-bottom: 20px !important;
      padding: 16px !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4) !important;
      position: relative;
    }

    .post-media img {
      border-radius: 14px;
      width: 100%;
      object-fit: cover;
      max-height: 520px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Post Actions */
    .post-actions {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .action-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .action-btn.liked {
      color: #ff3b30 !important;
    }

    .action-btn.reposted {
      color: #30d158 !important;
    }

    /* Comments Section */
    .comments-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .comment-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: rgba(0, 0, 0, 0.2);
      padding: 8px 12px;
      border-radius: 10px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .comment-delete-btn {
      color: #ff453a;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 11px;
      opacity: 0.7;
      padding: 2px 4px;
    }

    .comment-delete-btn:hover {
      opacity: 1;
    }

    .comment-input-box {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .comment-input-box input {
      flex: 1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 15px;
      padding: 6px 12px;
      color: #fff;
      font-size: 12px;
      outline: none;
    }

    .comment-input-box button {
      background: var(--accent-color);
      border: none;
      color: #fff;
      border-radius: 15px;
      padding: 6px 14px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    }

    .delete-dropdown {
      position: absolute;
      top: 40px;
      right: 16px;
      background: rgba(28, 28, 38, 0.95);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 6px;
      z-index: 100;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .delete-btn {
      color: #ff453a;
      background: transparent;
      border: none;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      width: 100%;
      border-radius: 8px;
    }

    .hidden { display: none !important; }

    /* Notes */
    .notes-container {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      padding: 8px 4px 16px 4px;
      scrollbar-width: none;
    }
    .notes-container::-webkit-scrollbar { display: none; }

    .note-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 68px;
      cursor: pointer;
      position: relative;
    }

    .note-avatar-wrapper {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .note-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid var(--accent-color);
      object-fit: cover;
    }

    .note-bubble-badge {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 122, 255, 0.95);
      color: white;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 12px;
      white-space: nowrap;
      max-width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Explore & Profile Grids */
    .explore-grid, .profile-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 6px !important;
    }

    .grid-item {
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      background: #14141d;
    }

    .grid-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;
  document.head.appendChild(style);
})();

// ================= DIVERSE CREATOR POOLS =================
const USERS_LIST = [
  { uid: "moulay_lhani", name: "Moulay Lhani", handle: "moulay_lhani", avatar: "https://picsum.photos/seed/moulay/200/200", bio: "Platform Lead Architect & Creative Dev ⚡", isDevOG: true },
  { uid: "usr_2", name: "Aria Thorne", handle: "aria_t", avatar: "https://picsum.photos/seed/aria/200/200", bio: "Generative art & atmospheric photo essays", isDevOG: false },
  { uid: "usr_3", name: "Kaelen Voss", handle: "voss_visuals", avatar: "https://picsum.photos/seed/kaelen/200/200", bio: "Minimalist architecture & cyberpunk aesthetics", isDevOG: false }
];

// GENERATE MOCK POSTS
const MOCK_500_POSTS = Array.from({ length: 30 }, (_, i) => {
  const user = USERS_LIST[i % USERS_LIST.length];
  return {
    id: `mock-post-${i + 1}`,
    authorUid: user.uid,
    authorName: user.name,
    authorHandle: `@${user.handle}`,
    authorAvatar: user.avatar,
    text: `Exploring clean glass UI design patterns and real-time social feeds #${i + 1}`,
    mediaUrl: `https://picsum.photos/seed/glass_feed_img_${i + 1}/800/800`,
    likesCount: Math.floor((i * 17) % 150) + 5,
    repostsCount: Math.floor((i * 7) % 30) + 1,
    isLiked: false,
    isReposted: false,
    comments: [
      { id: `c_${i}_1`, authorUid: "usr_2", authorName: "Aria Thorne", text: "Love this aesthetic! 🔥" }
    ],
    createdAt: `${(i % 23) + 1}h ago`
  };
});

let MOCK_NOTES = [
  { id: "note_1", uid: "moulay_lhani", name: "Moulay", avatar: USERS_LIST[0].avatar, text: "Platform v2 live! ⚡", createdAt: Date.now() }
];

// ================= NAVIGATION =================
function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(viewId + '-view');
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  let navKey = viewId;
  if (['post-detail', 'settings', 'chat-conversation', 'user-profile'].includes(viewId)) navKey = 'profile';

  const activeNav = document.querySelector(`.nav-item[data-target="${navKey}"]`);
  if (activeNav) activeNav.classList.add('active');
}

// ================= INITIALIZATION & AUTH =================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  renderNotes();
  renderExploreGrid();
});

function setupEventListeners() {
  const authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;

      try {
        if (isRegistering) {
          const res = await auth.createUserWithEmailAndPassword(email, password);
          await db.collection("users").doc(res.user.uid).set({
            username: email.split("@")[0],
            bio: "Digital Creator & Glass Member",
            avatar: `https://picsum.photos/seed/${res.user.uid}/300/300`
          });
        } else {
          await auth.signInWithEmailAndPassword(email, password);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => auth.signOut());
}

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    switchView('home');
    loadUserProfile(user.uid);
    initRealtimeFeed();
    renderExploreGrid();
    renderNotes();
  } else {
    currentUser = null;
    switchView('auth');
  }
});

// ================= EDIT PROFILE PICTURE =================
async function editProfilePicture() {
  if (!currentUser) return;

  const newAvatarUrl = prompt("Enter new Profile Picture Image URL:");
  if (newAvatarUrl && newAvatarUrl.trim()) {
    const url = newAvatarUrl.trim();
    try {
      await db.collection("users").doc(currentUser.uid).update({ avatar: url });
      document.getElementById("profile-avatar").src = url;
      alert("Profile picture updated!");
      initRealtimeFeed();
    } catch (err) {
      alert("Error updating profile picture: " + err.message);
    }
  }
}

// ================= LIKE, REPOST & COMMENT ACTIONS =================
async function toggleLike(postId, isFirestore) {
  if (isFirestore) {
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists) return;

    const data = doc.data();
    const likes = data.likes || [];
    const userIndex = likes.indexOf(currentUser.uid);

    if (userIndex === -1) {
      likes.push(currentUser.uid);
    } else {
      likes.splice(userIndex, 1);
    }

    await postRef.update({ likes });
  } else {
    const post = MOCK_500_POSTS.find(p => p.id === postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likesCount += post.isLiked ? 1 : -1;
      initRealtimeFeed();
    }
  }
}

async function toggleRepost(postId, isFirestore) {
  if (isFirestore) {
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists) return;

    const data = doc.data();
    const reposts = data.reposts || [];
    const userIndex = reposts.indexOf(currentUser.uid);

    if (userIndex === -1) {
      reposts.push(currentUser.uid);
    } else {
      reposts.splice(userIndex, 1);
    }

    await postRef.update({ reposts });
  } else {
    const post = MOCK_500_POSTS.find(p => p.id === postId);
    if (post) {
      post.isReposted = !post.isReposted;
      post.repostsCount += post.isReposted ? 1 : -1;
      initRealtimeFeed();
    }
  }
}

function toggleCommentsThread(postId) {
  const el = document.getElementById(`comments-thread-${postId}`);
  if (el) el.classList.toggle("hidden");
}

async function addComment(postId, isFirestore) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  const commentObj = {
    id: `c_${Date.now()}`,
    authorUid: currentUser ? currentUser.uid : "guest",
    authorName: currentUser ? (currentUser.displayName || currentUser.email.split("@")[0]) : "You",
    text: text,
    createdAt: Date.now()
  };

  if (isFirestore) {
    const postRef = db.collection("posts").doc(postId);
    await postRef.update({
      comments: firebase.firestore.FieldValue.arrayUnion(commentObj)
    });
  } else {
    const post = MOCK_500_POSTS.find(p => p.id === postId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(commentObj);
      initRealtimeFeed();
    }
  }
}

async function deleteComment(postId, commentId, isFirestore) {
  if (!confirm("Delete this comment?")) return;

  if (isFirestore) {
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists) return;

    const comments = doc.data().comments || [];
    const updatedComments = comments.filter(c => c.id !== commentId);
    await postRef.update({ comments: updatedComments });
  } else {
    const post = MOCK_500_POSTS.find(p => p.id === postId);
    if (post && post.comments) {
      post.comments = post.comments.filter(c => c.id !== commentId);
      initRealtimeFeed();
    }
  }
}

// ================= REALTIME FEED =================
function initRealtimeFeed() {
  const feed = document.getElementById("feed-container");
  if (!feed) return;

  db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    feed.innerHTML = "";
    const firestorePosts = snapshot.docs.map(doc => ({ id: doc.id, isFirestore: true, ...doc.data() }));
    const allPosts = [...firestorePosts, ...MOCK_500_POSTS];

    allPosts.forEach((post) => {
      const isMyPost = currentUser && (post.authorUid === currentUser.uid);

      // Handle likes data structure
      const isLiked = post.isFirestore
        ? (post.likes || []).includes(currentUser?.uid)
        : post.isLiked;
      const likesCount = post.isFirestore ? (post.likes || []).length : post.likesCount;

      // Handle reposts data structure
      const isReposted = post.isFirestore
        ? (post.reposts || []).includes(currentUser?.uid)
        : post.isReposted;
      const repostsCount = post.isFirestore ? (post.reposts || []).length : post.repostsCount;

      const comments = post.comments || [];

      const postEl = document.createElement("div");
      postEl.className = "post";

      postEl.innerHTML = `
        <div class="post-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div class="user-info" style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="openUserProfile('${post.authorUid}')">
            <img src="${post.authorAvatar || 'https://picsum.photos/seed/avatar/100/100'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div>
              <div style="font-weight:600; font-size:14px;">${post.authorName}</div>
              <div style="font-size:11px; color:#888;">${post.authorHandle || '@creator'}</div>
            </div>
          </div>
          <div style="position:relative;">
            <i class="fa-solid fa-ellipsis" onclick="toggleDeleteMenu('${post.id}')" style="color:#888; cursor:pointer; padding:6px;"></i>
            <div id="delete-menu-${post.id}" class="delete-dropdown hidden">
              ${isMyPost ? `
                <button class="delete-btn" onclick="deletePost('${post.id}', ${!!post.isFirestore})">
                  <i class="fa-solid fa-trash-can"></i> Delete Post
                </button>
              ` : `
                <button class="delete-btn" style="color:#ccc;" onclick="toggleDeleteMenu('${post.id}')">Report</button>
              `}
            </div>
          </div>
        </div>
        
        <div style="margin-bottom:10px; font-size:13px;">${post.text}</div>
        ${post.mediaUrl ? `<div class="post-media" style="margin-bottom:10px;"><img src="${post.mediaUrl}"></div>` : ""}

        <!-- Action Bar (Likes, Reposts, Comments) -->
        <div class="post-actions">
          <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}', ${!!post.isFirestore})">
            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            <span>${likesCount}</span>
          </button>

          <button class="action-btn ${isReposted ? 'reposted' : ''}" onclick="toggleRepost('${post.id}', ${!!post.isFirestore})">
            <i class="fa-solid fa-retweet"></i>
            <span>${repostsCount}</span>
          </button>

          <button class="action-btn" onclick="toggleCommentsThread('${post.id}')">
            <i class="fa-regular fa-comment"></i>
            <span>${comments.length}</span>
          </button>
        </div>

        <!-- Comments Section -->
        <div id="comments-thread-${post.id}" class="comments-section hidden">
          <div id="comments-list-${post.id}">
            ${comments.map(c => `
              <div class="comment-item">
                <div>
                  <strong style="color:#007aff;">${c.authorName}:</strong> 
                  <span style="color:#ddd;">${c.text}</span>
                </div>
                ${(currentUser && c.authorUid === currentUser.uid) ? `
                  <button class="comment-delete-btn" onclick="deleteComment('${post.id}', '${c.id}', ${!!post.isFirestore})">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="comment-input-box">
            <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." onkeydown="if(event.key==='Enter') addComment('${post.id}', ${!!post.isFirestore})">
            <button onclick="addComment('${post.id}', ${!!post.isFirestore})">Send</button>
          </div>
        </div>
      `;
      feed.appendChild(postEl);
    });
  });
}

// ================= PROFILE & DISCOVERY =================
async function loadUserProfile(uid) {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      document.getElementById("profile-username").innerText = data.username || "User";
      document.getElementById("header-handle").innerText = `@${data.username || "user"}`;
      document.getElementById("profile-bio").innerText = data.bio || "Digital Creator";

      const avatarEl = document.getElementById("profile-avatar");
      if (avatarEl) {
        avatarEl.src = data.avatar || `https://picsum.photos/seed/${uid}/300/300`;
        if (uid === currentUser.uid && !avatarEl.parentNode.classList.contains('avatar-edit-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'avatar-edit-wrapper';
          wrapper.onclick = editProfilePicture;
          avatarEl.parentNode.insertBefore(wrapper, avatarEl);
          wrapper.appendChild(avatarEl);
          wrapper.innerHTML += `<div class="avatar-edit-overlay"><i class="fa-solid fa-camera"></i></div>`;
        }
      }
    }

    const postsSnap = await db.collection("posts").where("authorUid", "==", uid).get();
    userCreatedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const statPosts = document.getElementById("stat-posts");
    if (statPosts) statPosts.innerText = userCreatedPosts.length;
    renderProfileGrid();
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

function renderProfileGrid() {
  const grid = document.getElementById("profile-grid-section");
  if (!grid) return;
  grid.className = "profile-grid";
  grid.innerHTML = "";

  if (userCreatedPosts.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: span 3; text-align:center; padding:20px; color:#888;">No posts yet.</div>`;
    return;
  }

  userCreatedPosts.forEach((post) => {
    const item = document.createElement("div");
    item.className = "grid-item";
    item.innerHTML = `<img src="${post.mediaUrl}" alt="User Post">`;
    grid.appendChild(item);
  });
}

function openUserProfile(userUid) {
  if (!userUid) return;
  if (currentUser && userUid === currentUser.uid) {
    switchView('profile');
    loadUserProfile(currentUser.uid);
    return;
  }

  let targetUser = USERS_LIST.find(u => u.uid === userUid) || {
    uid: userUid,
    name: "Glass Creator",
    handle: "creator",
    avatar: `https://picsum.photos/seed/${userUid}/150/150`,
    bio: "Digital Artist & Platform Glass Contributor"
  };

  const userPosts = MOCK_500_POSTS.filter(p => p.authorUid === targetUser.uid);
  let viewContainer = document.getElementById("user-profile-view");

  if (!viewContainer) {
    viewContainer = document.createElement("div");
    viewContainer.id = "user-profile-view";
    viewContainer.className = "view";
    document.querySelector("main")?.appendChild(viewContainer);
  }

  viewContainer.innerHTML = `
    <div style="padding: 20px;">
      <button onclick="switchView('home')" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:8px 14px; border-radius:20px; cursor:pointer; margin-bottom:15px;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <div class="glass-card" style="text-align:center; padding:24px;">
        <img src="${targetUser.avatar}" style="width:84px; height:84px; border-radius:50%; border:2px solid #007aff; object-fit:cover; margin-bottom:12px;">
        <h3 style="margin:0; font-size:18px;">${targetUser.name}</h3>
        <p style="color:#888; font-size:13px; margin:4px 0 12px 0;">@${targetUser.handle}</p>
        <p style="font-size:13px; color:#ccc;">${targetUser.bio}</p>
      </div>
      <div class="profile-grid">
        ${userPosts.map(p => `<div class="grid-item"><img src="${p.mediaUrl}"></div>`).join('')}
      </div>
    </div>
  `;

  switchView('user-profile');
}

function toggleDeleteMenu(postId) {
  const menu = document.getElementById(`delete-menu-${postId}`);
  if (menu) menu.classList.toggle("hidden");
}

async function deletePost(postId, isFirestore) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    if (isFirestore) {
      await db.collection("posts").doc(postId).delete();
      if (currentUser) loadUserProfile(currentUser.uid);
    } else {
      const index = MOCK_500_POSTS.findIndex(p => p.id === postId);
      if (index !== -1) MOCK_500_POSTS.splice(index, 1);
    }
    alert("Post deleted!");
    initRealtimeFeed();
  } catch (err) {
    alert("Error deleting post: " + err.message);
  }
}

// ================= NOTES (5-HOUR EXPIRATION & DELETE) =================
function renderNotes() {
  let rail = document.getElementById("notes-slider");
  if (!rail) {
    rail = document.createElement("div");
    rail.id = "notes-slider";
    rail.className = "notes-container";
    const feedContainer = document.getElementById("feed-container");
    if (feedContainer && feedContainer.parentNode) {
      feedContainer.parentNode.insertBefore(rail, feedContainer);
    }
  }

  const now = Date.now();
  MOCK_NOTES = MOCK_NOTES.filter(n => (now - n.createdAt) < NOTE_EXPIRATION_MS);

  rail.innerHTML = `
    <div class="note-item" onclick="promptAddNote()">
      <div class="note-avatar-wrapper">
        <img src="${currentUser ? (currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/100/100`) : 'https://picsum.photos/seed/self/100/100'}" class="note-avatar" style="border-style:dashed;">
        <div class="note-bubble-badge" style="background:#34c759;">+ Note</div>
      </div>
      <span style="font-size:11px; margin-top:5px; color:#ccc;">Your Note</span>
    </div>
  ` + MOCK_NOTES.map(n => `
    <div class="note-item" onclick="handleNoteClick('${n.id}', '${n.uid}')">
      <div class="note-avatar-wrapper">
        <img src="${n.avatar}" class="note-avatar">
        <div class="note-bubble-badge">${n.text}</div>
      </div>
      <span style="font-size:11px; margin-top:5px; color:#ccc;">${n.name}</span>
    </div>
  `).join('');
}

function promptAddNote() {
  const noteText = prompt("Share a thought / note (max 30 chars):");
  if (noteText && noteText.trim()) {
    MOCK_NOTES.unshift({
      id: `note_${Date.now()}`,
      uid: currentUser ? currentUser.uid : "self",
      name: "You",
      avatar: currentUser ? (currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/100/100`) : 'https://picsum.photos/seed/user/100/100',
      text: noteText.trim().substring(0, 30),
      createdAt: Date.now()
    });
    renderNotes();
  }
}

function handleNoteClick(noteId, authorUid) {
  const isMyNote = currentUser && (authorUid === currentUser.uid || authorUid === "self");
  if (isMyNote) {
    if (confirm("Would you like to delete your note?")) {
      deleteNote(noteId);
    }
  } else {
    openUserProfile(authorUid);
  }
}

function deleteNote(noteId) {
  MOCK_NOTES = MOCK_NOTES.filter(n => n.id !== noteId);
  renderNotes();
  alert("Note deleted!");
}

function renderExploreGrid() {
  const grid = document.getElementById("explore-grid");
  if (!grid) return;
  grid.className = "explore-grid";
  grid.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    const post = MOCK_500_POSTS[i];
    const item = document.createElement("div");
    item.className = "grid-item";
    item.onclick = () => openUserProfile(post.authorUid);
    item.innerHTML = `<img src="${post.mediaUrl}" loading="lazy">`;
    grid.appendChild(item);
  }
}

// Window Globals
window.switchView = switchView;
window.openUserProfile = openUserProfile;
window.toggleDeleteMenu = toggleDeleteMenu;
window.deletePost = deletePost;
window.promptAddNote = promptAddNote;
window.handleNoteClick = handleNoteClick;
window.deleteNote = deleteNote;
window.editProfilePicture = editProfilePicture;
window.toggleLike = toggleLike;
window.toggleRepost = toggleRepost;
window.toggleCommentsThread = toggleCommentsThread;
window.addComment = addComment;
window.deleteComment = deleteComment;
