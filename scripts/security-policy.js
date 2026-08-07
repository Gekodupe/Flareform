// Shared Content-Security-Policy and security headers for serve.js and static hosts.

const CDN_SCRIPT_ORIGINS = [
  'https://cdnjs.cloudflare.com',
  'https://d3js.org',
  'https://cdn.jsdelivr.net'
];

function buildContentSecurityPolicy(options) {
  options = options || {};
  const directives = [
    "default-src 'self'",
    "script-src 'self' " + CDN_SCRIPT_ORIGINS.join(' '),
    "script-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com data: https://unpkg.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob:",
    "connect-src 'self' http://127.0.0.1:8787 http://localhost:8787 https://*.workers.dev https://cdn.jsdelivr.net",
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
  if (options.frameAncestors) {
    directives.push("frame-ancestors 'none'");
  }
  return directives.join('; ');
}

function buildMetaContentSecurityPolicy() {
  return buildContentSecurityPolicy();
}

function getSecurityHeaders(options) {
  options = options || {};
  const headers = {
    'Content-Security-Policy': buildContentSecurityPolicy({
      upgradeInsecure: !!options.upgradeInsecure,
      frameAncestors: true
    }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
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

function buildHeadersFile(options) {
  options = options || {};
  const headers = getSecurityHeaders({ upgradeInsecure: true, hsts: true });
  const lines = ['/*'];
  Object.entries(headers).forEach(function (entry) {
    lines.push('  ' + entry[0] + ': ' + entry[1]);
  });
  lines.push('');
  return lines.join('\n');
}

module.exports = {
  CDN_SCRIPT_ORIGINS,
  buildContentSecurityPolicy,
  buildMetaContentSecurityPolicy,
  getSecurityHeaders,
  buildHeadersFile
};
