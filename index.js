const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files and HTML
app.use("/static", express.static(__dirname + "/public/static"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));

// Users array to track connected users
let users = [];

// Socket.IO server
io.on("connection", (socket) => {

	let user = null;

	// Handle "user joined" event
	socket.on("user joined", (data) => {
		if(!data) return;
		let good = s => typeof s == 'string' && s.length < 256 && s.length > 0 && s.indexOf('\n') == -1;
		let cnfb = (s, fb) => good(s) ? s : fb
		if(user) {
			user.name = cnfb(data.name, 'anonymous');
			user.skin = cnfb(data.skin, 'red');
		} else {
			user = {
				id: Math.random().toString().slice(2),
				room: cnfb(data.room, 'general'),
				name: cnfb(data.name, 'anonymous'),
				skin: cnfb(data.skin, 'red'),
				socket
			};
			users.push(user);
		}
		let upd = users.filter(u => u.room == user.room).map(u => ({id: u.id, name: u.name, skin: u.skin}));
		users.forEach(u => u.room == user.room && u.socket.emit('update users', upd));
	});

	// Handle "message" event
	socket.on("message", (msg) => {
		if(!msg) return;
		if (user) {
			let data = {id: user.id, message: msg};
			users.forEach(u => u.room == user.room && u.socket.emit('message', data));
		}
	});

	// Handle user disconnect
	socket.on("disconnect", () => {
		if(!user) return;
		users = users.filter((u) => u.socket.id !== socket.id);
		let upd = users.filter(u => u.room == user.room).map(u => ({id: u.id, name: u.name, skin: u.skin}));
		users.forEach(u => u.room == user.room && u.socket.emit('update users', upd));
	});
});

// Start the server
const PORT = 8000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
