import { logger } from './logger';
import { type ConfigData, DeviceOrientation, DisplayMode, type Manifest, type ManifestIconData } from './interfaces';
import json5 from 'json5';
import sharp from 'sharp';
import png2icons from 'png2icons';
import express from 'express';
import http from 'http';
import https from 'https';
import dns2 from 'dns2';
import { Packet } from 'dns2';
import open from 'open';

const path:string = import.meta.dir + '/..';
const conf:ConfigData = json5.parse(await Bun.file(`${path}/srvconfig.json`).text());

let appManifest:Manifest =
{
	name:'My Cool App',
	start_url:'/',
	display:DisplayMode.Standalone,
	orientation:DeviceOrientation.Any
};
let iconData:Array<Buffer> = [ ];
let favicon:Buffer | null = null;
let largestIcon:number;

Bun.serve(
{
	fetch(req, srv)
	{
		if (srv.upgrade(req))
			return;

		return new Response('Upgrade failed', { status:500 });
	},
	websocket:
	{
		open(ws)
		{
			logger.info(`[WS] (${ws.remoteAddress}) Connection opened`);
		},
		message(ws, msg)
		{
			const index:number = msg.toString('utf8').indexOf('::');
			let op:string = (index != -1) ? msg.slice(0, index).toString('utf8') : msg.toString('utf8');
			let args:Array<string> = msg.toString('utf8').substring(index + 2).split('\0');

			logger.info(`[WS] (${ws.remoteAddress}) Recv: '${op}'`);

			switch (op)
			{
				case 'getManifest':
					ws.send('getManifestRes::' + JSON.stringify(appManifest));
					break;
				case 'setManifest':
					appManifest = JSON.parse(args[0]);
					if (args.length >= 2)
						processIcons(args[1]);
					ws.send('acknowledged');
					break;
			}
		},
		close(ws, code, reason)
		{
			logger.info(`[WS] (${ws.remoteAddress}) Connection closed <code:${code}>`);
		}
	},

	hostname:conf.ws.host,
	port:conf.ws.port
});

const expressApp = express();
const httpServer = http.createServer(expressApp);
const httpsServer = https.createServer({ key:await Bun.file(`${path}/cert/homeappify.key`).text(), cert:await Bun.file(`${path}/cert/homeappify.crt`).text() }, expressApp);

expressApp.get('/', (req, res) =>
{
	let icons:string = '';
	if (iconData.length > 0)
		icons += `<link rel="apple-touch-icon" href="icon-${conf.pwa.iconSizes[largestIcon]}.png">`;

	res.header('Cache-Control', 'no-cache, no-store');
	res.type('text/html');
	res.send(`<html><head><link rel="manifest" href="manifest.json">${icons}</head><body><p style="font-size:1.5em;font-family:serif">You can now install this as a progressive web application!</p></body></html>`);
});

expressApp.get('/forcehttp', (req, res) =>
{
	res.redirect(301, `http://${req.headers.host}`);
});

expressApp.get('/manifest.json', (req, res) =>
{
	res.header('Cache-Control', 'no-cache, no-store');
	res.type('application/json');
	res.send(JSON.stringify(appManifest));
});

expressApp.get('/favicon.ico', (req, res) =>
{
	res.header('Cache-Control', 'no-cache, no-store');
	if (favicon != null)
	{
		res.type('image/x-icon');
		res.send(favicon);
	}
	else
	{
		res.send('No data');
	}
});

conf.pwa.iconSizes.forEach((size, index) =>
{
	expressApp.get(`/icon-${size}.png`, (req, res) =>
	{
		res.header('Cache-Control', 'no-cache, no-store');
		if (iconData[index] != null)
		{
			res.type('image/png');
			res.send(iconData[index]);
		}
		else
		{
			res.send('No data');
		}
	});
});

const rerouter = dns2.createServer(
{
	udp:true,
	handle:(req, send, rinfo) =>
	{
		const res = Packet.createResponseFromRequest(req);
		const [ question ] = req.questions;
		const { name } = question;

		logger.info(`[RS] (${rinfo.address}:${rinfo.port}) DNS request <name:${name}>`);

		res.answers.push(
		{
			name,
			type:Packet.TYPE.A,
			class:Packet.CLASS.IN,
			ttl:300,
			address:conf.dns.reroute
		});
		send(res);
	}
});

async function processIcons(buf:string):Promise<void>
{
	const img = sharp(Buffer.from(buf, 'base64'));
	const meta = await img.metadata();

	logger.info(`[PR] Processing icons <input width:${meta.width} height:${meta.height}>`);

	iconData = [ ];
	let iconManifest:Array<ManifestIconData> = [ ];
	for (let i = 0, largest = 0; i < conf.pwa.iconSizes.length; i++)
	{
		const split:Array<number> = conf.pwa.iconSizes[i].split('x').map(v => parseInt(v));
		const clone = img.clone();

		clone.resize(split[0], split[1]);
		iconData.push(await clone.png().toBuffer());

		iconManifest.push({ src:'icon-' + conf.pwa.iconSizes[i] + '.png', sizes:conf.pwa.iconSizes[i], type:'image/png' });

		let product:number = split[0] * split[1];
		if (product > largest)
		{
			largest = product;
			largestIcon = i;
		}
	};

	favicon = png2icons.createICO(await img.toBuffer(), png2icons.BEZIER, 0, true);

	if (favicon != null)
		iconManifest.push({ src:'favicon.ico', sizes:'16x16 24x24 32x32 48x48 64x64 72x72 96x96 128x128 256x256', type:'image/x-icon' });
	appManifest.icons = iconManifest;

	logger.info(`[PR] Processed ${conf.pwa.iconSizes.length + (favicon != null ? 1 : 0)} icons`);
}

httpServer.listen(conf.http.port, conf.http.host);
httpsServer.listen(conf.https.port, conf.https.host);

rerouter.listen(
{
	udp:{ address:conf.dns.host, port:conf.dns.port }
});

open(`${import.meta.dir}/ui/dnsgui.html`);