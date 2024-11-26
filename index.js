const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

var db_connected = false;

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
	socket.on("user joined", async (data) => {
		let row = await new Promise(resolve => {
			db.get('SELECT id FROM banned_ips WHERE ip = ?', [socket.request.connection.remoteAddress], (err, row) => {
				resolve(row);
			})
		});
		if(row) return socket.emit('alert', 'You have been banned.');
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
				ip: socket.request.connection.remoteAddress,
				perms: 0,
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

	socket.on("modauth", (pass) => {
		db.get('SELECT perms FROM mods WHERE pass = ?', [pass], (err, row) => {
			if(row) {
				user.perms = row.perms;
				socket.emit('alert', 'Welcome back mr moderator.');
				socket.emit('modsetup');
			}
			else socket.emit('alert', 'You have been IP logged ;D');
		});
	});

	socket.on("ban", (id) => {
		if(!user.perms) return;
		let u = users.filter(x => x.id == id);
		if(!u.length) return socket.emit('alert', 'User not found!');
		u = u[0];
		if(u.perms >= user.perms) return socket.emit('alert', 'User has too high perms.');
		db.run('INSERT INTO banned_ips (ip) VALUES (?)', [u.ip], (err) => {
			if(!err) socket.emit('alert', 'User banned');
			else socket.emit('alert', 'Error: ' + err);
		});
		users.filter(u => u.id == id).forEach(u => u.socket.disconnect());
		users = users.filter(u => u.id != id);
		let us = users.toSorted((a, b) => a.room < b.room ? -1 : (a.room > b.room ? 1 : 0));
		let rds = [], j = 0;
		for(let i = 1; i < us.length+1; i++) {
			if(i == us.length || us[i].room != us[j].room) {
				rds.push(us.splice(j, i - j));
				j = i;
			}
		}
		for(let g of rds) {
			let upd = g.map(u => ({name: u.name, skin: u.skin, id: u.id}));
			g.forEach(u => u.socket.emit('update users', upd));
		}
	});

	socket.on("getip", (id) => {
		if(!user.perms) return;
		let u = users.filter(x => x.id == id);
		if(!u.length) return socket.emit('alert', 'User not found!');
		u = u[0];
		if(u.perms >= user.perms) return socket.emit('alert', 'User has too high perms.');
		socket.emit('alert', "User's ip: " + u[0].ip);
	});

	// Handle user disconnect
	socket.on("disconnect", () => {
		if(!user) return;
		users = users.filter((u) => u.id !== user.id);
		let upd = users.filter(u => u.room == user.room).map(u => ({id: u.id, name: u.name, skin: u.skin}));
		users.forEach(u => u.room == user.room && u.socket.emit('update users', upd));
	});
});

const db = new sqlite3.Database("stuff.db", (err) => {
	if (err) {
		console.error('Could not open database:', err.message);
		return;
	}
	console.log('Connected to the SQLite database.');

	// Start the server
	const PORT = process.env.PORT || 8000;
	server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});

