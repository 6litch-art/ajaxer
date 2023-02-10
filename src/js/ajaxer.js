;(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Ajaxer = factory();
    }

})(this, function () {

    $.fn.serializeObject = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var Ajaxer = window.Ajaxer = {};
        Ajaxer.version = '0.1.0';

    var defaultAjaxer  = {
        method:"POST",
        output:"json",
        loader_debounce:2000,
        debounce:0,
    };

    Ajaxer.settings = defaultAjaxer;

    var debug = false;
    var ready = false;

    Ajaxer.clear = function() {

        Ajaxer.settings = defaultAjaxer;
        Ajaxer.abortAll();
    }

    Ajaxer.parseTime = function(str) {

        var array = String(str).split(", ");
        array = array.map(function (t) {

            if (String(t).endsWith("ms")) return parseFloat(String(t)) / 1000;
            return parseFloat(String(t));
        });

        return Math.max(...array);
    }

    Ajaxer.ready = function (list = {}, options = {}) {

        if("debug" in options)
            debug = options["debug"];

        Ajaxer.configure(options);
        if(list.length)
            Ajaxer.configure({list: list});

        ready = true;

        if (debug) console.debug("Ajaxer is ready.");
        dispatchEvent(new Event('Ajaxer:ready'));

        return this;
    };

    Ajaxer.get = function(key) {

        if(key in Ajaxer.settings)
            return Ajaxer.settings[key];

        return null;
    };

    Ajaxer.set = function(key, value) {

        Ajaxer.settings[key] = value;
        return this;
    };

    Ajaxer.add = function(key, value) {

        if(! (key in Ajaxer.settings))
            Ajaxer.settings[key] = [];

        if (Ajaxer.settings[key].indexOf(value) === -1)
            Ajaxer.settings[key].push(value);

        return this;
    };

    Ajaxer.remove = function(key, value) {

        if(key in Ajaxer.settings) {

            Ajaxer.settings[key] = Ajaxer.settings[key].filter(function(setting, index, arr){
                return value != setting;
            });

            return Ajaxer.settings[key];
        }

        return null;
    };

    Ajaxer.configure = function (options) {

        var key, value;
        for (key in options) {
            value = options[key];
            if (value !== undefined && options.hasOwnProperty(key)) Ajaxer.settings[key] = value;
        }

        if (debug) console.debug("Ajaxer configuration: ", Ajaxer.settings);

        return this;
    };

    Ajaxer.onLoad = function ()
    {
        Ajaxer.ready();
    }

    Ajaxer.setMethod = function(name, type)
    {
        Ajaxer.set("method["+name+"]", type);
    }

    Ajaxer.setUrl = function(name, url)
    {
        Ajaxer.set("url["+name+"]", url);
    }

    Ajaxer.setOutput = function(name, type)
    {
        Ajaxer.set("output["+name+"]", dataType);
    }

    Ajaxer.setTarget = function(name, el)
    {
        Ajaxer.set("target["+name+"]", el);
    }

    Ajaxer.setLoader = function(name, el)
    {
        Ajaxer.set("loader["+name+"]", el);
    }

    Ajaxer.setDebounce = function(name, debounce)
    {
        Ajaxer.set("debounce["+name+"]", debounce)
    }

    Ajaxer.setQueryLimit = function(name, queryLimit)
    {
        Ajaxer.set("query_limit["+name+"]", queryLimit);
    }

    var debounceTimer = {};
    Ajaxer.debounce = function (name, func, timeout = null){

        if( ! (name in debounceTimer) )
            debounceTimer[name] = undefined;

        return (...args) => {

            timeout = timeout ?? Ajaxer.get("debounce["+name+"]") ?? Ajaxer.get("debounce");
            if(timeout == 0) return func.apply(this, args);

            if(typeof(debounceTimer[name]) != "undefined") clearTimeout(debounceTimer[name]);
            debounceTimer[name] = setTimeout(() => { func.apply(this, args); }, Ajaxer.parseTime(timeout));
        };
    }

    var queryList = {};
    Ajaxer.xhr = function(name)
    {
        if(!(name in queryList))
            queryList[name] = [];

        return queryList[name];
    }

    Ajaxer.abortAll = function()
    {
        Object.keys(queryList).forEach((name) => {
            Ajaxer.abort(name);
        });
    }

    Ajaxer.abort = function (name)
    {
        if(!(name in queryList))
            queryList[name] = [];

        do {

            queryList[name][0].abort();
            queryList[name].shift();

        } while (queryList[name].length);
    }

    Ajaxer.register = function(name, xhr)
    {
        if(!(name in queryList))
            queryList[name] = [];

        queryList[name].push(xhr);
    }

    Ajaxer.complete = function(xhr)
    {
        Object.entries(queryList).forEach(([_name,xhrList]) => {

            var index = xhrList.indexOf(xhr);
            if(index > -1) xhrList.splice(index, 1);
        });
    }

    Ajaxer.send = function(name, data = {}, success = function() {}, error = function() {}, complete = function() {})
    {
        if( typeof(name) != "string" )
            console.error("Unexpected ajax request name received.");

        return Ajaxer.debounce(name, () => function() {

            if(Ajaxer.get("url["+name+"]") == undefined) console.error("No target URL provided.");
            else {

                var target = $(Ajaxer.get("target["+name+"]") || this);
                var loader = $(Ajaxer.get("loader["+name+"]"));
                if (loader.length == 0) {

                    loader = $(document.createElement("div"));
                    loader.addClass("ajaxer-loader");
                    loader.append("<span class='ajaxer-status'></span>")
                    $("body").append(loader);

                    Ajaxer.set("loader["+name+"]", loader);
                }

                loader = loader[0];
                target.removeClass (function (index, className) {
                    return (className.match (/(^|\s)ajaxer-\S+/g) || []).join(' ');
                });

                if(!(name in queryList))
                    queryList[name] = [];

                var queryLimit = parseInt(Ajaxer.get("query_limit["+name+"]"));
                if(queryList[name].length < queryLimit || isNaN(queryLimit)) {

                    $(target).addClass("ajaxer-call");
                    var loaderTimeout = undefined;
                    // setTimeout(function() {
                        $(loader).addClass("ajaxer-call");
                    // }, Ajaxer.get("loader_debounce"));

                    var xhr = $.ajax({
                        url: Ajaxer.get("url["+name+"]"),
                        type: Ajaxer.get("method["+name+"]") ?? Ajaxer.get("method"),
                        dataType: Ajaxer.get("output["+name+"]") ?? Ajaxer.get("output"),
                        data: data,
                        success: function(...args) {

                            $(loader).addClass("ajaxer-success");
                            $(this).each(function() {

                                $(this).addClass("ajaxer-success");
                                success.call(this, ...args);
                            })

                        }.bind(target),

                        error: function(...args) {

                            $(loader).addClass("ajaxer-error");
                            $(this).each(function() {

                                $(this).addClass("ajaxer-error");
                                error.call(this, ...args);
                            });

                            $(loader).find(".ajaxer-status").html(args[0].responseJSON);

                        }.bind(target),

                        complete: function(...args) {

                            // $(loader).removeClass("ajaxer-call");
                            $(this).each(function() {

                                $(this).removeClass("ajaxer-call");
                                clearTimeout(loaderTimeout);
                                complete.call(this, ...args);
                            });

                            Ajaxer.complete(xhr);

                        }.bind(target)
                    });

                    Ajaxer.register(name, xhr);
                }
            }

        }.bind(this)())();
    }

    $(window).on("load", function() { Ajaxer.onLoad(); });
    $(window).on("onbeforeunload", function() { Ajaxer.clear(); });

    return Ajaxer;
});
