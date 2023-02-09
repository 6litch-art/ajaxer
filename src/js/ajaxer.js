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

    var Settings = Ajaxer.settings = {
        method:"POST",
        output:"json",
        debounce:0,
    };

    var debug = false;
    var ready = false;
    Ajaxer.clear = function() {

    }

    var debounceTimer;
    Ajaxer.debounce = function (func, timeout = null){

        timeout = timeout ?? Ajaxer.get("debounce");

        return (...args) => {

            if(timeout == 0) return func.apply(this, args);

            if(typeof(debounceTimer) != "undefined") clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { func.apply(this, args); }, Ajaxer.parseTime(timeout));
        };
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

        if (debug) console.log("Ajaxer is ready.");
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
            if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
        }

        if (debug) console.log("Ajaxer configuration: ", Settings);

        return this;
    };

    Ajaxer.onLoad = function ()
    {
        Ajaxer.ready();
    }

    Ajaxer.setMethod = function(type)
    {
        Ajaxer.set("method", type);
    }

    Ajaxer.setUrl = function(url)
    {
        Ajaxer.set("url", url);
    }

    Ajaxer.setOutput = function(type)
    {
        Ajaxer.set("output", dataType);
    }

    Ajaxer.setTarget = function(el)
    {
        Ajaxer.set("target", el);
    }

    Ajaxer.setDebounce = function(debounce)
    {
        Ajaxer.set("debounce", debounce)
    }

    var nQueries = 0;
    Ajaxer.setQueryLimit = function(queryLimit)
    {
        Ajaxer.set("query_limit", queryLimit);
    }

    Ajaxer.send = function(data = {}, success = function() {}, error = function() {}, complete = function() {})
    {
        return Ajaxer.debounce(() => function() {

            if(Ajaxer.get("url") == undefined) console.error("No target URL provided.");
            else {

                var target = $(Ajaxer.get("target") || this);
                target.removeClass (function (index, className) {
                    return (className.match (/(^|\s)ajaxer-\S+/g) || []).join(' ');
                });

                $(target).addClass("ajaxer-call");

                var queryLimit = parseInt(Ajaxer.get("query_limit"));
                if(nQueries < queryLimit || isNaN(queryLimit)) {

                    nQueries++;
                    $.ajax({
                        url: Ajaxer.get("url"),
                        type: Ajaxer.get("method"),
                        dataType: Ajaxer.get("output"),
                        data: data,
                        success: function(...args) {

                            $(this).each(function() {
                                $(this).addClass("ajaxer-success");
                                success.call(this, ...args);
                            })

                        }.bind(target),
                        error: function(...args) {

                            $(this).each(function() {
                                $(this).addClass("ajaxer-error");
                                error.call(this, ...args);
                            });

                        }.bind(target),
                        complete: function(...args) {

                            $(this).each(function() {
                                $(this).removeClass("ajaxer-call");
                                complete.call(this, ...args);
                            });

                            nQueries--;

                        }.bind(target)
                    });
                }
            }

        }.bind(this)())();
    }

    $(window).on("load", function() { Ajaxer.onLoad(); });

    return Ajaxer;
});
