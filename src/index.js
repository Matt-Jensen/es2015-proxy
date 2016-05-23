import Implementation from './implementation';

if (typeof exports === 'object') {
  module.exports = typeof Proxy !== 'function' ? Implementation : Proxy;
} else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
  define(function() { return (typeof Proxy !== 'function' ? Implementation : Proxy); });
} else if (window && !window.Proxy) {
  window.Proxy = Implementation;
}
