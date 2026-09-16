// ================= FIREBASE INITIALIZATION =================
const firebaseConfig = {
  apiKey: "AIzaSyC6ADkW2grhCzynLXG02UqM4mrWtQuXPLc",
  authDomain: "platfrom-app.firebaseapp.com",
  projectId: "platfrom-app",
  storageBucket: "platfrom-app.firebasestorage.app",
  messagingSenderId: "115893301278",
  appId: "1:115893301278:web:2880a267b68c37a817be0f"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Application State
let currentUser = null;
let isRegistering = false;
let activeChatPartner = null;
const NOTE_EXPIRATION_MS = 5 * 60 * 60 * 1000; // 5-Hour Expiration

// ================= 200+ UNIQUE FEED GENERATOR =================
const CREATOR_POOL = [
  { name: "Aria Thorne", handle: "@aria_t", avatar: "https://picsum.photos/seed/aria/150/150" },
  { name: "Kaelen Voss", handle: "@voss_art", avatar: "https://picsum.photos/seed/kaelen/150/150" },
  { name: "Elena Rostova", handle: "@elena_design", avatar: "https://picsum.photos/seed/elena/150/150" },
  { name: "Marcus Brody", handle: "@brody_film", avatar: "https://picsum.photos/seed/marcus/150/150" },
  { name: "Moulay Lhani", handle: "@moulay_lhani", avatar: "https://picsum.photos/seed/moulay/150/150" }
];

const QUOTES_CAPTION_POOL = [
  "“Simplicity is the ultimate sophistication.” — Leonardo da Vinci",
  "Captured this stunning architectural glow during golden hour.",
  "“Code is like humor. When you have to explain it, it’s bad.” — Cory House",
  "Reflecting on clean glass UI mechanics and real-time social architectures.",
  "“Design is not just what it looks like and feels like. Design is how it works.”",
  "Minimalism isn't the lack of something. It's simply the perfect amount of everything.",
  "Late night compiling sessions hit differently with this dark mode aesthetic."
];

// Seed 215 unique feed items dynamically
const GENERATED_200_POSTS = Array.from({ length: 215 }, (_, i) => {
  const creator = CREATOR_POOL[i % CREATOR_POOL.length];
  const quote = QUOTES_CAPTION_POOL[i % QUOTES_CAPTION_POOL.length];
  return {
    id: `generated_post_${i + 1}`,
    authorUid: `user_${(i % 5) + 1}`,
    authorName: creator.name,
    authorHandle: creator.handle,
    authorAvatar: creator.avatar,
    text: `${quote} #${i + 1}`,
    mediaUrl: `https://picsum.photos/seed/glass_feed_${i + 100}/800/800`,
    likesCount: Math.floor((i * 13) % 240) + 12,
    repostsCount: Math.floor((i * 3) % 45) + 2,
    isLiked: false,
    isReposted: false,
    comments: [{ id: `c_${i}`, authorName: "Alex", text: "Incredible shot!" }]
  };
});

let USER_NOTES = [
  { id: "n_1", uid: "usr_moulay", name: "Moulay", avatar: "https://picsum.photos/seed/moulay/150/150", text: "Platform v2 is live! ⚡", createdAt: Date.now() }
];

let DIRECT_MESSAGES = {
  "usr_1": [
    { sender: "usr_1", text: "Hey! Loved your recent portfolio update." },
    { sender: "me", text: "Appreciate it! Working on glass UI aesthetics now." }
  ]
};

// ================= VIEW SWITCHING & NAV =================
function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId + '-view');
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  let navKey = viewId;
  if (['settings', 'chat-conversation', 'user-profile'].includes(viewId)) navKey = 'profile';
  const activeNav = document.querySelector(`.nav-item[data-target="${navKey}"]`);
  if (activeNav) activeNav.classList.add('active');
}

// ================= AUTHENTICATION & DEV BADGES =================
function toggleAuthMode() {
  isRegistering = !isRegistering;
  document.getElementById("auth-title").innerText = isRegistering ? "Create Account" : "Welcome to Platform";
  document.getElementById("auth-submit-btn").innerText = isRegistering ? "Sign Up" : "Sign In";
  document.getElementById("toggle-auth-btn").innerText = isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up";
}

document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  try {
    if (isRegistering) {
      const res = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection("users").doc(res.user.uid).set({
        email: email,
        username: email.split("@")[0],
        bio: "Digital Creator & Platform Member",
        avatar: `https://picsum.photos/seed/${res.user.uid}/300/300`
      });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (err) {
    alert(err.message);
  }
});

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    switchView('home');
    setupUserProfile(user);
    renderNotes();
    renderFeed();
    renderExploreGrid();
    renderMessagesList();
  } else {
    currentUser = null;
    switchView('auth');
  }
});

document.getElementById("logout-btn")?.addEventListener("click", () => auth.signOut());

