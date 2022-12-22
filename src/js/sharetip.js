
;(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Sharetip = factory();
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

    var Sharetip = window.Sharetip = {};
    Sharetip.version = '0.1.0';

    var Settings = Sharetip.settings = {

        threshold:5,
        list: {},
        icons: {
            "facebook": "fab fa-facebook", 
            "pinterest": "fab fa-pinterest",
            "copy": "fas fa-paperclip", 
            "email": "fas fa-at"
        }
    };

    var debug = false;
    var ready = false;
    Sharetip.clear = function() {
        
        $("#sharetip").each(function() {
            this.remove();
        });
    }

    Sharetip.ready = function (list = {}, options = {}) {

        if("debug" in options)
            debug = options["debug"];

        Sharetip.configure(options);
        if(list.length) 
            Sharetip.configure({list: list});

        ready = true;

        if (debug) console.log("Sharetip is ready.");
        dispatchEvent(new Event('sharer:ready'));

        return this;
    };

    Sharetip.get = function(key) {
    
        if(key in Sharetip.settings) 
            return Sharetip.settings[key];

        return null;
    };

    Sharetip.set = function(key, value) {
    
        Sharetip.settings[key] = value;
        return this;
    };

    Sharetip.add = function(key, value) {
    
        if(! (key in Sharetip.settings))
            Sharetip.settings[key] = [];

        if (Sharetip.settings[key].indexOf(value) === -1)
            Sharetip.settings[key].push(value);

        return this;
    };

    Sharetip.remove = function(key, value) {

        if(key in Sharetip.settings) {

            Sharetip.settings[key] = Sharetip.settings[key].filter(function(setting, index, arr){ 
                return value != setting;
            });

            return Sharetip.settings[key];
        }

        return null;
    };

    Sharetip.configure = function (options) {

        var key, value;
        for (key in options) {
            value = options[key];
            if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
        }

        if (debug) console.log("Sharetip configuration: ", Settings);

        return this;
    };
    
    Sharetip.onClick = function (e)
    {
        var button = null;
        
        if(e.target && e.target.nodeName == "BUTTON") button = $(e.target);
        else if(e.target.parentNode && e.target.parentNode.nodeName == "BUTTON") button = $(e.target.parentNode);
        if(!button) return;

        buttonId = $(button).attr("id");
        if(!buttonId || !buttonId.startsWith("sharetip-")) return;

        e.preventDefault();

        var title = $("head > title")[0].innerText;
        var text = $("#sharetip").attr("data-content").trim();
        if(text) {

            var first = text.charAt(0);
            if (first === first.toLowerCase() && first !== first.toUpperCase())
                text  = "[..] " + text;

            var last = text.charAt(text.length-1);
            if (!last.endsWith("."))
                text += " [..]";

            text = "\"" + text + "\"";
        }

        app_id = button.attr("data-id");
        switch(buttonId) {

            case 'sharetip-twitter':
                window.open("https://twitter.com/intent/tweet?text="+text+"&url="+window.location, '_blank');
            break;
            case 'sharetip-facebook':
                window.open("https://www.facebook.com/sharer/sharer.php?quote="+text+"&u="+window.location, '_blank');
            break;
            case 'sharetip-pinterest':
                window.open("http://pinterest.com/pin/create/button/?description="+text+"&url="+window.location, '_blank');
            break;
            case 'sharetip-tumblr':
                window.open("http://www.tumblr.com/share/link?title="+title+"&description="+text+"&url="+window.location, '_blank');
            break;
            case 'sharetip-googleplus':
                window.open("https://plus.google.com/share?url="+window.location, '_blank');
            break;
            case 'sharetip-linkedin':
                window.open("http://www.linkedin.com/shareArticle?mini=true&title="+title+"&summary="+text+"&url="+window.location, '_blank');
            break;
            case 'sharetip-copy':

                $(document).bind('copy', (event) => {
                        event.clipboardData.setData('text/plain', text+"\n"+window.location);
                        event.preventDefault();
                });

                document.execCommand("copy");
            break;

            case 'sharetip-email':

                window.location = "mailto:"+
                    "?subject="+document.title+
                    "&body="+text+"%0D%0A"+window.location;
                break;

            default: console.error("Service \""+buttonId+"\" not found.");
        }

        window.getSelection().removeAllRanges();
        Sharetip.clear();
    }

    Sharetip.getRandomColor = function(hex = '0123456789ABCDEF', alpha = 1) {

        var color = '#';

        for (var i = 0; i < 6; i++)
            color += hex[Math.floor(Math.random() * hex.length)];

        alpha = hex[Math.floor(alpha * hex.length)];

        return color + alpha + alpha;
    }

    Sharetip.getLinks = function()
    {
        var ul = document.createElement("ul");

        ul.innerHTML = "";
        for (var i = 0, N = Settings.list.length; i < N; i++)
            ul.innerHTML += "<li><button id='sharetip-"+Settings.list[i]+"'><i class='"+Settings.icons[Settings.list[i]]+"'></button></li>";

        return ul;
    }

    var mouse0 = {};
    Sharetip.onMouseDown = function(e)
    {        
        mouse0 = {
            x:e.clientX+window.scrollX,
            y:e.clientY+window.scrollY
        };
    }
    Sharetip.onMouseUp = function(e)
    {
        if (typeof window.getSelection == 'undefined') return;

        var selection = window.getSelection();
        if(!selection) return;

        if(selection.rangeCount < 1) return;

        var range     = selection.getRangeAt(0);
        if(!range) return;

        var parent    = range.commonAncestorContainer ? range.commonAncestorContainer :
                        range.parentElement ? range.parentElement() :
                        range.item(0);

        var text      = selection.toString();

        if (text == undefined || text == "" || $(parent).closest("form").length) {
            Sharetip.clear();
            return;
        }
    
        var sharetip = $("#sharetip");
        if (sharetip && sharetip.attr("data-content") == text) return;
        Sharetip.clear();
                    
        var mouse = {
            x:e.clientX+window.scrollX,
            y:e.clientY+window.scrollY
        };

        if(Math.hypot(mouse.x-mouse0.x, mouse.y-mouse0.y) < Settings.threshold)
            return;

        sharetip = document.createElement("div");
        $(sharetip).attr("id", "sharetip");
        $(sharetip).attr("data-content", text);
        $(sharetip).css("position", "absolute");
        $(sharetip).css("left", mouse.x);
        $(sharetip).css("top", mouse.y);
        $(sharetip).append(Sharetip.getLinks());

        var links = $(sharetip).find("ul");
        if( links.innerHTML == "") return;

        links.attr("style", "background-color: "+Sharetip.getRandomColor("0123456789ABC", 0.8)+";");
        $("body").append(sharetip);
    }

    Sharetip.onLoad = function ()
    {
        Sharetip.clear();

        $(window).on('click', Sharetip.onClick);
        $(window).on("mouseup", Sharetip.onMouseUp)
        $(window).on("mousedown", Sharetip.onMouseDown)
    }

    $(window).on("load", function() { Sharetip.onLoad(); });

    
    return Sharetip;
});
