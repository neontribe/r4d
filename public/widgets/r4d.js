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
        testElem.style.color = '#fff';
        var entry = document.getElementsByTagName('script')[0];
        entry.parentNode.insertBefore(testElem, entry);

        (function poll() {
            var node = document.getElementById('development-widget-css-ready');
            if (window.getComputedStyle) {
                value = document.defaultView
                    .getComputedStyle(testElem, null)
                    .getPropertyValue('color');
            }
            else if (node.currentStyle) {
                value = node.currentStyle['color'];
            }
            if (value && value === 'rgb(186, 218, 85)' ||
                value.toLowerCase() === '#bada55')
            {
                callback();
            } else {
                setTimeout(poll, 200);
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
    
    function each(obj, iterator, context) {
        var nativeForEach = Array.prototype.forEach,
            breaker = {},
            i,
            key,
            l;
        if (obj === null) {
            return;
        }
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (i = 0, l = obj.length; i < l; i += 1) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    }

    function map(obj, iterator, context) {
        var results = [],
            nativeMap = Array.prototype.map;
        if (obj === null) {
            return results;
        }
        if (nativeMap && obj.map === nativeMap) {
            return obj.map(iterator, context);
        }
        each(obj, function (value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        });
        if (obj.length === +obj.length) {
            results.length = obj.length;
        }
        return results;
    }
    
    function addEvent(el, ev, fn) {
        if (el.addEventListener) {
            el.addEventListener(ev, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + ev, fn);
        } else {
            el['on' + ev] = fn;
        }
    }

    var scriptInfo = getScriptData(),
        url_parser = document.createElement('a'),
        base_url = scriptInfo.src.substr(0, scriptInfo.src.lastIndexOf('/')+1),
        api_path = 'project',
        project_id = scriptInfo.project_id;
    
    // Populate out parser with our script's url
    url_parser.href = scriptInfo.src,

    // Kick off by loading our stylesheet
    // Use the chromeless sheet if requested
    loadStylesheet(base_url + "r4d" + (scriptInfo.chromeless ? "_chromeless" : "") + ".css");
    //Grab reqwest and the dispatch a request for our data
    loadScript(base_url + "reqwest.js", function(){
        reqwest({
            url: [url_parser.protocol +  '/', url_parser.host, api_path, project_id, '?breaker=' + new Date().getTime()].join('/'),
            type: 'jsonp',
            success: function (resp) {
                // Wrap out output action in a
                // check to ensure that our css is loaded
                isCssReady(function(){
                    var div = document.createElement('div'), 
                            data = {outputs: resp.results.bindings,
                                proj_title: resp.results.bindings[0].dfidProjectTitle.value,
                                proj_url: resp.results.bindings[0].r4dProject.value},
                            template = [
                                ['div',
                                    ['h3',
                                        "Resources from Research for Development relating to ",
                                        ['em', data.proj_title]
                                    ],
                                    ['div', {'class': 'list-wrapper'},
                                        ['ul',
                                           map(data.outputs, function (item) {
                                                return ['li',
                                                           ['a',
                                                               {
                                                                    'href': item.output.value + 'Default.aspx',
                                                                    'target': '_blank'
                                                                },
                                                               item.outputTitle.value
                                                           ]
                                                       ];
                                           })
                                        ]
                                    ],
                                    ['a', {'href': 'javascript:void(0);'}, '&#x25bc;/&#x25b2;'],
                                    ['div', {'class': 'clear'}]
                                    //['br']
                                ]
                            ];
                    
                    div.className = "development-widget";
                    div.appendChild(microjungle(template));
                    // Render our stuff
                    scriptInfo.initial_script.parentNode.insertBefore(div, scriptInfo.initial_script);
                    
                    // Load Emile to do animations
                    // We do this late since the click on the scroll link isn't urgent
                    loadScript(base_url + "emile.js", function(){
                        // Deal with clicks on the scroller
                        //It'll be the last element in out div
                        var newTop = -200,
                            increment = -200,
                            animating = false,
                            button = div.childNodes[0].childNodes[div.childNodes[0].childNodes.length -2];
                            
                        //replace the updown arrow on browsers where we can (like all but ie 7/8
                        try {button.innerHTML = '<span></span>&#x25bc';}
                        catch (err){}


                        addEvent(button, 'click', function (evt) {
                            var ul = div.getElementsByTagName('ul')[0];

                            if (!animating) {
                                animating = true;
                                if (ul.style.top) {
                                    newTop = parseInt(ul.style.top, 10) + increment;
                                }
                                
                                emile(
                                    ul, 
                                    'top:' + newTop.toString() + 'px', 
                                    {
                                        duration: 600,
                                        easing: function(pos){if((pos/=0.5)<1){return 0.5*Math.pow(pos,4)}return -0.5*((pos-=2)*Math.pow(pos,3)-2)},
                                        after: function(){ 
                                            if (Math.abs(newTop) >= (ul.offsetHeight - Math.abs(newTop))) {
                                                try {button.innerHTML = '<span></span>&#x25b2';}
                                                catch (err) {}
                                                increment = 200;
                                            }
                                            if (Math.abs(newTop) <= 0) {
                                                try {button.innerHTML = '<span></span>&#x25bc;';}
                                                catch (err) {}
                                                increment = -200;
                                            }
                                        }
                                    },
                                    function () { animating = false; }
                                );
                                
                            }
                            return false;
                        });
                    });
                });
            }
        });
    });

})(window);
