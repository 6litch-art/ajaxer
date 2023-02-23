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
        output:null,
        cancelable: false,
        retry_limit:1,
        debounce:1000,
        loader_debounce:1500,
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

    Ajaxer.setOutput = function(name, dataType)
    {
        Ajaxer.set("output["+name+"]", dataType);
    }

    Ajaxer.getTarget = function(name)
    {
        return Ajaxer.get("target["+name+"]");
    }

    Ajaxer.setTarget = function(name, el)
    {
        Ajaxer.set("target["+name+"]", el);
    }

    Ajaxer.cancelable = function(name, cancelable = true)
    {
        Ajaxer.set("cancelable["+name+"]", true);
    }

    Ajaxer.setDebounce = function(name, debounce)
    {
        Ajaxer.set("debounce["+name+"]", debounce)
    }
    Ajaxer.setLoaderDebounce = function(name, debounce)
    {
        Ajaxer.set("loader_debounce["+name+"]", debounce)
    }

    Ajaxer.setLoaderContainer = function(name, el)
    {
        Ajaxer.set("loader_container["+name+"]", el);
    }

    Ajaxer.setRetryLimit = function(name, retryLimit)
    {
        Ajaxer.set("retry_limit["+name+"]", retryLimit)
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

            timeout = Ajaxer.parseTime(timeout ?? Ajaxer.get("debounce["+name+"]") ?? Ajaxer.get("debounce"));
            if(timeout == 0 || debounceTimer[name] == undefined) timeout = 1; // timeout not working if 0.. :o)

            if(typeof(debounceTimer[name]) != "undefined") clearTimeout(debounceTimer[name]);
            debounceTimer[name] = setTimeout(() => { func.apply(this, args); }, timeout);
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

    Ajaxer.abort = function (name, nKill = -1)
    {
        if(!(name in queryList))
            queryList[name] = [];

        var iKill = 0;
        while (queryList[name].length > 0 && (iKill++ < nKill || nKill < 0))
        {
            var xhr = queryList[name].shift(); // @TODO: implement mutex with unregister
                xhr.abort();
        }
    }

    Ajaxer.register = function(name, xhr)
    {
        if(!(name in queryList))
            queryList[name] = [];

        queryList[name].push(xhr);
    }

    Ajaxer.unregister = function(xhr)
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

            if (Ajaxer.get("url[" + name + "]") == undefined) console.error("No target URL provided.");
            else {

                var target = $(Ajaxer.get("target[" + name + "]") || this);
                var loaderContainer = Ajaxer.get("loader_container[" + name + "]")
                        ?? (Ajaxer.get("target[" + name + "]") || this);

                var loader = $(loaderContainer).find(" .ajaxer-loader");
                if (loader.length == 0) {

                    loader = $(document.createElement("div"));
                    loader.addClass("ajaxer-loader");
                    loader.append("<span class='ajaxer-status'></span>")

                    $(loaderContainer).append(loader);
                    loader = $(loaderContainer).find(" .ajaxer-loader");
                }

                loader = loader[0];
                target.removeClass(function (index, className) {
                    return (className.match(/(^|\s)ajaxer-\S+/g) || []).join(' ');
                });

                if (!(name in queryList))
                    queryList[name] = [];

                var queryLimit = parseInt(Ajaxer.get("query_limit[" + name + "]"));
                if (queryList[name].length >= queryLimit && !isNaN(queryLimit)) {

                    var cancelable = Ajaxer.get("cancelable["+name+"]") ?? Ajaxer.get("cancelable");
                    if (!cancelable) return;

                    Ajaxer.abort(name, queryList[name].length - queryLimit + 1);
                }

                $(target).addClass("ajaxer-call");
                var loaderTimeout = setTimeout(function () {
                    $(loader).addClass("ajaxer-call");
                }, Ajaxer.parseTime(Ajaxer.get("loader_debounce["+name+"]") ?? Ajaxer.get("loader_debounce")));

                var xhr = $.ajax({
                    url: Ajaxer.get("url[" + name + "]"),
                    type: Ajaxer.get("method[" + name + "]") ?? Ajaxer.get("method"),
                    dataType: Ajaxer.get("output[" + name + "]") ?? Ajaxer.get("output"),
                    data: data,
                    tryCount : 0,
                    retryLimit : Ajaxer.get("retry_limit[" + name + "]") ?? Ajaxer.get("retry_limit"),
                    success: function (...args) {

                        $(loader).addClass("ajaxer-success");
                        $(loader).removeClass("ajaxer-call");
                        $(target).each(function () {

                            $(target).addClass("ajaxer-success");
                            success.call(target, ...args);
                        });

                        Ajaxer.unregister(xhr);
                    },

                    error: function (...args) {

                        clearTimeout(loaderTimeout);

                        if(queryList[name].indexOf(xhr) > 0) {

                            $(loader).addClass("ajaxer-call");
                            $(loader).find(".ajaxer-status").html(args[0].responseJSON);

                            $(loader).one("click touchstart", function () {
                                $(loader).removeClass("ajaxer-call");
                            });

                            if (++this.tryCount < this.retryLimit) {
                                $.ajax(this);
                                return;
                            }
                        }

                        $(loader).addClass("ajaxer-error");
                        $(target).each(function () {

                            $(target).addClass("ajaxer-error");
                            error.call(target, ...args);
                        });

                        Ajaxer.unregister(xhr);
                    },

                    complete: function (...args) {

                        clearTimeout(loaderTimeout);
                        $(target).each(function () {

                            $(target).removeClass("ajaxer-call");
                            complete.call(target, ...args);
                        });
                    }
                });

                Ajaxer.register(name, xhr);
            }

        }.bind(this)())();
    }

    $(window).on("load", function() { Ajaxer.onLoad(); });
    $(window).on("onbeforeunload", function() { Ajaxer.clear(); });

    return Ajaxer;
});
