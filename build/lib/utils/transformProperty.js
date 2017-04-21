'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function () {
    if (typeof document === 'undefined' || // for serverside rendering
    typeof document.documentElement.style === 'string') {
        return 'transform';
    }
    return 'WebkitTransform';
}();