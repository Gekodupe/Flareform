(function () {
  var path = location.pathname || '';
  var base = path.replace(/\/[^/]*$/, '/');
  if (base.indexOf('/docs') === -1 && path.indexOf('/docs') === -1) {
    base = path.replace(/\/?$/, '/') + 'docs/';
  }
  window.$docsify = {
    el: '#app',
    name: 'Flareform Docs',
    loadSidebar: false,
    subMaxLevel: 2,
    auto2top: true,
    homepage: 'README.md',
    themeColor: '#1a1a1a',
    notFoundPage: '_404.md',
    noEmoji: true,
    routerMode: 'hash',
    basePath: base
  };
})();