function setupUserProfile(user) {
  const isDev = user.email === "moulaylhani@gmail.com";
  const username = user.email ? user.email.split("@")[0] : "user";
  
  document.getElementById("profile-username").innerText = username;
  document.getElementById("header-handle").innerText = `@${username}`;

  // Toggle DEV / OG Badges strictly for moulaylhani@gmail.com
  document.getElementById("badge-dev").classList.toggle("hidden", !isDev);
  document.getElementById("badge-og").classList.toggle("hidden", !isDev);

  db.collection("users").doc(user.uid).get().then(doc => {
    if (doc.exists && doc.data().avatar) {
      document.getElementById("profile-avatar").src = doc.data().avatar;
    }
  });
}

// ================= EDIT PROFILE PICTURE =================
async function editProfilePicture() {
  if (!currentUser) return;
  const newUrl = prompt("Enter new Profile Picture Image URL:");
  if (newUrl && newUrl.trim()) {
    const url = newUrl.trim();
    await db.collection("users").doc(currentUser.uid).set({ avatar: url }, { merge: true });
    document.getElementById("profile-avatar").src = url;
    alert("Profile picture updated!");
  }
}

// ================= POSTING & REPOSTING =================
async function submitNewPost() {
  const text = document.getElementById("composer-text").value.trim();
  const mediaUrl = document.getElementById("composer-media").value.trim();
  if (!text && !mediaUrl) return;

  const isDev = currentUser?.email === "moulaylhani@gmail.com";
  const newPost = {
    id: `custom_${Date.now()}`,
    authorUid: currentUser.uid,
    authorName: currentUser.email.split("@")[0],
    authorHandle: `@${currentUser.email.split("@")[0]}`,
    authorAvatar: document.getElementById("profile-avatar").src,
    text: text,
    mediaUrl: mediaUrl,
    likesCount: 0,
    repostsCount: 0,
    isLiked: false,
    isReposted: false,
    comments: []
  };

  GENERATED_200_POSTS.unshift(newPost);
  document.getElementById("composer-text").value = "";
  document.getElementById("composer-media").value = "";
  renderFeed();
}

function deletePost(postId) {
  if (!confirm("Delete this post?")) return;
  const idx = GENERATED_200_POSTS.findIndex(p => p.id === postId);
  if (idx !== -1) {
    GENERATED_200_POSTS.splice(idx, 1);
    renderFeed();
  }
}

function toggleLike(postId) {
  const post = GENERATED_200_POSTS.find(p => p.id === postId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;
    renderFeed();
  }
}

function toggleRepost(postId) {
  const post = GENERATED_200_POSTS.find(p => p.id === postId);
  if (post) {
    post.isReposted = !post.isReposted;
    post.repostsCount += post.isReposted ? 1 : -1;
    renderFeed();
  }
}

// ================= RENDER FEED (200+ POSTS & GOLD BADGES) =================
function renderFeed() {
  const feed = document.getElementById("feed-container");
  if (!feed) return;
  feed.innerHTML = "";

  GENERATED_200_POSTS.forEach((post) => {
    const isMyPost = currentUser && post.authorUid === currentUser.uid;
    const postEl = document.createElement("div");
    postEl.className = "post";

    postEl.innerHTML = `
      <div class="post-header">
        <div class="user-info" onclick="openUserProfile('${post.authorUid}')">
          <img src="${post.authorAvatar}" class="user-avatar">
          <div>
            <div style="font-weight:600; font-size:14px; display:flex; align-items:center;">
              ${post.authorName}
              <i class="fa-solid fa-circle-check golden-badge" title="Verified Account"></i>
            </div>
            <div style="font-size:11px; color:#888;">${post.authorHandle}</div>
          </div>
        </div>
        ${isMyPost ? `<i class="fa-solid fa-trash-can" style="color:#ff3b30; cursor:pointer; font-size:13px;" onclick="deletePost('${post.id}')"></i>` : ''}
      </div>
      
      <div style="font-size:13px; line-height:1.4;">${post.text}</div>
      ${post.mediaUrl ? `<div class="post-media"><img src="${post.mediaUrl}" loading="lazy"></div>` : ''}

      <div class="post-actions">
        <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
          <i class="${post.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          <span>${post.likesCount}</span>
        </button>
        <button class="action-btn ${post.isReposted ? 'reposted' : ''}" onclick="toggleRepost('${post.id}')">
          <i class="fa-solid fa-retweet"></i>
          <span>${post.repostsCount}</span>
        </button>
      </div>
    `;
    feed.appendChild(postEl);
  });
}

