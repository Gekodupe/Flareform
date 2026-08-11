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
  grid.textContent = '';

  plans.forEach(function (p) {
    var card = document.createElement('article');
    card.className = 'pricing-card';

    var nameEl = document.createElement('p');
    nameEl.className = 'pricing-card-name';
    nameEl.textContent = p.name || '';
    card.appendChild(nameEl);

    var priceEl = document.createElement('p');
    priceEl.className = 'pricing-card-price';
    priceEl.appendChild(document.createTextNode(pricingFmtMoney(p.priceMonthly)));
    var period = document.createElement('span');
    period.className = 'pricing-card-period';
    period.textContent = '/mo';
    priceEl.appendChild(period);
    card.appendChild(priceEl);

    var blurb = document.createElement('p');
    blurb.className = 'pricing-card-blurb';
    blurb.textContent = p.blurb || '';
    card.appendChild(blurb);

    var ul = document.createElement('ul');
    ul.className = 'pricing-card-features';
    (p.features || []).forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });
    card.appendChild(ul);

    var btn = document.createElement('button');
    btn.type = 'button';
    if (p.id === 'free') {
      btn.textContent = 'Get started';
      btn.addEventListener('click', function () {
        switchToTab('6');
      });
    } else if (stripeOn && p.priceId) {
      btn.textContent = 'Upgrade';
      btn.addEventListener('click', function () {
        pricingCheckout(p.id);
      });
    } else {
      btn.className = 'secondary-btn';
      btn.disabled = true;
      btn.textContent = 'Stripe setup required';
    }
    card.appendChild(btn);
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
          features: ['3 projects', '1k forms+logs / month', '2 API keys']
        },
        {
          id: 'starter',
          name: 'Starter',
          priceMonthly: 19,
          blurb: 'Growing sites.',
          features: ['15 projects', '25k forms+logs / month', '5 API keys']
        },
        {
          id: 'pro',
          name: 'Pro',
          priceMonthly: 49,
          blurb: 'Production volumes.',
          features: ['100 projects', '200k forms+logs / month', '10 API keys']
        }
      ]
    });
  }
}
