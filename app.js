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
let unsubscribeChatListener = null;
let activePostForComments = null;

// Creator Pool & Posts Data
const CREATOR_POOL = [
  { uid: "usr_1", name: "Aria Thorne", handle: "@aria_t", avatar: "https://picsum.photos/seed/aria/150/150" },
  { uid: "usr_2", name: "Kaelen Voss", handle: "@voss_art", avatar: "https://picsum.photos/seed/kaelen/150/150" },
  { uid: "usr_3", name: "Elena Rostova", handle: "@elena_design", avatar: "https://picsum.photos/seed/elena/150/150" },
  { uid: "usr_4", name: "Marcus Brody", handle: "@brody_film", avatar: "https://picsum.photos/seed/marcus/150/150" },
  { uid: "usr_5", name: "Moulay Lhani", handle: "@moulay_lhani", avatar: "https://picsum.photos/seed/moulay/150/150" }
];

const TRENDS_DATA = [
  { category: "Technology • Trending", tag: "#Web3UI", posts: "24.5K posts" },
  { category: "Design • Trending", tag: "#Glassmorphism", posts: "18.2K posts" },
  { category: "Artificial Intelligence", tag: "#GeminiPro", posts: "142K posts" },
  { category: "Software • Trending", tag: "#FirebaseCore", posts: "9.8K posts" }
];

const GENERATED_200_POSTS = Array.from({ length: 50 }, (_, i) => {
  const creator = CREATOR_POOL[i % CREATOR_POOL.length];
  return {
    id: `post_${i + 1}`,
    authorUid: creator.uid,
    authorName: creator.name,
    authorHandle: creator.handle,
    authorAvatar: creator.avatar,
    text: `Exploring dynamic physics and luxury interfaces. #${i + 1}`,
    mediaUrl: `https://picsum.photos/seed/feed_${i + 100}/800/800`,
    isVideo: false,
    likesCount: Math.floor((i * 13) % 240) + 12,
    repostsCount: Math.floor((i * 3) % 45) + 2,
    comments: [
      { author: "Elena", text: "Looks incredible 🔥" },
      { author: "Marcus", text: "Clean dynamic layout!" }
    ],
    isLiked: false,
    isReposted: false
  };
});

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function updateComposerFileLabel(input) {
  document.getElementById("composer-file-name").innerText = input.files.length > 0 ? input.files[0].name : "";
}

function updateChatFileLabel(input) {
  document.getElementById("chat-file-indicator").classList.toggle("hidden", input.files.length === 0);
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId + '-view');
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  let navKey = viewId;
  if (['settings', 'chat-conversation', 'user-profile'].includes(viewId)) navKey = 'messages';
  const activeNav = document.querySelector(`.nav-item[data-target="${navKey}"]`);
  if (activeNav) activeNav.classList.add('active');
}

// Auth Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    switchView('home');
    setupUserProfile(user);
    renderStories();
    renderFeed();
    renderTrends();
    renderExploreGrid();
    renderMessagesList();
  } else {
    currentUser = null;
    switchView('auth');
  }
});

function setupUserProfile(user) {
  const isDev = user.email === "moulaylhani@gmail.com";
  const username = user.email ? user.email.split("@")[0] : "user";
  
  document.getElementById("profile-username").innerText = username;
  document.getElementById("header-handle").innerText = `@${username}`;
  document.getElementById("badge-dev").classList.toggle("hidden", !isDev);
  document.getElementById("badge-og").classList.toggle("hidden", !isDev);
}

// Render Instagram Stories Bar
function renderStories() {
  const container = document.getElementById("stories-slider");
  if (!container) return;
  container.innerHTML = CREATOR_POOL.map((creator, idx) => `
    <div class="story-item" onclick="viewStory('${creator.name}')">
      <div class="story-ring ${idx > 2 ? 'seen' : ''}">
        <img src="${creator.avatar}">
      </div>
      <span class="story-username">${creator.name.split(' ')[0]}</span>
    </div>
  `).join('');
}

// Render X-Style Trends
function renderTrends() {
  const list = document.getElementById("trends-list");
  if (!list) return;
  list.innerHTML = TRENDS_DATA.map(t => `
    <div class="trend-card">
      <div class="trend-category">${t.category}</div>
      <div class="trend-tag">${t.tag}</div>
      <div class="trend-posts">${t.posts}</div>
    </div>
  `).join('');
}

