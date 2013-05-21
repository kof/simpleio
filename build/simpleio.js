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
require.register("simpleio/lib/client/index.js", function(exports, require, module){
/**
 * Client constructor.
 *
 * @see Client
 * @api public
 */
exports.Client = require('./Client');

/**
 * Create client.
 *
 * @param {Object} [options]
 * @return {Client}
 * @see Client
 * @api public
 */
exports.create = function(options) {
    return new exports.Client(options);
};

});
require.register("simpleio/lib/client/Client.js", function(exports, require, module){
var Emitter = require('emitter'),
    sio = require('./index'),
    Multiplexer = require('../shared/Multiplexer'),
    $ = require('../shared/utils');

/**
 * Client constructor.
 *
 * @param {Object} options
 * @api public
 */
function Client(options) {
    var self = this;

    this.options = $.extend({}, Client.options, options);
    this.ajax = this.options.ajax;
    this._multiplexer = new Multiplexer({duration: this.options.multiplexDuration})
        .on('reset', function() {
            self._open(true);
        });

    this._connections = 0;
    this._delivered = [];
    this._reconnectionAttempts = 1;
}

/**
 * Default options, will be overwritten by options passed to the constructor.
 *
 *   - `ajax` required jQuery ajax api
 *   - `url` connection url, default is '/simpleio'
 *   - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
 *      will be increased on every further error until maxReconnectionDelay
 *   - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error
 *   - `multiplexDuration` ms amount for multiplexing messages before emitting
 *
 * @type {Object}
 * @api public
 */
Client.options = {
    url: '/simpleio',
    ajax: null,
    reconnectionDelay: 1000,
    maxReconnectionDelay: 10000,
    multiplexDuration: 500
};

Emitter(Client.prototype);
module.exports = Client;

/**
 * Start polling.
 *
 * @param {Object} [data] data to send with the first request.
 * @return {Client} this
 * @api public
 */
Client.prototype.connect = function(data) {
    if (!this._polling) {
        this._polling = true;
        this._open(true, data);
    }

    return this;
};

/**
 * Stop polling.
 *
 * @return {Client} this
 * @api public
 */
Client.prototype.disconnect = function() {
    this._polling = false;
    if (this._xhr) {
        this._xhr.abort();
    }

    return this;
};

/**
 * Send message to the server.
 *
 * @param {Mixed} message message to send.
 * @param {Function} [callback] is called when message was send to the server without error.
 * @return {Client} this
 * @api public
 */
Client.prototype.send = function(message, callback) {
    this._multiplexer.add(message);
    if (callback) this.once('success', callback);

    return this;
};

/**
 * Open connection.
 *
 * @param {Boolean} [immediately] create request immediately.
 * @param {Object} [data] additional data to be send.
 * @return {Client} this
 * @api private
 */
Client.prototype._open = function(immediately, data) {
    var self = this;

    data || (data = {});

    if (!this._polling) {
        return this;
    }

    // There is already open connection which will be closed at some point
    // and then multiplexed messages will be sent if immediately is not true.
    if (!immediately && this._connections > 0) {
        return this;
    }

    if (this._multiplexer.get().length) {
        data.messages = this._multiplexer.get();
        this._multiplexer.reset();
    }

    if (this._delivered.length) {
        data.delivered = this._delivered;
        this._delivered = [];
    }

    this._connections++;

    this._xhr = this.ajax({
        url: this.options.url,
        type: data.messages || data.delivered ? 'post' : 'get',
        data: data,
        cache: false,
        dataType: 'json',
        success: function(data) {
            self._onSuccess(data);
        },
        error: function() {
            self._onError(data);
        }
    });

    return this;
};

/**
 * Reconnect with incrementally delay.
 *
 * @return {Client} this
 * @api private
 */
Client.prototype._reopen = function() {
    var self = this,
        delay;

    this._reconnectionAttempts++;
    delay = this._reconnectionAttempts * this.options.reconnectionDelay;
    delay = Math.min(delay, this.options.maxReconnectionDelay);

    setTimeout(function() {
        self._open();
    }, delay);

    return this;
};

/**
 * Handle xhr error. Roll back "messages" and "delivered" to send them again by
 * next reconnect.
 *
 * @param {Object} data data which was not delivered.
 * @return {Client} this
 * @api private
 */
Client.prototype._onError = function(data) {
    this._connections--;

    if (data.delivered) {
        this._delivered.push.apply(this._delivered, data.delivered);
    }
    if (data.messages) {
        this._multiplexer.add(data.messages);
    }

    this._reopen();
};

/**
 * Handle xhr success. Emit events, send delivery confirmation.
 *
 * @param {Object} data data which was not delivered.
 * @return {Client} this
 * @api private
 */
Client.prototype._onSuccess = function(data) {
    var self = this;

    this.emit('success');
    this._connections--;
    this._reconnectionAttempts = 1;

    if (data.messages.length) {
        $.each(data.messages, function(message) {
            if (message.data.confirmation) self._delivered.push(message.id);
            if (message.data.event) {
                self.emit(message.data.event, message.data.data);
            }
            self.emit('message', message);
        });
    }

    // Send delivery confirmation immediately.
    this._open(Boolean(this._delivered.length));
};

});
require.register("simpleio/lib/shared/Multiplexer.js", function(exports, require, module){
 var Emitter,
    $ = require('./utils');

try {
    Emitter = require('emitter-component');
} catch(err) {
    Emitter = require('emitter');
}

/**
 * Multiplexer constructor.
 *
 * @param {Object} opts
 *   - `duration` amount of time in ms to wait until emiting "reset" event if
 *     messages are collected.
 * @api public
 */
function Multiplexer(opts) {
    var self = this;
    this._messages = [];
    this._timeoutId = setInterval(function() {
        self.reset(true);
    }, opts.duration);
}

Emitter(Multiplexer.prototype);
module.exports = Multiplexer;

/**
 * Add message(s).
 *
 * @param {Mixed} messages
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.add = function(messages) {
    if ($.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else if (messages) {
        this._messages.push(messages);
    }

    return this;
};

/**
 * Reset multiplexer, emit "reset" if there are messages.
 *
 * @param {Boolean} [emit] only emit "reset" if true.
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.reset = function(emit) {
    if (this._messages.length) {
        if (emit) this.emit('reset');
        this._messages = [];
    }

    return this;
};

/**
 * Get messages.
 *
 * @return {Array}
 * @api public
 */
Multiplexer.prototype.get = function() {
    return this._messages;
};

/**
 * Stop multiplexer
 *
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.stop = function() {
    clearInterval(this._timeoutId);
    this.removeAllListeners();

    return this;
};

});
require.register("simpleio/lib/shared/utils.js", function(exports, require, module){
var toString = Object.prototype.toString,
    nativeForEach = Array.prototype.forEach,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    slice = Array.prototype.slice;

/**
 * Crossengine detecttion if passed object is an array.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */
exports.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
};

/**
 * Crossbrowser Date.now.
 *
 * @return {Number}
 * @api public
 */
exports.now = Date.now || function() {
    return new Date().getTime();
};

/**
 * The cornerstone, an `each` implementation, aka `forEach`.
 * Handles objects with the built-in `forEach`, arrays, and raw objects.
 * Delegates to **ECMAScript 5**'s native `forEach` if available.
 *
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} [context]
 * @api public
 */
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

/**
 * Shortcut for hasOwnProperty.
 *
 * @param {Object} obj
 * @param {String} key
 * @return {Boolean}
 * @api public
 */
exports.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
};

/**
 * Extend first passed object by the following.
 *
 * @param {Object} obj
 * @returm {Object}
 * @api public
 */
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

/**
 * Generate a unique id.
 *
 * @return {Number}
 * @api public
 */
exports.uid = function() {
    return Math.round(Math.random() * exports.now());
};

});
require.alias("component-emitter/index.js", "simpleio/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("simpleio/lib/client/index.js", "simpleio/index.js");

if (typeof exports == "object") {
  module.exports = require("simpleio");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("simpleio"); });
} else {
  this["simpleio"] = require("simpleio");
}})();