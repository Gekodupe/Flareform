# Forms & email

## HTML forms (Formspree-style)

Set `action` to your project endpoint and `method="POST"`.

```html
<form action="https://flareform-api.nic-58f.workers.dev/f/prj_xxx" method="POST">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <input type="hidden" name="_next" value="https://yoursite.com/thanks">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">Send</button>
</form>
```

## Form-to-email

On **Projects**, leave **Email me new form submissions** checked. Notifications always go to the signed-in account email.

Non-spam submissions trigger a Brevo transactional email with the field table.

Spam-scored submissions are stored in Inbox for review, do not email, and do not count toward the monthly submission quota.

## Origins & Turnstile

- **Allowed origins** - comma-separated; blank = any. When set, browser `Origin` or `Referer` must match (requests with neither are rejected).
- **Turnstile** - require `cf-turnstile-response` when enabled

## AJAX / fetch

```js
await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ name, email, message })
});
```
