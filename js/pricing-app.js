// Flareform Pricing + Stripe checkout
function pricingFmtMoney(n) {
  if (n == null || n === 0) return '$0';
  return '$' + n;
}

function pricingRenderPlans(payload) {
  var grid = document.getElementById('pricing-grid');
  if (!grid) return;
  var plans = (payload && payload.plans) || [];
  var stripeOn = !!(payload && payload.stripeConfigured);
  grid.innerHTML = '';

  plans.forEach(function (p) {
    var card = document.createElement('article');
    card.className = 'pricing-card';
    var cta = '';
    if (p.id === 'free') {
      cta = '<button type="button" onclick="switchToTab(\'6\')">Get started</button>';
    } else if (stripeOn && p.priceId) {
      cta = '<button type="button" onclick="pricingCheckout(\'' + p.id + '\')">Upgrade</button>';
    } else {
      cta = '<button type="button" class="secondary-btn" disabled>Stripe setup required</button>';
    }
    var feats = (p.features || [])
      .map(function (f) {
        return '<li>' + f + '</li>';
      })
      .join('');
    card.innerHTML =
      '<p class="pricing-card-name">' +
      p.name +
      '</p>' +
      '<p class="pricing-card-price">' +
      pricingFmtMoney(p.priceMonthly) +
      '<span class="pricing-card-period">/mo</span></p>' +
      '<p class="pricing-card-blurb">' +
      (p.blurb || '') +
      '</p>' +
      '<ul class="pricing-card-features">' +
      feats +
      '</ul>' +
      cta;
    grid.appendChild(card);
  });
}

async function pricingCheckout(plan) {
  if (!fbIsSignedIn()) {
    showToast('Sign in on Account first to upgrade', 'warning');
    switchToTab('6');
    return;
  }
  try {
    showToast('Opening secure checkout...', 'warning');
    var res = await fbFetch('/v1/billing/checkout', { method: 'POST', body: { plan: plan } });
    if (res.url) {
      window.location.href = res.url;
      return;
    }
    throw new Error('No checkout URL');
  } catch (e) {
    showToast(e.message || 'Checkout failed', 'error');
  }
}

async function pricingOpenPortal() {
  if (!fbIsSignedIn()) {
    showToast('Sign in on Account to manage billing', 'warning');
    switchToTab('6');
    return;
  }
  try {
    var res = await fbFetch('/v1/billing/portal', { method: 'POST', body: {} });
    if (res.url) window.location.href = res.url;
  } catch (e) {
    showToast(e.message || 'Portal unavailable', 'error');
  }
}

async function initPricingTab() {
  var hash = location.hash || '';
  if (hash.indexOf('checkout=success') >= 0) {
    showToast('Subscription updated. Refresh Account if plan looks stale.', 'success');
  } else if (hash.indexOf('checkout=cancel') >= 0) {
    showToast('Checkout canceled', 'warning');
  }

  try {
    var data = await fbFetch('/v1/billing/plans');
    pricingRenderPlans(data);
  } catch (e) {
    pricingRenderPlans({
      stripeConfigured: false,
      plans: [
        {
          id: 'free',
          name: 'Free',
          priceMonthly: 0,
          blurb: 'Hosted starter limits.',
          features: ['3 projects', '1k submissions / month']
        },
        {
          id: 'starter',
          name: 'Starter',
          priceMonthly: 19,
          blurb: 'Growing sites.',
          features: ['15 projects', '25k submissions / month']
        },
        {
          id: 'pro',
          name: 'Pro',
          priceMonthly: 49,
          blurb: 'Production volumes.',
          features: ['100 projects', '200k submissions / month']
        }
      ]
    });
  }
}
