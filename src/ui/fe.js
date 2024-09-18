let ws = null;
let overlay;
let inputs = { };
let uploader;
let iconbuf = null;

document.addEventListener('DOMContentLoaded', () =>
{
	overlay = document.querySelector('#overlay');
	inputs.name = document.querySelector('#input-app-name');
	inputs.short_name = document.querySelector('#input-short-name');
	inputs.start_url = document.querySelector('#input-start-url');
	inputs.display = document.querySelector('#input-display');
	inputs.orientation = document.querySelector('#input-orientation');
	inputs.background_color = document.querySelector('#input-bg-color');
	inputs.theme_color = document.querySelector('#input-theme-color');
	uploader = document.querySelector('#icon-upload');

	ws = new WebSocket('ws://127.0.0.1:6553/');

	let wasConnected = false;

	ws.addEventListener('open', e =>
	{
		wasConnected = true;
		ws.send('getManifest');
		hideOverlay();
	});

	ws.addEventListener('message', e =>
	{
		//console.log(e);

		const index = e.data.indexOf('::');
		let op = (index != -1) ? e.data.slice(0, index) : e.data;
		let args = e.data.substring(index + 2).split('\0');

		console.log(op, args);

		switch (op)
		{
			case 'acknowledged':
				if (ws.readyState == WebSocket.OPEN)
					hideOverlay();
				break;
			case 'getManifestRes':
				var manifest = JSON.parse(args[0]);
				checkValue(manifest, 'name', '');
				checkValue(manifest, 'short_name', '');
				checkValue(manifest, 'start_url', '');
				checkValue(manifest, 'display', 'standalone');
				checkValue(manifest, 'background_color', '#000000');
				checkValue(manifest, 'theme_color', '#000000');
				checkValue(manifest, 'orientation', 'any');
				break;
		}
	});

	ws.addEventListener('close', e =>
	{
		console.warn('Connection lost');

		let pre = (wasConnected ? 'Connection lost' : 'Failed to connect') + '.\n\nThis tab will automatically close in ';
		let timeleft = 5;
		popupOverlay(pre + timeleft + '...');
		setInterval(() =>
		{
			timeleft--;
			if (timeleft <= 0)
				window.close();
			setPopupLabel(pre + timeleft + '...');
		}, 1000);
	});

	const iconbox = document.querySelector('#icon-box');

	uploader.addEventListener('change', e =>
	{
		if (uploader.files.length <= 0)
			return;

		console.log(uploader.files[0]);

		const reader = new FileReader();
		reader.onloadend = () =>
		{
			iconbuf = reader.result;
			//console.log('icon-buf:', iconbuf);
			iconbox.style.backgroundImage = 'url(' + iconbuf + ')';
			iconbox.setAttribute('has-image', 'true');
		};
		reader.readAsDataURL(uploader.files[0]);
	});

	iconbox.addEventListener('click', e =>
	{
		uploader.click();
	});

	document.querySelector('#submit').addEventListener('click', e =>
	{
		popupOverlay('Sending manifest update...', true);

		let manifest = { };
		Object.keys(inputs).forEach(key =>
		{
			if (inputs[key].value.length > 0 && !(inputs[key].id.endsWith('color') && inputs[key].value == '#000000'))
				manifest[key] = inputs[key].value;
		});

		let msg = 'setManifest::' + JSON.stringify(manifest);
		if (iconbuf != null)
		{
			const index = iconbuf.indexOf(',');
			msg += '\0' + iconbuf.substring(index + 1);
		}
		ws.send(msg);
	});
}, { 'once':true });

function hideOverlay()
{
	setTimeout(() =>
	{
		overlay.setAttribute('hide', '');
	}, 200);
}

function popupOverlay(text = null, showLoader = false)
{
	overlay.removeAttribute('hide');
	if (text != null)
		setPopupLabel(text);
	overlay.querySelector('.loader').style.display = showLoader ? '' : 'none';
}

function setPopupLabel(text)
{
	overlay.querySelector('.label').innerText = text;
}

function checkValue(manifest, key, defaults)
{
	inputs[key].value = (manifest[key] != undefined) ? manifest[key] : defaults;
}