;(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Infinity = factory();
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

    var Infinity = window.Infinity = {};
    Infinity.version = '0.1.0';

    var Settings = Infinity.settings = {

    };

    var debug = false;
    var ready = false;
    Infinity.clear = function() {
        
        $("#Infinity").each(function() {
            this.remove();
        });
    }

    Infinity.ready = function (list = {}, options = {}) {

        if("debug" in options)
            debug = options["debug"];

        Infinity.configure(options);
        if(list.length) 
            Infinity.configure({list: list});

        ready = true;

        if (debug) console.log("Infinity is ready.");
        dispatchEvent(new Event('infinity:ready'));

        return this;
    };

    Infinity.get = function(key) {
    
        if(key in Infinity.settings) 
            return Infinity.settings[key];

        return null;
    };

    Infinity.set = function(key, value) {
    
        Infinity.settings[key] = value;
        return this;
    };

    Infinity.add = function(key, value) {
    
        if(! (key in Infinity.settings))
            Infinity.settings[key] = [];

        if (Infinity.settings[key].indexOf(value) === -1)
            Infinity.settings[key].push(value);

        return this;
    };

    Infinity.remove = function(key, value) {

        if(key in Infinity.settings) {

            Infinity.settings[key] = Infinity.settings[key].filter(function(setting, index, arr){ 
                return value != setting;
            });

            return Infinity.settings[key];
        }

        return null;
    };

    Infinity.configure = function (options) {

        var key, value;
        for (key in options) {
            value = options[key];
            if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
        }

        if (debug) console.log("Infinity configuration: ", Settings);

        return this;
    };

    Infinity.getRandomColor = function(hex = '0123456789ABCDEF', alpha = 1) {

        var color = '#';

        for (var i = 0; i < 6; i++)
            color += hex[Math.floor(Math.random() * hex.length)];

        alpha = hex[Math.floor(alpha * hex.length)];

        return color + alpha + alpha;
    }

    Infinity.onLoad = function ()
    {
        Infinity.clear();

        $(window).on('click', Infinity.onClick);
        $(window).on("mouseup", Infinity.onMouseUp)
        $(window).on("mousedown", Infinity.onMouseDown)
    }

    $(window).on("load", function() { Infinity.onLoad(); });

    return Infinity;
});
