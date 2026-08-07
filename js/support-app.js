async function initSupportTab() {
  var btn = document.getElementById('support-submit-btn');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', supportSubmit);
  }
  if (fbEmail) {
    var emailEl = document.getElementById('support-email');
    if (emailEl && !emailEl.value) emailEl.value = fbEmail;
  }
}

async function supportSubmit() {
  var name = String((document.getElementById('support-name') || {}).value || '').trim();
  var email = String((document.getElementById('support-email') || {}).value || '').trim();
  var topic = String((document.getElementById('support-topic') || {}).value || '').trim();
  var message = String((document.getElementById('support-message') || {}).value || '').trim();
  if (!name || !email || !topic || message.length < 10) {
    showToast('Fill all fields (message at least 10 characters)', 'warning');
    return;
  }
  var btn = document.getElementById('support-submit-btn');
  if (btn) btn.disabled = true;
  try {
    var res = await fbFetch('/v1/support', {
      method: 'POST',
      body: { name: name, email: email, topic: topic, message: message }
    });
    showToast(res.message || 'Message sent', 'success');
    var msg = document.getElementById('support-message');
    if (msg) msg.value = '';
  } catch (e) {
    showToast(e.message || 'Could not send', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}
