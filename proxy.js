
var connect = require( 'connect' );
var qs = require('querystring');
var http = require('http');
var urlparser = require('url');
var fs = require('fs');

function proxyRequest (req, res) {
    var url = req.query['url'];
    if (url == undefined) {
        res.writeHead(400);
        res.end();
        return;
    }

    console.log(url);

    var target = urlparser.parse(url);
    var port = 80;
    if (target.port == undefined && target.protocol != undefined && target.protocol == 'https') {
        port = 443;
    }
    var headers = req.headers;
    if (headers.hasOwnProperty('host')) 
        headers['host'] = target.hostname;
    if (headers.hasOwnProperty('connection'))
        delete headers['connection'];
    var options = {
        hostname: target.hostname,
        port: port,
        method: req.method,
        headers: req.headers,
        path: target.path
    };

    var http_client = http.request(options);
    http_client.addListener('response', function (proxy_response) {
        proxy_response.addListener('data', function (chunk) {
            res.write(chunk, 'binary');
        });

        proxy_response.addListener('end', function() {
            res.end();
        });
        res.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    req.addListener('data', function(chunk) {
        http_client.write(chunk, 'binary');
    });

    req.addListener('end', function() {
        http_client.end();
    });
}

var httpSrv = connect.createServer();
httpSrv.use(connect.query());
httpSrv.use(proxyRequest);
console.log('bind 8118 port');
httpSrv.listen(8118);

var options = {
    key: fs.readFileSync('privatekey.pem'),
    cert: fs.readFileSync('certificate.pem')
};


var httpsSrv = connect.createServer(options);
httpsSrv.use(connect.query(), proxyRequest);
httpsSrv.listen(8119);


