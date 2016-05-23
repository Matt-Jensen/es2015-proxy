## es2015 Proxy
[![Build Status](https://travis-ci.org/Matt-Jensen/es2015-proxy.svg?branch=master)](https://travis-ci.org/Matt-Jensen/es2015-proxy)
[![GitHub version](https://badge.fury.io/gh/GoogleChrome%2Fproxy-polyfill.svg)](https://badge.fury.io/gh/GoogleChrome%2Fproxy-polyfill)

A simple module that returns the native Proxy implementation if supported, otherwise resolves Google Chrome's [proxy-polyfill](https://github.com/GoogleChrome/proxy-polyfill).

Consumable as AMD, CommonJS, or a Global module.

## Usage

Node
```
const Proxy = require('es2015-proxy');
```

Everywhere else import
`dist/proxy-polyfill.min.js`.
