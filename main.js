const anyproxy = require('anyproxy');

const proxyOptions =
{
	forceProxyHttps:true,
	port:8000,
	rule:require('./webappify.js')
};
var proxy = new anyproxy.ProxyServer(proxyOptions);	

proxy.on('error', e =>
{
	console.error(e);
});

proxy.start();