
window.tts = {};

$(document).ready(() => {

	/*
	 * {id, name, skin, avatar}
	 */
	let users = [];

	let myname, myskin, myroom;

	const socket = io();
	const skins = ['red'];

	const startmenu = $('<div class="window start-menu">');
	startmenu.hide();
	$('body').append(startmenu);
	$('#start-btn').click(() => startmenu.toggle());

	let win = mswindow({
		title: 'Join the chat',
		width: 250,
		height: 150,
		resizable: false,
		unclosable: true,
		body: $('<form>')
			.on('submit', e => {
				e.preventDefault();
				socket.emit('user joined', {
					'room': myroom = e.target['room'].value,
					'name': myname = e.target['name'].value,
					'skin': myskin = e.target['skin'].value
				});
				win.destroy();
				$('#toolbar').show();
			})
			.html(`
			<table>
				<tr>
					<td style="width: 100px"><b> Name: </b></td>
					<td> <input type="text" name="name" style="width: 100%"/> </td>
				</tr>
				<tr>
					<td><b> Skin: </b></td>
					<td>
						<select name="skin" style="width: 100%">
							${skins.map(skin => '<option value="' + skin + '">' + skin + '</option>').join('\n')}
						</select>
					</td>
				</tr>
				<tr>
					<td style="width: 100px"><b> Room: </b></td>
					<td> <input type="text" name="room" style="width: 100%"/> </td>
				</tr>
				<tr>
					<td> </td>
					<td> <button> Join </button> </td>
				</tr>
			</table>
			`)
	});

	$('#msg-form').on('submit', e => {
		e.preventDefault();
		let text = e.target['message'].value;
		let mgroups;
		if(mgroups = text.match(/^\/(\w+)(?:\s+(.*))?$/)) {
			let [cmd, arg] = mgroups.slice(1);
			if(cmd == 'name') {
				myname = arg;
				socket.emit('user joined', {
					room: myroom,
					name: myname,
					skin: myskin
				});
			} else
			if(cmd == 'skin') {
				myskin = arg;
				socket.emit('user joined', {
					room: myroom,
					name: myname,
					skin: myskin
				});
			} else {
				msalert("Bad command!");
			}
		} else {
			socket.emit('message', text);
		}
		e.target['message'].value = '';
	});

	socket.on('update users', upd => {
		const cmpfn = (a, b) => a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
		const setremove = function(s1, s2) {
			let rez = [];
			let i, j;
			for(i = 0, j = 0; i < s2.length && j < s1.length; ++i) {
				while(j < s1.length && s1[j].id < s2[i].id)
					rez.push(s1[j++]);
				if(s1[j].id == s2[i].id) ++j;
			}
			for(; j < s1.length; ++j) rez.push(s1[j]);
			return rez;
		}
		upd.sort(cmpfn);
		let joined = setremove(upd, users);
		let left = setremove(users, upd);
		let stayed = setremove(users, left);
		let stayed_changes = setremove(upd, left);
		for(let user of joined) {
			user.avatar = bonzipreset();
			user.avatar.setName(user.name);
			user.avatar.play('join');
		}
		for(let user of left) {
			user.avatar.play('left').then(() => user.avatar.destroy());
		}
		for(let i = 0; i < stayed.length; i++) {
			if(stayed[i].name != stayed_changes[i].name) {
				stayed[i].name = stayed_changes[i].name;
				stayed[i].avatar.setName(stayed_changes[i].name);
			}
			if(stayed[i].skin != stayed_changes[i].skin) {
				stayed[i].skin = stayed_changes[i].skin;
			}
		}
		users = [...joined, ...stayed];
		users.sort(cmpfn);
	})

	socket.on('message', data => {
		let u = users.filter(x => x.id == data.id)[0];
		speak.play(data.message, u.id, {}, () => {
			u.avatar.hideText();
		}, () => {
			u.avatar.showText(data.message);
		});
	});
});
