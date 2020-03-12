!function() {
  /**
   * The chaordic anonymous user id cookie's name
   *
   * @property ANONYMOUS_USER_ID_COOKIE
   * @static
   * @private
   *
   * @type {string}
   */
  var ANONYMOUS_USER_ID_COOKIE = 'chaordic_anonymousUserId';

  /**
   * The anonymous user prefix
   *
   * @property ANONYMOUS_PREFIX
   * @static
   * @private
   *
   * @type {string}
   */
  var ANONYMOUS_PREFIX = 'anon-';

  /**
   * A day in seconds (24 hours)
   *
   * @property COOKIE_DAY
   * @static
   * @private
   *
   * @type {number}
   */
  var COOKIE_DAY = 60 * 60 * 24;

  /**
   * The cookie time to live (for safari) in seconds
   *
   * @property COOKIE_TTL
   * @static
   * @private
   *
   * @type {number}
   */
  var COOKIE_TTL = COOKIE_DAY * 365;

  /**
   * The chaordic id cookie name
   *
   * @property ID_COOKIE
   * @static
   * @private
   *
   * @type {string}
   */
  var ID_COOKIE = 'chaordic_browserId';

  /**
   * The chaordic session cookie name
   *
   * @property SESSION_COOKIE
   * @static
   * @private
   */
  var SESSION_COOKIE = 'chaordic_session';

  /**
   * The session time to live (30 mins)
   *
   * @property SESSION_TTL
   * @static
   * @private
   */
  var SESSION_TTL = 60 * 30;

  /**
   * The endpoint used for dynamic remoting
   *
   * @property DYNAMIC_HOST
   * @for chaordic.Config
   * @static
   *
   * @type {string}
   */
  var DYNAMIC_HOST = 'onsite.chaordicsystems.com';

  /**
   * Indicates whether the navigator is Internet Explorer
   *
   * @property isIE
   * @private
   *
   * @type {boolean}
   */
  var isIE = (function (m) { return m && m[1]; })(navigator.userAgent.match(/MSIE\s([^;]*)/));

  /**
   * Tracks the loading of a script element. When the script is loaded and
   * run, first the "success" callback
   *
   * @method track
   * @private
   *
   * @param {HTMLScriptElement} node the "script" node
   * @param {function} success the success callback function
   */
  var track = (function () {
    if (isIE) {
        return function (node, success) {
            var check = function (rs) {
                if ('loaded' === rs || 'complete' === rs) {
                    success();
                }
            };

            check(node.readyState);
            node.onreadystatechange = function () { check(this.readyState); };
        };
    }

    if (/KHTML/.test(navigator.userAgent)) {
        return function (node, success) {
            node.addEventListener('load', success, false);
        };
    }

    return function (node, success) {
        node.onload = success;
    };
  }());

  var PROTOCOL = 'https://';

  var DOMAIN = document.domain;

  function setupIdentity (apiKey, success) {
    API_KEY = apiKey;

    success = success || function () { console.log('BrowserId was resolved'); };

    resolveBrowserId(function (browserId) {
      writeCookie(ID_COOKIE, browserId, COOKIE_TTL);
      var anonymousUserId = resolveAnonymousUserId(browserId);

      var Identity = {
        browserId: browserId,
        anonymousUserId: anonymousUserId,
        session: resolveSession()
      };

      success(Identity);
    })
  }

  function resolveBrowserId (success) {
    var setupCookie = function (id) {
      writeCookie(ID_COOKIE, id, COOKIE_TTL);
      success(id);
    };

    var id = readCookie(ID_COOKIE);

    /* Clean-up browserId cookie that have been set
      * to the wrong values (undefined), and the browserIds generated
      * on frontend (do not have "-") */
    if (id && id !== 'undefined' && id.indexOf('-') !== -1) {
      setupCookie(id);
    } else {
      return acquireBrowserId(setupCookie);
    }
  }

  function acquireBrowserId (success) {
    // var t = timestamp();
    var src = PROTOCOL + DYNAMIC_HOST + '/datakeeper/acquireBrowserId';

    jsonp(src, { q: '{"apiKey":"' + API_KEY + '"}' }, function (data) {
      // chaordic.ttco = timestamp() - t;

      if (data.ok === false) {
        console.error('ERROR', 'fail to acquire browser id', data.msg);
        return;
      }

      if (data.anonymousUserId) { // legacy anon-user-id sent from the server
        writeCookie(ANONYMOUS_USER_ID_COOKIE, data.anonymousUserId, COOKIE_TTL);
      }

      success(data.browserId);
    });
  };

  function resolveSession () {
    var session = readCookie(SESSION_COOKIE);
    if (!session) {
        session = timestamp() + '-' + Math.random();
    }

    writeCookie(SESSION_COOKIE, session, SESSION_TTL);
    return session;
  };

  function timestamp () {
    return new Date().getTime();
  };

  function readCookie(name) {
    name += '=';
    var  ca = document.cookie.split(';');
    var c;
    var i = 0;
    var l = ca.length;

    while (i < l) {
      c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(name) === 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
      }
      i += 1;
    }
    return null;
  };

  function writeCookie(name, content, age) {
    var cookie = name + '=' + encodeURIComponent(content) + '; path=/;';
    var domainTest = getCurrentDomain(document.domain);

    if (domainTest.indexOf(DOMAIN) > -1) {
        cookie += 'domain=' + DOMAIN;
    }

    if (arguments.length > 2) {
        if (typeof age === 'number') {
            cookie += '; max-age=' + age;
        } else if (age instanceof Date) {
            cookie += '; expires=' + age.toUTCString();
        } else {
            cookie += '; expires=' + age;
        }
    }

    document.cookie = cookie;
  }

  function getCurrentDomain(domainTest) {
    return /[w]{1,3}\./g.test(domainTest) ? domainTest : '.' + domainTest;
  }

  function resolveAnonymousUserId(browserId) {
    var id = ANONYMOUS_PREFIX + browserId;

    writeCookie(ANONYMOUS_USER_ID_COOKIE, id, COOKIE_TTL);
    return id;
  }

  function jsonp (src, params, callback) {
    var failTimeout;
    var callbackName = '_chaordicJsonp_' + timestamp() + parseInt(Math.random() * 10000);
    var removeCallback = function () {
      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }
    };

    window[callbackName] = function (data) {
      try {
        callback(data);
        clearTimeout(failTimeout);
      } finally {
        removeCallback();
      }
    };

    var pairs = [];
    params.callback = callbackName;
    forEach(params, function (v, k) {
      pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });

    if (pairs.length !== 0) {
        if (src.indexOf('?') === -1) {
            src += '?';
        }

        src += pairs.join('&');
    }

    includeScript(src);
  }

  function includeScript (script, success) {
    var insertionPoint = document.getElementsByTagName('head')[0] || document.documentElement;
    var node = document.createElement('script');

    if (success) {
      track(node, success);
    }

    node.setAttribute('charset', 'UTF-8');
    node.setAttribute('async', true);
    node.src = script;
    insertionPoint.insertBefore(node, insertionPoint.firstChild);
    return node;
  };

  function forEach (a, f) {
    if (Object.prototype.toString.call(a) === "[object Array]") {
      for (var i = 0, l = a.length; i < l; i += 1) {
        f(a[i], i);
      }
    } else {
      for (var p in a) {
        if (Object.prototype.hasOwnProperty.call(a, p)) {
          f(a[p], p);
        }
      }
    }
  };

  window.top.linxImpulseSetupIdentity = setupIdentity;
}();
