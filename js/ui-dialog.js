/**
 * Shared Flareform UI dialogs — custom modal + confirm (no window.confirm).
 */
(function (global) {
  var root = null;
  var panel = null;
  var titleEl = null;
  var bodyEl = null;
  var actionsEl = null;
  var lastFocus = null;
  var onKey = null;

  function ensureDom() {
    if (root) return;
    root = document.getElementById('fb-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'fb-modal-root';
      root.className = 'fb-modal';
      root.hidden = true;
      root.innerHTML =
        '<div class="fb-modal-backdrop" data-fb-modal-close="1"></div>' +
        '<div class="fb-modal-panel" role="dialog" aria-modal="true" aria-labelledby="fb-modal-title">' +
        '<div class="fb-modal-head">' +
        '<h2 class="fb-modal-title" id="fb-modal-title"></h2>' +
        '<button type="button" class="fb-modal-x" data-fb-modal-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="fb-modal-body" id="fb-modal-body"></div>' +
        '<div class="fb-modal-actions" id="fb-modal-actions"></div>' +
        '</div>';
      document.body.appendChild(root);
    }
    panel = root.querySelector('.fb-modal-panel');
    titleEl = root.querySelector('#fb-modal-title');
    bodyEl = root.querySelector('#fb-modal-body');
    actionsEl = root.querySelector('#fb-modal-actions');
    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute('data-fb-modal-close')) {
        fbCloseModal();
      }
    });
  }

  function lockScroll(lock) {
    document.documentElement.classList.toggle('fb-modal-open', !!lock);
    document.body.classList.toggle('fb-modal-open', !!lock);
  }

  function fbCloseModal() {
    if (!root || root.hidden) return;
    root.hidden = true;
    lockScroll(false);
    if (onKey) {
      document.removeEventListener('keydown', onKey);
      onKey = null;
    }
    if (bodyEl) bodyEl.innerHTML = '';
    if (actionsEl) actionsEl.innerHTML = '';
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus();
      } catch (e) { /* ignore */ }
    }
    lastFocus = null;
    if (typeof global.fbOnModalClose === 'function') {
      try {
        global.fbOnModalClose();
      } catch (e) { /* ignore */ }
    }
  }

  /**
   * @param {object} opts
   * @param {string} opts.title
   * @param {string|Node} [opts.body] HTML string or Node
   * @param {Array<{label:string, className?:string, primary?:boolean, onClick?:Function}>} [opts.actions]
   * @param {boolean} [opts.dismissible=true]
   */
  function fbOpenModal(opts) {
    opts = opts || {};
    ensureDom();
    lastFocus = document.activeElement;
    titleEl.textContent = opts.title || '';
    bodyEl.innerHTML = '';
    if (opts.body instanceof Node) {
      bodyEl.appendChild(opts.body);
    } else if (opts.body != null) {
      bodyEl.innerHTML = String(opts.body);
    }
    actionsEl.innerHTML = '';
    (opts.actions || []).forEach(function (a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = a.className || (a.primary ? 'auth-primary' : 'secondary-btn');
      btn.textContent = a.label || 'OK';
      btn.addEventListener('click', function () {
        if (typeof a.onClick === 'function') a.onClick();
      });
      actionsEl.appendChild(btn);
    });
    root.hidden = false;
    lockScroll(true);
    if (onKey) document.removeEventListener('keydown', onKey);
    onKey = function (e) {
      if (e.key === 'Escape' && opts.dismissible !== false) {
        e.preventDefault();
        fbCloseModal();
      }
    };
    document.addEventListener('keydown', onKey);
    var focusBtn = actionsEl.querySelector('.auth-primary') || root.querySelector('.fb-modal-x');
    if (focusBtn) focusBtn.focus();
  }

  /**
   * Custom confirm. Resolves true/false.
   * @param {string} message
   * @param {{title?:string, confirmLabel?:string, cancelLabel?:string, danger?:boolean}} [opts]
   */
  function fbConfirm(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var settled = false;
      function done(v) {
        if (settled) return;
        settled = true;
        fbCloseModal();
        resolve(v);
      }
      var body = document.createElement('p');
      body.className = 'fb-modal-message';
      body.textContent = message;
      fbOpenModal({
        title: opts.title || 'Confirm',
        body: body,
        dismissible: true,
        actions: [
          {
            label: opts.cancelLabel || 'Cancel',
            className: 'secondary-btn',
            onClick: function () {
              done(false);
            }
          },
          {
            label: opts.confirmLabel || 'Confirm',
            className: opts.danger ? 'fb-btn-danger' : 'auth-primary',
            primary: !opts.danger,
            onClick: function () {
              done(true);
            }
          }
        ]
      });
      var prev = global.fbOnModalClose;
      global.fbOnModalClose = function () {
        global.fbOnModalClose = prev;
        if (!settled) {
          settled = true;
          resolve(false);
        }
        if (typeof prev === 'function') prev();
      };
    });
  }

  global.fbOpenModal = fbOpenModal;
  global.fbCloseModal = fbCloseModal;
  global.fbConfirm = fbConfirm;
})(typeof window !== 'undefined' ? window : globalThis);
