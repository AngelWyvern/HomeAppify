module.exports =
{
	summary:'WebAppify PWA Interceptor',
	*beforeSendResponse(requestDetail, responseDetail)
	{
		console.log(`... REQUEST URL: ${requestDetail.url} CONTENT-TYPE: ${responseDetail.response.header['Content-Type']} ...`);
		if (requestDetail.url.endsWith('/manifest.json'))
		{
			console.log('!!! MANIFEST REQUEST INTERCEPT !!!');
			var manifestResponse = { 'statusCode':200, 'header':{ 'Content-Type':'application/json' }, 'body':'{ "name":"WebAppify v1.0", "display": "standalone", "scope": "/", "start_url": "/" }' };
			return { response:manifestResponse };
		}
		else if (responseDetail.response.header['Content-Type'] && responseDetail.response.header['Content-Type'].includes('text/html'))
		{
			console.log('!!! HTML REQUEST INTERCEPT !!!');
			var modifiedResponse = responseDetail.response;
			modifiedResponse.body = modifiedResponse.body.toString().replace('<head>', '<head>\n<link rel="manifest" href="manifest.json">');
			return { response:modifiedResponse };
		}
	},
	*beforeDealHttpsRequest(requestDetail)
	{
		return true;
	}
};