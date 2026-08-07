# Quick start

## 1. Create an account

Open Flareform → **Account** → register with email and password (or magic code).

## 2. Create a project

**Projects** → name it → optionally enable logs and Turnstile → **Create**.

Copy your form endpoint:

```text
https://flareform-api.nic-58f.workers.dev/f/{projectId}
```

## 3. Point your HTML form at it

```html
<form action="https://flareform-api.nic-58f.workers.dev/f/prj_YOUR_ID" method="POST">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <input type="text" name="_gotcha" style="display:none">
  <button type="submit">Send</button>
</form>
```

Or JSON:

```bash
curl -X POST https://flareform-api.nic-58f.workers.dev/f/prj_YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","message":"Hello"}'
```

## 4. Read submissions

Open **Inbox**. Enable **Notify email** on the project for form-to-email.

## 5. Optional: error logs

Enable logs on the project, then:

```bash
curl -X POST https://flareform-api.nic-58f.workers.dev/l/prj_YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{"level":"error","message":"TypeError: x","url":"https://yoursite.com"}'
```
