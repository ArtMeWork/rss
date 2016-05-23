const https = require('https');
const http = require('http');
const url = require("url");

var routes = {
	'/feed': getFeed
};

http.createServer(onRequest).listen(process.env.PORT || 8000);
console.log("Server has started.");

function onRequest(request, response) {
	var
		parse = url.parse(request.url),
		params = {};

	if (parse.query) {
		parse
			.query
			.split('&')
			.forEach((param) => {
				var _split = param.split('=', 2);
				params[_split[0]] = decodeURIComponent(_split[1]);
			});
	}

	if(!routes[parse.pathname])
		send(404, '404 Page not found'); else
		routes[parse.pathname](params, (err, data) => {
			send(err || 200, data);
		});

		function send(code, data) {
			response.writeHead(code, {
				"Content-Type": "text/plain; charset=utf-8",
				"Access-Control-Allow-Origin": "*"
			});
			response.write(data);
			response.end();
			console.log(code!==200 ? "Error "+code+": "+data : "Feed: "+params.url);
		}
}

function getFeed(params, cb) {
	var protocol = http;

	if (params && params.url && params.url.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)) {
		if (params.url.match(/^https/g)) protocol = https;

		protocol.get(params.url, (res) => {
			var data = "";
			if (res.statusCode===200) {

				res.on('data', (d) => {
					data += d;
				});

				res.on('end', (d) => {
					cb(null, data);
				});
			} else cb(res.statusCode, "Error #" + res.statusCode);

		}).on('error', (e) => {
			cb(404, JSON.stringify(e));
		});
	} else cb(400, "url not found");
}