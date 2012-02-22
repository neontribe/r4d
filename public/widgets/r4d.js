(function(window, undefined){
    
    function getScriptData() {
        var scripts = document.getElementsByTagName('script'),
            info = {},
            id,
            script,
            src,
            chromeless;
            
        for (var i = 0; i < scripts.length; i++) {
            script = scripts[i];
            id = script.getAttribute('data-r4dw-project_id');
            src = script.getAttribute ? script.getAttribute('src') : script.src;
            if (id) { // if this is the initial script
                script.removeAttribute('data-r4dw-project_id');
                info.initial_script = script;
                info.project_id = id;
                chromeless = script.getAttribute('data-r4dw-chromeless');
                // Check to see if we should be showing chrome
                if (chromeless && chromeless !== 'false') {
                    info.chromeless = true;
                }
            }      
            if (src && /r4d\.js/.test(src)) { // if this is the main working script
                info.src = src;
            }
        }
        return info;
    }

    /**
     * Async load a script with a callback
     */
    function loadScript(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = url;
        
        var entry = document.getElementsByTagName('script')[0];
        entry.parentNode.insertBefore(script, entry);
        if (script.addEventListener) {
            // W3C standard event
            script.addEventListener('load', callback, false);
        }
        else {
            // MS Proprietary Event
            script.attachEvent('onreadystatechange', function() {
                if (/complete|loaded/.test(script.readyState)) {
                    callback();
                }
            });
        }
    }
    
    function loadStylesheet(url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        (document.getElementsByTagName('head')[0] ||
            document.getElementsByTagName('body')[0]).appendChild(link);
    }

    function isCssReady(callback) {
        var testElem = document.createElement('span');
        testElem.id = 'development-widget-css-ready';
        testElem.style = 'color: #fff';
        var entry = document.getElementsByTagName('script')[0];
        entry.parentNode.insertBefore(testElem, entry);

        (function poll() {
            var node = document.getElementById('css-ready');
            if (window.getComputedStyle) {
                value = document.defaultView
                    .getComputedStyle(testElem, null)
                    .getPropertyValue('color');
            }
            else if (node.currentStyle) {
                value = node.currentStyle['color'];
            }
            if (value && value === 'rgb(186, 218, 85)' ||
                value.lower() === '#bada55')
            {
                callback();
            } else {
                setTimeout(poll, 500);
            }
        }());
    }
    
    /**
     * Templating!
     * https://github.com/deepsweet/microjungle
     */
    var microjungle = function(template) {
        var d = document;
    
        // they just doing their job.
        function monkeys(what, who) {
            var l = what.length;
    
            for (var i = 0; i < l; i++) {
                var j = what[i];
    
                if (j) {
                    if (typeof j == 'string') {
                        //who.appendChild(d.createTextNode(j));
                        who.innerHTML += j;
                    } else {
                        if (typeof j[0] == 'string') {
                            var el = d.createElement(j.shift()),
                                attrs = {}.toString.call(j[0]) === '[object Object]' && j.shift(),
                                k;
    
                            if (attrs) {
                                for(k in attrs) {
                                    attrs[k] && el.setAttribute(k, attrs[k]);
                                }
                            }
    
                            who.appendChild(monkeys(j, el));
                        } else if (j.nodeType === 11) {
                            who.appendChild(j);
                        } else {
                            monkeys(j, who);
                        }
                    }
                }
            }
    
            return who;
        };
    
        return monkeys(template, d.createDocumentFragment());
    };

    var scriptInfo = getScriptData();
    var url_parser = document.createElement('a');
        url_parser.href = scriptInfo.src;
    var base_url = scriptInfo.src.substr(0, scriptInfo.src.lastIndexOf('/')+1);
    var api_path = 'project';
    var project_id = scriptInfo.project_id;

    // Kick off by loading our stylesheet
    // Use the chromeless sheet if requested
    loadStylesheet(base_url + "r4d" + (scriptInfo.chromeless ? "_chromeless" : "") + ".css");
    //Grab reqwest and the dispatch a request for our data
    loadScript(base_url + "reqwest.js", function(){
        reqwest({
            url: [url_parser.protocol +  '/', url_parser.host, api_path, project_id].join('/'),
            type: 'jsonp',
            success: function (resp) {
                // Wrap out output action in a
                // check to ensure that our css is loaded
                isCssReady(function(){
                    var data = {outputs: resp.results.bindings,
                            proj_title: resp.results.bindings[0].projectTitle.value,
                            proj_url: resp.results.bindings[0].r4dProject.value};
                    
                    var template = [
                        ['div',
                            ['h3',
                                "Resources from Research for Development relating to ",
                                data.proj_title],
                            ['div', {'class': 'list-wrapper'},
                                ['ul',
                                   data.outputs.map(function(item) {
                                       return ['li',
                                                   ['a',
                                                       {
                                                           'href': item.output.value,
                                                           'target': '_blank'
                                                       },
                                                       item.outputTitle.value
                                                   ]
                                               ];
                                   }),
                                ]
                            ],
                            
                            ['a', ['span', 'And 5 more...']]
                        ]
                    ];
                    
                    var div = document.createElement('div');
                    div.className = "development-widget";
                    div.appendChild(microjungle(template));
                    // Render our stuff
                    scriptInfo.initial_script.parentNode.insertBefore(div, scriptInfo.initial_script);
                    
                    // Load Emile to do animations
                    // We do this late since the click on the scroll link isn't urgent
                    loadScript(base_url + "emile.js", function(){
                        // Deal with clicks on the scroller
                        //It'll be the last element in out div
                        div.childNodes[0].childNodes[div.childNodes[0].childNodes.length -1].onclick = function (evt, item) {
                            var ul = div.getElementsByTagName('ul')[0];
                            emile(ul, 'width:-100px', {duration: 300});
                            return false;
                        }
                    });
                });
            }
        });
    });

})(window);