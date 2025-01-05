import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBV67s1bVA5mPUdRJDMYtg0QXAviHGj0LE",
  authDomain: "chattest-fa7a1.firebaseapp.com",
  projectId: "chattest-fa7a1",
  storageBucket: "chattest-fa7a1.appspot.com",
  messagingSenderId: "124598075226",
  appId: "1:124598075226:web:eb626080a09fd453283d63",
  measurementId: "G-FFFY13W0DH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const usersList = document.querySelector('.users-list');
  const chatBox = document.querySelector('.chat-box');
  const inputMessage = document.querySelector('.input-message');
  const sendBtn = document.getElementById('send-btn');
  const chattingUserName = document.getElementById('chatting-user-name');
  const welcomeName = document.getElementById('welcome-name');
  const logoutBtn = document.getElementById('logout-btn');
  const reactionMenu = document.getElementById('reaction-menu');
  let selectedUserId = null;
  let chatId = null;
  let selectedMessageId = null;

  // Request notification permission
  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        } else {
          console.warn('Notification permission denied.');
        }
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
    } else {
      console.warn('Notifications are not supported in this browser.');
    }
  }

  // Call notification permission request when the page loads
  requestNotificationPermission();

  window.onfocus = () => {
    document.title = "Mochat";
  };

  window.onblur = () => {
    document.title = "Mochat (Away)";
  };

  function linkify(text) {
    const urlPattern = /(\bhttps?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          welcomeName.textContent = userDoc.data().name;
        } else {
          const userName = prompt("Please enter your name:");
          if (userName && userName.trim() !== "") {
            await setDoc(doc(db, "users", user.uid), {
              name: userName,
              uid: user.uid,
              email: user.email
            });
            welcomeName.textContent = userName;
          }
        }
        loadUsers();
      } catch (error) {
        console.error("Error loading user:", error);
      }
    } else {
      window.location.href = 'login.html';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  async function loadUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      usersList.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        const userItem = document.createElement('li');
        userItem.textContent = user.name;
        userItem.dataset.id = doc.id;
        userItem.dataset.name = user.name;
        usersList.appendChild(userItem);
      });
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  function startChat(userId, userName) {
    const currentUserId = auth.currentUser.uid;
    selectedUserId = userId;
    chatId = currentUserId < selectedUserId ? `${currentUserId}_${selectedUserId}` : `${selectedUserId}_${currentUserId}`;
    chattingUserName.textContent = userName;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    onSnapshot(messagesRef, (snapshot) => {
      chatBox.innerHTML = '';
      snapshot.forEach((doc) => {
        const message = doc.data();
        const messageElement = document.createElement('div');
        messageElement.classList.add(message.sender === currentUserId ? 'sent' : 'received');
        messageElement.dataset.id = doc.id;

        const messageText = document.createElement('p');
        messageText.innerHTML = linkify(message.text);

        const messageTimestamp = document.createElement('small');
        if (message.timestamp) {
          messageTimestamp.textContent = formatTimestamp(message.timestamp.toMillis());
        }

        messageElement.appendChild(messageText);
        messageElement.appendChild(messageTimestamp);

        // Display reaction counts
        if (message.reactions) {
          const reactionContainer = document.createElement('div');
          for (let emoji in message.reactions) {
            const reactionCount = message.reactions[emoji];
            const reactionElement = document.createElement('span');
            reactionElement.innerText = `${emoji} ${reactionCount}`;
            reactionContainer.appendChild(reactionElement);
          }
          messageElement.appendChild(reactionContainer);
        }

        chatBox.appendChild(messageElement);

        // Right-click reaction menu
        messageElement.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          selectedMessageId = doc.id;
          reactionMenu.style.top = `${event.clientY}px`;
          reactionMenu.style.left = `${event.clientX}px`;
          reactionMenu.style.display = 'block';
        });
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }

  usersList.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
      startChat(event.target.dataset.id, event.target.dataset.name);
    }
  });

  function sendMessage() {
    if (inputMessage.value.trim()) {
      const messageText = inputMessage.value.trim();
      setDoc(doc(collection(db, 'chats', chatId, 'messages'), new Date().getTime().toString()), {
        text: messageText,
        sender: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        reactions: {}
      }).then(() => {
        inputMessage.value = '';
      }).catch((error) => {
        console.error("Error sending message:", error);
      });
    }
  }

  async function addReaction(reaction) {
    if (!selectedMessageId) return;

    const messageDoc = doc(db, 'chats', chatId, 'messages', selectedMessageId);
    const messageSnap = await getDoc(messageDoc);

    if (messageSnap.exists()) {
      const messageData = messageSnap.data();
      const reactions = messageData.reactions || {};

      if (reactions[reaction]) {
        reactions[reaction]++;
      } else {
        reactions[reaction] = 1;
      }

      await updateDoc(messageDoc, { reactions });
    }
    reactionMenu.style.display = 'none';
  }

  sendBtn.addEventListener('click', sendMessage);
  inputMessage.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  document.addEventListener('click', () => {
    reactionMenu.style.display = 'none';
  });

  window.addReaction = async function (reaction) {
    if (!selectedMessageId) return;
  
    const messageDoc = doc(db, 'chats', chatId, 'messages', selectedMessageId);
    const messageSnap = await getDoc(messageDoc);
  
    if (messageSnap.exists()) {
      const messageData = messageSnap.data();
      const reactions = messageData.reactions || {};
  
      if (reactions[reaction]) {
        reactions[reaction]++;
      } else {
        reactions[reaction] = 1;
      }
  
      await updateDoc(messageDoc, { reactions });
    }
    reactionMenu.style.display = 'none';
  };
  
});