// ================= NOTES (5-HR EXPIRATION & DELETION) =================
function renderNotes() {
  const rail = document.getElementById("notes-slider");
  if (!rail) return;

  const now = Date.now();
  USER_NOTES = USER_NOTES.filter(n => (now - n.createdAt) < NOTE_EXPIRATION_MS);

  rail.innerHTML = `
    <div class="note-item" onclick="promptAddNote()">
      <div class="note-avatar-wrapper">
        <img src="${document.getElementById('profile-avatar')?.src || 'https://picsum.photos/seed/self/100/100'}" class="note-avatar" style="border-style:dashed;">
        <div class="note-bubble-badge" style="background:#30d158;">+ Note</div>
      </div>
      <span style="font-size:11px; margin-top:4px; color:#aaa;">Add Note</span>
    </div>
  ` + USER_NOTES.map(n => `
    <div class="note-item" onclick="handleNoteClick('${n.id}', '${n.uid}')">
      <div class="note-avatar-wrapper">
        <img src="${n.avatar}" class="note-avatar">
        <div class="note-bubble-badge">${n.text}</div>
      </div>
      <span style="font-size:11px; margin-top:4px; color:#aaa;">${n.name}</span>
    </div>
  `).join('');
}

function promptAddNote() {
  const text = prompt("Share a note (max 30 chars, disappears in 5 hrs):");
  if (text && text.trim()) {
    USER_NOTES.unshift({
      id: `note_${Date.now()}`,
      uid: currentUser ? currentUser.uid : "self",
      name: "You",
      avatar: document.getElementById("profile-avatar").src,
      text: text.trim().substring(0, 30),
      createdAt: Date.now()
    });
    renderNotes();
  }
}

function handleNoteClick(noteId, authorUid) {
  if (currentUser && (authorUid === currentUser.uid || authorUid === "self")) {
    if (confirm("Delete your note?")) {
      USER_NOTES = USER_NOTES.filter(n => n.id !== noteId);
      renderNotes();
    }
  } else {
    openUserProfile(authorUid);
  }
}

// ================= MESSAGES & INTERACTION =================
function renderMessagesList() {
  const container = document.getElementById("msg-list");
  if (!container) return;
  container.innerHTML = CREATOR_POOL.slice(0, 3).map(user => `
    <div class="msg-item" onclick="openChat('${user.name}')">
      <img src="${user.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover;">
      <div>
        <div style="font-weight:600; font-size:14px;">${user.name} <i class="fa-solid fa-circle-check golden-badge"></i></div>
        <div style="font-size:12px; color:#888;">Tap to open chat conversation...</div>
      </div>
    </div>
  `).join('');
}

function openChat(userName) {
  activeChatPartner = userName;
  document.getElementById("chat-user-header").innerText = userName;
  switchView("chat-conversation");
  renderChatStream();
}

function renderChatStream() {
  const stream = document.getElementById("chat-messages-container");
  const msgs = DIRECT_MESSAGES["usr_1"] || [];
  stream.innerHTML = msgs.map(m => `
    <div class="chat-bubble ${m.sender === 'me' ? 'sent' : 'received'}">${m.text}</div>
  `).join('');
}

function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-message-input");
  if (!input.value.trim()) return;
  if (!DIRECT_MESSAGES["usr_1"]) DIRECT_MESSAGES["usr_1"] = [];
  DIRECT_MESSAGES["usr_1"].push({ sender: "me", text: input.value.trim() });
  input.value = "";
  renderChatStream();
}

// ================= EXPLORE & EXTERNAL PROFILES =================
function renderExploreGrid() {
  const grid = document.getElementById("explore-grid");
  if (!grid) return;
  grid.innerHTML = GENERATED_200_POSTS.slice(0, 30).map(p => `
    <div class="grid-item" onclick="openUserProfile('${p.authorUid}')">
      <img src="${p.mediaUrl}" loading="lazy">
    </div>
  `).join('');
}

function openUserProfile(uid) {
  if (currentUser && uid === currentUser.uid) {
    switchView('profile');
    return;
  }
  const creator = CREATOR_POOL.find(c => c.avatar.includes(uid)) || CREATOR_POOL[0];
  const container = document.getElementById("user-profile-view");
  container.innerHTML = `
    <div class="header">
      <div class="header-left" onclick="switchView('home')"><i class="fa-solid fa-chevron-left"></i> <span>Back</span></div>
    </div>
    <div class="profile-header">
      <img src="${creator.avatar}" class="profile-avatar" style="width:80px; height:80px; border-radius:50%;">
      <div class="profile-name-badges" style="margin-top:10px;">
        ${creator.name} <i class="fa-solid fa-circle-check golden-badge"></i>
      </div>
      <div class="profile-bio">${creator.handle} • Verified Creator</div>
      <button onclick="openChat('${creator.name}')" class="glass-btn sm" style="margin-top:10px;">Message</button>
    </div>
    <div class="profile-grid">
      ${GENERATED_200_POSTS.filter(p => p.authorName === creator.name).map(p => `<div class="grid-item"><img src="${p.mediaUrl}"></div>`).join('')}
    </div>
  `;
  switchView('user-profile');
}
