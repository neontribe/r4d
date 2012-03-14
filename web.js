var http = require("http")
    ,fs = require('fs')
    ,querystring = require('querystring')
    ,connect = require("connect")
    ,ejs = require("ejs")
    ,port = process.env.PORT || 3000
    ,kasabi_api_key = "368389391f29f9442406b400a42e1dfd6eaacb22"
    ,kasabi_host = "api.kasabi.com"
    ,kasabi_path = "/dataset/r4d-aid-data/apis/sparql"
    ,redis_cache_ttl = 3600
    ,redis_cache_prefix = "r4dProjectCache:"
    ,sparql
    ,redis
    ,rtg;
    
if (process.env.REDISTOGO_URL) {
    // get redistogo on heroku
    rtg = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
    // Get localhost redis
    redis = require('redis').createClient();
}

/**
 * Precompile our sparql request template and store it
 */
fs.readFile('sparql.ejs', 'utf8', function(err, data) {
    if(!err) {
        sparql = data;
    }
});
    
connect(
    connect.logger(),
    connect.static(__dirname + "/public"),
    // create a router to handle application paths
    connect.router(function(app) {
        app.get("/project/:prid", function(req, res) {
            var cached,
                squery,
                query,
                opts,
                req_params = querystring.parse(req.url.split("?")[1]);

            function respond(data) {
                //accept jsonp requests
                if (req_params.callback) {
                // if we have a callback function name, do JSONP
                    data = req_params.callback + "(" + data + ");";
                } 
                // write the results to the output
                res.writeHead(200, {
                    // change MIME type to JSON
                    "Content-Type": (req_params.callback) ? "application/javascript" :"application/json"
                });
                res.end(data);
            }
            
            // Look for a copy in cache
            redis.get(redis_cache_prefix + req.params.prid, function(err, data){
                if (data) {
                    console.log('responding with cached data');
                    respond(data);
                } else {
                    squery = encodeURIComponent(ejs.render(sparql, {
                        prid : req.params.prid
                    })).replace(/%20/g, '+');
                    query = "apikey=" + kasabi_api_key + "&output=json&query=";
                    opts = {
                        host : kasabi_host,
                        path : kasabi_path + '?' + query + squery,
                        port : "80"
                    };
        
                    http.get(opts, function(response){
                        var results = '';
                        response.on('data', function(chunk) {
                            results += chunk;
                        });
                        response.on('end', function(){
                            console.log('responding with fresh data');
                            respond(results);
                            // Write to the cache
                            console.log('writing to cache');
                            redis.set(redis_cache_prefix + req.params.prid, results, function(){
                                console.log('setting expiry');
                                redis.expire(redis_cache_prefix + req.params.prid, redis_cache_ttl, function(err, ok){
                                    if (ok) {
                                        console.log('Expiry set ok');   
                                    } else {
                                        console.log('Expiry set failed:' + err);
                                    }
                                });
                            });
  
                        });
                    }); 
                }
            });
 
        });
    })
).listen(port);

console.log('r4d server running on port ' + port);







