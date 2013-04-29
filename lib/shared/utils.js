var toString = Object.prototype.toString,
    nativeForEach = Array.prototype.forEach,
    hasOwnProperty = Object.prototype.hasOwnProperty;

exports.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
};

exports.now = Date.now || function() {
    return new Date().getTime();
};

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
// Slightly modified underscores implementation.
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

exports.extend = function(target, source) {
    var prop;

    if (target && source) {
        for (prop in source) {
            target[prop] = source[prop];
        }
    }

    return target;
};
