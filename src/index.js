import Implementation from './implementation';

if (typeof exports === 'object') {
  module.exports = Proxy || Implementation;
} else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
  define(function() { return Proxy || Implementation; });
} else if (window && !window.Proxy) {
  window.Proxy = Implementation;
}
