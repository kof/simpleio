/*!
 * Dependencies.
 */
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
