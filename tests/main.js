var Impl = require('../test-helpers/implementation').default;
var buildObject = require('../test-helpers/helpers').buildObject;
var test = require('tape');

test('get', function(t) {
  var testObj = buildObject();
  var gets = [];
  var p = new Impl(testObj, {
    get: function(obj, prop) {
      gets.push(prop);
      return obj[prop];
    }
  });

  p.name;
  p.sub;
  p.sub.name;

  var s = p.sub;
  s.name; // not a get

  t.deepEqual(gets.join(' '), 'name sub sub sub');

  t.end();
});

test('set', function(t) {
  var testObj = buildObject();
  var sets = [];
  var p = new Impl(testObj, {
    set: function(obj, prop) {
      sets.push(prop);
      return true;
    }
  });

  p.value += 1;
  p.sub = 45;

  t.ok(typeof p.sub !== 'number', 'setter should not actually set');
  t.deepEqual(sets, 'value sub'.split(/\s+/));

  t.end();
});

test('proxy chain', function(t) {
  var object = {
    value: 123
  };
  var p = new Impl(object, {});
  var pp = new Impl(p, {
    get: function(obj, prop) {
      return obj[prop];
    }
  });
  var ppp = new Impl(pp, {});

  t.equal(ppp.value, 123, 'should return original object value');

  t.end();
});

test('callable', function(t) {
  var calls = 0;
  var callable = function() {
    return ++calls;
  };

  var p = new Impl(callable, {});
  t.equal(1, p());
  t.equal(2, callable());
  t.equal(3, p());

  t.end();
});

// test wrapping a constructor without proxying it
test('wrap constructor', function(t) {
  var fn = function(y) {
    this.x = 1;
  };
  fn.prototype.sentinel = true;

  var P = new Impl(fn, {});
  var obj = new P();

  t.ok(obj.sentinel, 'prototype not configured correctly');

  t.end();
});

test('construct/apply assertions', function(t) {
  var pc = new Impl({}, {
    construct: function(target, argumentsList) {
      t.fail('should not get here');
    }
  });

  t.throws(function() {
    pc();
  }, TypeError);

  var Pa = new Impl({}, {
    apply: function(target, argumentsList) {
      t.fail('should not get here');
    }
  });

  t.throws(function() {
    new Pa();
  }, TypeError);

  t.end();
});

test('construct', function(t) {
  var fn = function(y) {
    var me = this || {};  // this won't be set in strict mode, fake it
    me.x = (y || 0);
    return me;
  };
  fn.prototype.sentinel = true;

  var P = new Impl(fn, {
    construct: function(Target, argumentsList) {
      return new Target((argumentsList[0] || 0) + 10);
    }
  });

  var obj = new P(5);
  t.equal(obj.x, 15);
  t.ok(obj.sentinel);

  var funcObj = P(5);
  t.equal(funcObj.x, 5);
  t.notOk(funcObj.sentinel, 'apply use should not contain sentinel');

  t.end();
});

test('proxy without construct handler passes arguments', function(t) {
  var cls = function(x, y) {
    t.ok(this instanceof cls, 'cls prototype is not set correctly');
    this.x = x;
    this.y = y;
  };

  var P = new Impl(cls, {});
  var x = new P(1, 2);

  t.equal(x.x, 1);
  t.equal(x.y, 2);

  t.end();
});

test('apply on non-function', function(t) {
  var object = {};
  var dummy = new Impl(object, {});

  t.notOk(typeof dummy === 'function', 'stock proxy is not function');
  t.throws(function() {
    dummy();
  }, TypeError);

  var p = new Impl(object, {
    apply: function() {
      // doesn't matter
    }
  });

  t.doesNotThrow(function() {
    // TODO(samthor): Firefox errors on this in native!
    // It expects the proxied object to actually be a function, unlike Chrome.
    p();
  });

  t.end();
});

test('traps function', function(t) {
  var real = function(x, y) {
    return 1;
  };
  var p = new Impl(real, function(x, y) {
    t.equal(this, real);
    t.equal(this(), 1);
    t.equal(x, undefined);  // arguments aren't passed
    t.equal(y, undefined);
    return 2;
  });

  t.equal(p(3, 4), 2);

  t.end();
});

test('revocable proxy', function(t) {
  var p = Impl.revocable({ a: 1 }, {});
  p.proxy.a = 2;

  p.revoke();
  t.throws(function() {
    p.proxy.a = 3;
  }, TypeError);

  var calls = 0;
  p = Impl.revocable({ b: 2 }, {
    get: function(obj, prop) {
      ++calls;
      return obj[prop];
    }
  });
  p.proxy.b;
  p.proxy.b;

  p.revoke();
  t.throws(function() {
    p.proxy.b;
  }, TypeError);
  t.equal(calls, 2);

  var fn = function() {
    t(false, 'should never get here');
  };
  p = Impl.revocable(fn, {
    apply: function() {
      // doesn't matter
    }
  });
  p.revoke();
  t.throws(function() {
    p.proxy();
  }, TypeError);

  t.end();
});

test('proxy instance of class', function(t) {
  var Cls = function() {
    this.y = 1;
  };

  Cls.prototype.x = function() {
    ++this.y;
  };

  var inst = new Cls();
  var p = new Impl(inst, {});

  t.ok('x' in inst, 'inst should have function');
  t.ok('x' in p, 'proxy should have function');

  p.x();
  t.equal(p.y, 2);

  t.end();
});

test('trap instance methods', function(t) {
  var Cls = function() {
    this.y = 1;
  };
  Cls.prototype.x = function() {};

  var inst = new Cls();
  var found;
  var p = new Impl(inst, {
    get: function(obj, prop) {
      t.equal(obj, inst);
      found = prop;
      return obj[prop];
    }
  });

  p.x();

  t.equal(found, 'x', 'expected get of function');

  // Confirm set method behavior, proxy vs polyfill.
  var custom = function() {
    this.y = 2;
  };
  var supportSet = true;
  try {
    inst.x = custom;
  } catch (e) {
    supportSet = false;
  }

  p.x();
  t.equal(p.y, 1);

  t.end();
});

// general polyfill

test('seals object', function(t) {
  var testObj = buildObject();
  t.notOk(Object.isSealed(testObj));

  var p = new Impl(testObj, {});
  t.ok(Object.isSealed(testObj));
  t.ok(Object.isSealed(p), 'proxy should also be sealed');

  new Impl(testObj, {});
  t.ok(Object.isSealed(testObj));

  var pp = new Impl(p, {});
  t.ok(Object.isSealed(p));

  t.end();
});

test('seals array', function(t) {
  var testArray = [7,8,9];
  t.notOk(Object.isSealed(testArray));

  var p = new Impl(testArray, {});
  t.ok(Object.isSealed(testArray));
  t.ok(Object.isSealed(p), 'proxy should also be sealed');
  t.throws(function() {
    p.push(1);
  }, TypeError);

  // slice is a copy of array
  var slice = testArray.slice(0, 1);
  slice.push(2);
  t.equal(slice.length, 2);

  t.end();
});

// nb. Trying to resolve issue #12
test('array as property', function(t) {
  var testObj = {arr: [1,2,3]};
  var p = new Impl(testObj, {
    get: function(obj, prop) {
      return obj[prop];  // zero get handler
    }
  });

  t.equal(p.arr.length, 3);
  p.arr.push(4);
  t.equal(p.arr.length, 4);

  p.arr.splice(0,2);
  t.equal(p.arr.length, 2);

  t.end();
});
