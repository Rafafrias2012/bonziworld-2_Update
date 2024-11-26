const socket = io();
let user = null;

// DOM elements
const userInfo = document.getElementById("user-info");
const chatBox = document.getElementById("chat-box");
const usersList = document.getElementById("users-list");
const messages = document.getElementById("messages");
const usernameInput = document.getElementById("username");
const skinInput = document.getElementById("skin");
const joinChatButton = document.getElementById("join-chat");
const messageInput = document.getElementById("message");
const sendMessageButton = document.getElementById("send-message");

// Join chat
joinChatButton.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    const skin = skinInput.value.trim();

    if (name && skin) {
        user = { name, skin };
        socket.emit("user joined", user);
        userInfo.classList.add("hidden");
        chatBox.classList.remove("hidden");
    }
});

// Send message
sendMessageButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("message", message);
        messageInput.value = "";
    }
});

// Update user list
socket.on("update users", (users) => {
    usersList.innerHTML = "Online Users:<br>" + users.map((u) => `${u.name} (${u.skin})`).join("<br>");
});

// Receive message
socket.on("message", (data) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${data.name} (${data.skin}): ${data.message}`;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});
