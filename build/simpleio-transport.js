;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("simpleio-transport/lib/client/index.js", function(exports, require, module){
exports.Client = require('./Client');

exports.request;

});
require.register("simpleio-transport/lib/client/Client.js", function(exports, require, module){
var Emitter = require('emitter'),
    sio = require('./index'),
    Multiplexer = require('../shared/Multiplexer'),
    $ = require('../shared/utils');

function Client(opts) {
    var self = this;

    opts || (opts = {});
    this.id = opts.id || $.id();
    this.url = opts.url || '/simpleio';

    this._multiplexer = new Multiplexer({duration: opts.multiplexDuration})
        .on('error', function(err) {
            self.emit('error', err);
        })
        .on('reset', function() {
            self.request(true);
        });

    this._connections = 0;
    this._delivered = [];
}

Emitter(Client.prototype);

module.exports = Client;

Client.prototype.connect = function(data) {
    this._polling = true;
    this._baseData = data || {};
    this._baseData.client = this.id;

    this.request(true);

    return this;
};

Client.prototype.disconnect = function() {
    this._polling = false;
    if (this._xhr) {
        this._xhr.abort();
    }

    return this;
};

Client.prototype.send = function(recipient, message, callback) {
    message.recipients = recipient;
    this._multiplexer.add(message);

    return this;
};

Client.prototype.broadcast = function(recipients, message, callback) {
    message.recipients = recipients;
    this._multiplexer.add(message);

    return this;
};

Client.prototype.request = function(force) {
    var self = this,
        data = $.extend({}, this._baseData),
        messages;

    if (!this._polling) {
        return this;
    }

    if (!force && this._connections > 0) {
        return this;
    }

    messages = this._multiplexer.get();
    if (messages.length) {
        data.messages = messages;
        this._multiplexer.reset();
    }

    if (this._delivered.length) {
        data.delivered = this._delivered;
        this._delivered = [];
    }

    this._connections++;

    this._xhr = sio.request({
        url: this.url,
        type: data.messages || data.delivered ? 'post' : 'get',
        data: data,
        cache: false,
        dataType: 'json',
        success: function(res) {
            self._connections--;

            if (res.messages.length) {
                self.emit('messages', res.messages);
                $.each(res.messages, function(message) {
                    self._delivered.push(message.id);
                    self.emit('message', message);
                });
            }
            self.request(self._delivered.length);
        },
        error: function() {
            self._connections--;

            // Roll back "messages" and "delivered" to pick up them again by
            // next try to connect.
            if (data.delivered) {
                self._delivered.push.apply(self._delivered, data.delivered);
            }
            if (data.messages) {
                self._multiplexer.add(data.messages);
            }

            // TODO increase exponentially, start small
            setTimeout(function() {
                self.request();
            }, 10000);
        }
    });

    return this;
};

});
require.register("simpleio-transport/lib/shared/Multiplexer.js", function(exports, require, module){
var Emitter,
    $ = require('./utils');

try {
    Emitter = require('emitter-component');
} catch(err) {
    Emitter = require('emitter');
}

function Multiplexer(opts) {
    var self = this,
        // Amount of ms for multiplexing messages before emitting.
        duration = opts.duration || 500;

    this._messages = [];
    this._stopped = false;
    this._timeoutId = setInterval(function() {
        if (self._messages.length) {
            self.reset();
        }
    }, duration);
}

Emitter(Multiplexer.prototype);
module.exports = Multiplexer;

Multiplexer.prototype.add = function(messages) {
    if (this._stopped) {
        this.emit('error', new Error('Cannot add a message after .close'));
        return this;
    }

    if ($.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else if (messages) {
        this._messages.push(messages);
    }

    return this;
};

Multiplexer.prototype.reset = function() {
    this.emit('reset');
    this._messages = [];
};

Multiplexer.prototype.get = function() {
    return this._messages;
};

Multiplexer.prototype.stop = function() {
    clearInterval(this._timeoutId);
    this._stopped = true;
    this.removeAllListeners();

    return this;
};

});
require.register("simpleio-transport/lib/shared/utils.js", function(exports, require, module){
var toString = Object.prototype.toString,
    nativeForEach = Array.prototype.forEach,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    slice = Array.prototype.slice;

exports.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
};

exports.now = Date.now || function() {
    return new Date().getTime();
};

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
exports.each = function(obj, iterator, context) {
    var i, key;

    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (i = 0, l = obj.length; i < l; i++) {
            iterator.call(context, obj[i], i, obj);
        }
    } else {
        for (key in obj) {
            if (exports.has(obj, key)) {
                iterator.call(context, obj[key], key, obj);
            }
        }
    }
};

exports.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
};

exports.extend = function(obj) {
    exports.each(slice.call(arguments, 1), function(source) {
        var prop;

        if (source) {
            for (prop in source) {
                obj[prop] = source[prop];
            }
        }
    });

    return obj;
};

exports.id = function() {
    return Math.round(Math.random() * exports.now());
};

});
require.alias("component-emitter/index.js", "simpleio-transport/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("simpleio-transport/lib/client/index.js", "simpleio-transport/index.js");

if (typeof exports == "object") {
  module.exports = require("simpleio-transport");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("simpleio-transport"); });
} else {
  this["simpleioTransport"] = require("simpleio-transport");
}})();