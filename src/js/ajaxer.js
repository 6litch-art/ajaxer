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
        output:"json"
    };

    var debug = false;
    var ready = false;
    Ajaxer.clear = function() {

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

    Ajaxer.setOutput = function(type)
    {
        Ajaxer.set("output", dataType);
    }

    Ajaxer.send = function(url, data = {}, successCallback = function() {}, errorCallback = function() {} )
    {
        $.ajax({
            url: url,
            type: Ajaxer.get("method"),
            dataType: Ajaxer.get("output"),
            data: data,
            success: successCallback,
            error: errorCallback});
    }

    $(window).on("load", function() { Ajaxer.onLoad(); });

    return Ajaxer;
});
