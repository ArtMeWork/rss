var request = require('request');
var zlib = require('zlib');

request('http://feeds.rucast.net/radio-t.rss', {encoding: null}, function(err, response, body){
    if(response.headers['content-encoding'] == 'gzip'){
        zlib.gunzip(body, function(err, dezipped) {
            console.log(dezipped.toString());
        });
    } else {
        console.log(body);
    }
});
