var http = require("http")
    ,fs = require('fs')
    ,querystring = require('querystring')
    ,connect = require("connect")
    ,ejs = require("ejs")
    ,port = process.env.PORT || 3000
    ,kasabi_api_key = "368389391f29f9442406b400a42e1dfd6eaacb22"
    ,kasabi_host = "api.kasabi.com"
    ,kasabi_path = "/dataset/r4d-aid-data/apis/sparql"
    ,redis_cache_ttl = 1
    ,redis_cache_prefix = "r4dProjectCache:"
    ,sparql
    ,redis
    ,rtg;

    
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
        
            var query = ejs.render(sparql, {
                    prid : req.params.prid,
                    kasabi_api_key : kasabi_api_key
                }),
                opts = {
                    host : kasabi_host,
                    path : kasabi_path + '?' + query,
                    port : "80"
                },
                req_params = querystring.parse(req.url.split("?")[1]);

            http.get(opts, function(response){
                var results = '';
                response.on('data', function(chunk) {
                    results += chunk;  
                });
                response.on('end', function(){
                    //accept jsonp requests
                    if (req_params.callback) {
                    // if we have a callback function name, do JSONP
                        results = req_params.callback + "(" + results + ");";
                    } 

                    // write the results to the output
                    res.writeHead(200, {
                        // change MIME type to JSON
                        "Content-Type": (req_params.callback) ? "application/javascript" :"application/json",
                        "Content-Length": results.length
                    });

                    res.end(results)
                });
            });
        });
    })
).listen(port);

console.log('r4d server running on port ' + port);







