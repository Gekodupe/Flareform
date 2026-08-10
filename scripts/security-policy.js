// Shared Content-Security-Policy and security headers for serve.js and static hosts.
// Cloudflare Pages combines matching _headers rules; never emit CSP on both /* and /docs/*
// or browsers enforce both policies and block legitimate scripts.

const CDN_SCRIPT_ORIGINS = [
  'https://cdnjs.cloudflare.com',
  'https://d3js.org',
  'https://cdn.jsdelivr.net'
];

function buildContentSecurityPolicy(options) {
  options = options || {};
  const scriptOrigins = options.docs
    ? ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net']
    : CDN_SCRIPT_ORIGINS;
  const directives = [
    "default-src 'self'",
    "script-src 'self' " + scriptOrigins.join(' '),
    "script-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com" +
      (options.docs ? '' : ' https://unpkg.com') +
      ' https://cdn.jsdelivr.net',
    "font-src 'self' https://fonts.gstatic.com data:" +
      (options.docs ? '' : ' https://unpkg.com') +
      ' https://cdn.jsdelivr.net',
    "img-src 'self' data: blob: https://*.workers.dev",
    options.docs
      ? "connect-src 'self' https://cdn.jsdelivr.net"
      : "connect-src 'self' http://127.0.0.1:8787 http://localhost:8787 https://*.workers.dev https://cdn.jsdelivr.net",
    "frame-src 'self'",
    "child-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'"
  ];
  if (options.upgradeInsecure) {
    directives.push('upgrade-insecure-requests');
  }
  if (options.frameAncestors === 'self') {
    directives.push("frame-ancestors 'self'");
  } else if (options.frameAncestors !== false) {
    directives.push("frame-ancestors 'none'");
  }
  return directives.join('; ');
}

function buildMetaContentSecurityPolicy() {
  // Meta CSP cannot set frame-ancestors; keep embeddable docs working via _headers.
  return buildContentSecurityPolicy({ frameAncestors: false });
}

function getSecurityHeaders(options) {
  options = options || {};
  const frameAncestors = options.allowFraming ? 'self' : true;
  const headers = {
    'Content-Security-Policy': buildContentSecurityPolicy({
      upgradeInsecure: !!options.upgradeInsecure,
      frameAncestors: frameAncestors,
      docs: !!options.docs
    }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': options.allowFraming ? 'SAMEORIGIN' : 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off'
  };
  if (options.hsts) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  return headers;
}

function getSharedStaticHeaders(options) {
  options = options || {};
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off'
  };
  if (options.hsts) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  return headers;
}

function appendHeaderBlock(lines, pathPattern, headers) {
  lines.push(pathPattern);
  Object.entries(headers).forEach(function (entry) {
    lines.push('  ' + entry[0] + ': ' + entry[1]);
  });
  lines.push('');
}

function buildHeadersFile(options) {
  options = options || {};
  const shared = getSharedStaticHeaders({ hsts: true });
  const appCsp = {
    'Content-Security-Policy': buildContentSecurityPolicy({
      upgradeInsecure: true,
      frameAncestors: true
    }),
    'X-Frame-Options': 'DENY'
  };
  const docsCsp = {
    'Content-Security-Policy': buildContentSecurityPolicy({
      upgradeInsecure: true,
      frameAncestors: 'self',
      docs: true
    }),
    'X-Frame-Options': 'SAMEORIGIN'
  };

  // CSP must not appear on /* — Pages merges matching rules and stacked CSPs all apply.
  // Use a single /docs/* rule so /docs/ and /docs/index.html do not get duplicate CSPs.
  const lines = [];
  appendHeaderBlock(lines, '/*', shared);
  appendHeaderBlock(lines, '/', appCsp);
  appendHeaderBlock(lines, '/index.html', appCsp);
  appendHeaderBlock(lines, '/404.html', appCsp);
  appendHeaderBlock(lines, '/docs/*', docsCsp);
  return lines.join('\n');
}

module.exports = {
  CDN_SCRIPT_ORIGINS,
  buildContentSecurityPolicy,
  buildMetaContentSecurityPolicy,
  getSecurityHeaders,
  getSharedStaticHeaders,
  buildHeadersFile
};
