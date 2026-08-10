(function () {
  // Docsify hash routes (#/page) are invalid CSS selectors; guard querySelector
  // so scroll/active helpers never throw when given a route-like fragment.
  var docProto = Document.prototype;
  var origQS = docProto.querySelector;
  var origQSA = docProto.querySelectorAll;
  function safeCall(fn, ctx, args) {
    try {
      return fn.apply(ctx, args);
    } catch (err) {
      return fn === origQSA ? [] : null;
    }
  }
  docProto.querySelector = function (selectors) {
    if (typeof selectors === 'string' && selectors.indexOf('#/') === 0) return null;
    return safeCall(origQS, this, arguments);
  };
  docProto.querySelectorAll = function (selectors) {
    if (typeof selectors === 'string' && selectors.indexOf('#/') === 0) {
      return document.createDocumentFragment().querySelectorAll('*');
    }
    return safeCall(origQSA, this, arguments);
  };

  var path = location.pathname || '';
  var base = path.replace(/\/[^/]*$/, '/');
  if (base.indexOf('/docs') === -1 && path.indexOf('/docs') === -1) {
    base = path.replace(/\/?$/, '/') + 'docs/';
  }
  window.$docsify = {
    el: '#app',
    name: 'Flareform Docs',
    loadSidebar: false,
    loadNavbar: false,
    subMaxLevel: 2,
    auto2top: true,
    homepage: 'README.md',
    themeColor: '#1a1a1a',
    notFoundPage: '_404.md',
    noEmoji: true,
    routerMode: 'hash',
    basePath: base,
    alias: {
      '/.*/_404.md': '/_404.md'
    }
  };
})();
