$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
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

;(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Infinity = factory();
    }

})(this, function () {

    var Infinity = {};
        Infinity.version = '0.1.0';
 
    var Dict = Infinity.dict = {};
    var Instance = Infinity.instance = undefined;
    var Settings = Infinity.settings = {
        selector        : ".infinity",
        loader          : ".infinity-loader",
        autocomplete    : "/autocomplete",
        throttle        : "500ms",
        scrollThreshold : 0.20,
        itemThreshold   : 5,
        focus           : true
    };

    const State = Infinity.state = {
        PLAY         : "play",
        SHOW         : "show",
        PREVENT      : "prevent", // Prevent going to this image
        EMPTY        : "empty",
        ACTIVE       : "active",  // Overhead time until animation ends
        TIMEOUT      : "timeout", // Force Infinity time reset (when clicking on backward or forward button)
       
        REWIND       : "rewind",   // Reset to initial slide and keep current state (pause or play)
        FASTBACKWARD : "fast-backward",
        BACKWARD     : "backward",
        FORWARD      : "forward",
        FASTFORWARD  : "fast-forward",
    };

    var debug = false;
    var ready = false;

    Infinity.parseDuration = function(str) { 

        var array = String(str).split(", ");
            array = array.map(function(t) {

                if(String(t).endsWith("ms")) return parseFloat(String(t))/1000;
                return parseFloat(String(t));    
            });

        return Math.max(...array);
    }

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

        if(debug) console.log("Infinity configuration: ", Settings);

        return this;
    };

    Infinity.isReady = function() { return ready; }

    Infinity.uuidv4 = function() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    };

    Infinity.ready = function (options = {}) {

        if("debug" in options)
            debug = options["debug"];

        Infinity.configure(options);
        ready = true;

        if(debug) console.log("Infinity is ready.");
        dispatchEvent(new Event('Infinity:ready'));

        if (Infinity.empty())
            Infinity.onLoad();

        Infinity.run(function() {

            if (Infinity.get("autoplay")) {
                
                $(Infinity.get("selector")).each(function() {
                    if($(this).hasClass("active") || $(this).hasClass("play")) Infinity.play(this);
                });
            }
        });

        return this;
    };

    Infinity.empty  = function() { return Object.keys(Infinity.dict).length === 0; } 
    Infinity.clear  = function() { Infinity.dict = {}; } 
    Infinity.onLoad = function(selector = Infinity.get("selector")) {

        Infinity.clear();
        $(selector).each(function() {

            this.id = this.id || Infinity.uuidv4();
            Infinity.dict[this.id] = {
                container: this, instance: undefined, transitions: undefined, transitions_default: undefined,
                first:undefined, last:undefined, onHold:false,
                progress:0, timeout: undefined, isHover:false};

            var entries = $(this).find(".Infinity-entry");
            if(entries.length < 1) $(this).addClass(Infinity.state.EMPTY);
            else $(this).addClass(Infinity.state.REMOVE);

            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    var attributeValue = $(mutation.target).prop(mutation.attributeName);
                    console.log("Infinity "+mutation.target.id+" changed to:", attributeValue);
                });
            });

            if(debug > 1) observer.observe(this, { attributes: true, attributeFilter: ['class']});

            Infinity.run(function() {

                if (Infinity.get("autoplay"))
                    Infinity.play(this);

            }.bind(this));
        });

        if(debug) {
            
            var Infinitys = Infinity.length(selector);
            if (Infinitys.length < 1) console.log("Infinity: no Infinity found");
            else {

                console.log("Infinity: " + Infinitys.length + " Infinity(s) found");
                $(Infinitys).each(function(index) { console.log("- Slider #"+(index+1)+" ("+ this + " image(s) found)", $(selector)[index] ); });
            }
        }
    }

    Infinity.run = function(callback = function() {}) {

        if(!Infinity.isReady()) return;

        Infinity.update();

        callback();
    }

    Infinity.modulo = function mod(n, m) { return ((n % m) + m) % m; }
    
    Infinity.throttle = function(fn = function() {}, throttle = 0)
    {
        if(throttle == 0) fn();
        else setTimeout(fn, throttle);
    }

    Infinity.callback = function(method = null, data = null, xhr = null, request = null)
    {

    }

    Infinity.scrollPercent = function()
    {

    }


    Infinity.itemNumber = function()
    {

    }

    Infinity.lastItem = function()
    {

    }

    Infinity.getItems = function(selector) 
    {

    }

    Infinity.forms = function(selector) 
    {

    }

    Infinity.call = function(callback = Infinity.callback, method = null, data = null) {

        // Submit ajax request..
        var xhr = new XMLHttpRequest();
        return jQuery.ajax({
            url : Settings["autocomplete"],
            type: type,
            data: data,
            dataType: 'html',
            headers: Settings["headers"] || {},
            xhr: function () { return xhr; }, 
            success: function (html, status, request) { return callback(type, data, xhr, request); },
            error:   function (request, ajaxOptions, thrownError) { return callback(type, data, xhr, request); }
        });
    }

    $(document).ready(function() { Infinity.onLoad(); });
    $(window).on("focus", function(e){ Infinity.set("focus", true); });
    $(window).on("blur",  function(e){ Infinity.set("focus", false); });
    $(window).on("onbeforeunload",  function(e){ Infinity.clear(); });

	return Infinity;
});