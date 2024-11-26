function range(s, e) {
	let arr = [];
	for(let i = s; i <= e; i++) arr.push(i);
	return arr;
}

function msavatar({skin, spritew, spriteh, n, m, anims}) {
	let $floaty = $('<div>').css({
		'width': spritew + 'px',
		'height': spriteh + 'px',
		'position': 'absolute',
		top: Math.floor((document.body.offsetHeight-spriteh)*Math.random())+'px',
		left: Math.floor((document.body.offsetWidth-spritew)*Math.random())+'px'
	})
	let $canv = $('<canvas>').css({
		'width': spritew + 'px',
		'height': spriteh + 'px',
	}).attr({
		'width': spritew.toString(),
		'height': spriteh.toString()
	});
	let $textbox = $('<div>').addClass('agent-textbox');
	let $namebox = $('<div>').addClass('agent-namebox');

	$textbox.hide();
	$floaty.append($canv);
	$floaty.append($namebox);
	$floaty.append($textbox);
	$floaty.draggable({
		containment: $('#desktop')
	});
	$('#desktop').append($floaty);

	let ctx = $canv[0].getContext('2d');
	let animiid = null;

	function drawframe(frame) {
		let sx = (frame % n) * spritew;
		let sy = Math.floor(frame / n) * spriteh;
		ctx.clearRect(0, 0, spritew, spriteh);
		ctx.drawImage(skin, sx, sy, spritew, spriteh, 0, 0, spritew, spriteh);
	}

	skin.onload = () => {
		if(!animiid) drawframe(anims['idle'].frames[0]);
	}

	return {
		destroy: () => $floaty.remove(),
		play: (ai) => {
			return new Promise(resolve => {
				if(animiid) clearInterval(animiid);
				let counter = 0;
				drawframe(anims[ai][0]);
				animiid = setInterval(() => {
					if(++counter >= anims[ai].frames.length)
						return (clearInterval(animiid), animiid = null, resolve());
					drawframe(anims[ai].frames[counter]);
				}, 1000/anims[ai].speed);
			});
		},
		showText: (text) => $textbox.text(text).show(),
		hideText: () => $textbox.hide(),
		setName: (name) => $namebox.text(name),
		elem: $floaty
	}
}

function bonzipreset() {
	return msavatar({
		skin: (i => (i.src = '/static/agents/red.png', i))(new Image()),
		spritew: 200,
		spriteh: 160,
		n: 17,
		m: 21,
		anims: {
			idle: {speed: 1000, frames: [0]},
			join: {speed: 30,   frames: [...range(277, 302), 0]},
			left: {speed: 30,   frames: range(16, 39)}
		}
	});
}