// Render Main Feed
function renderFeed() {
  const feed = document.getElementById("feed-container");
  if (!feed) return;
  feed.innerHTML = "";

  GENERATED_200_POSTS.forEach((post) => {
    const postEl = document.createElement("div");
    postEl.className = "post";

    let mediaHTML = post.mediaUrl ? `
      <div class="post-media" onclick="handleDoubleTap('${post.id}', event)">
        <img src="${post.mediaUrl}" loading="lazy">
        <i class="fa-solid fa-heart heart-burst" id="burst-${post.id}"></i>
      </div>` : '';

    postEl.innerHTML = `
      <div class="post-header">
        <div class="user-info" onclick="openUserProfile('${post.authorUid}')">
          <img src="${post.authorAvatar}" class="user-avatar">
          <div>
            <div style="font-weight:600; font-size:14px; display:flex; align-items:center;">
              ${post.authorName}
              <i class="fa-solid fa-circle-check golden-badge glow-gold"></i>
            </div>
            <div style="font-size:11px; color:#888;">${post.authorHandle}</div>
          </div>
        </div>
      </div>
      
      <div style="font-size:13px; line-height:1.4;">${post.text}</div>
      ${mediaHTML}

      <div class="post-actions">
        <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
          <i class="${post.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          <span>${post.likesCount}</span>
        </button>
        <button class="action-btn" onclick="openComments('${post.id}')">
          <i class="fa-regular fa-comment"></i>
          <span>${post.comments.length}</span>
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

// Double Tap Heart Physics
let lastTap = 0;
function handleDoubleTap(postId, event) {
  const now = new Date().getTime();
  const timespan = now - lastTap;
  if (timespan < 300 && timespan > 0) {
    const burst = document.getElementById(`burst-${postId}`);
    if (burst) {
      burst.classList.add("animate");
      setTimeout(() => burst.classList.remove("animate"), 800);
    }
    const post = GENERATED_200_POSTS.find(p => p.id === postId);
    if (post && !post.isLiked) toggleLike(postId);
  }
  lastTap = now;
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

// Instagram Bottom Comments Drawer
function openComments(postId) {
  activePostForComments = postId;
  const post = GENERATED_200_POSTS.find(p => p.id === postId);
  const container = document.getElementById("comments-container");
  
  container.innerHTML = post.comments.map(c => `
    <div style="font-size:13px; background:rgba(255,255,255,0.04); padding:10px; border-radius:12px;">
      <strong style="color:var(--accent);">${c.author}:</strong> ${c.text}
    </div>
  `).join('');

  document.getElementById("comments-sheet").classList.add("open");
  document.getElementById("sheet-backdrop").classList.add("visible");
}

function closeComments() {
  document.getElementById("comments-sheet").classList.remove("open");
  document.getElementById("sheet-backdrop").classList.remove("visible");
}

function submitComment(e) {
  e.preventDefault();
  const input = document.getElementById("comment-input");
  if (!input.value.trim() || !activePostForComments) return;

  const post = GENERATED_200_POSTS.find(p => p.id === activePostForComments);
  post.comments.push({
    author: currentUser.email.split("@")[0],
    text: input.value.trim()
  });

  input.value = "";
  openComments(activePostForComments);
  renderFeed();
}

// Direct Messaging & Explore Grid Functions
function renderMessagesList() {
  const container = document.getElementById("msg-list");
  if (!container) return;
  container.innerHTML = CREATOR_POOL.map(user => `
    <div class="msg-item interactive-hover" onclick="openChat('${user.uid}', '${user.name}', '${user.avatar}')" style="display:flex; gap:12px; padding:12px; align-items:center; cursor:pointer;">
      <img src="${user.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover;">
      <div>
        <div style="font-weight:600; font-size:14px;">${user.name} <i class="fa-solid fa-circle-check golden-badge glow-gold"></i></div>
        <div style="font-size:12px; color:#888;">Active now</div>
      </div>
    </div>
  `).join('');
}

function openChat(partnerUid, partnerName, partnerAvatar) {
  activeChatPartner = { uid: partnerUid, name: partnerName, avatar: partnerAvatar };
  document.getElementById("chat-user-header").innerText = partnerName;
  document.getElementById("chat-header-avatar").src = partnerAvatar;
  switchView("chat-conversation");
  listenToLiveMessages(partnerUid);
}

function getConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function listenToLiveMessages(partnerUid) {
  if (unsubscribeChatListener) unsubscribeChatListener();
  const conversationId = getConversationId(currentUser.uid, partnerUid);

  unsubscribeChatListener = db.collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
      const stream = document.getElementById("chat-messages-container");
      stream.innerHTML = "";

      snapshot.forEach(doc => {
        const msg = doc.data();
        const isMe = msg.senderUid === currentUser.uid;
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${isMe ? 'sent' : 'received'}`;
        bubble.innerText = msg.text;
        stream.appendChild(bubble);
      });
      stream.scrollTop = stream.scrollHeight;
    });
}

async function sendChatMessage(e) {
  e.preventDefault();
  const textInput = document.getElementById("chat-message-input");
  if (!textInput.value.trim()) return;

  const conversationId = getConversationId(currentUser.uid, activeChatPartner.uid);
  await db.collection("conversations").doc(conversationId).collection("messages").add({
    senderUid: currentUser.uid,
    text: textInput.value.trim(),
    createdAt: Date.now()
  });

  textInput.value = "";
}

function renderExploreGrid() {
  const grid = document.getElementById("explore-grid");
  if (!grid) return;
  grid.innerHTML = GENERATED_200_POSTS.slice(0, 24).map(p => `
    <div class="grid-item" style="aspect-ratio:1/1; overflow:hidden; border-radius:10px;">
      <img src="${p.mediaUrl}" style="width:100%; height:100%; object-fit:cover;">
    </div>
  `).join('');
}
