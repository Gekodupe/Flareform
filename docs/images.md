# Images

Image uploads use a **separate monthly image quota** (not the same counter as form/log rows, but still gated by plan).

## Limits

| Plan | Images / month | Max size |
|------|----------------|----------|
| Free | 50 | 2 MB |
| Starter | 2,000 | 2 MB |
| Pro | 20,000 | 2 MB |

Types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`. Max **5 images** per submission.

## Multipart example

```html
<form action="https://flareform-api.nic-58f.workers.dev/f/prj_xxx" method="POST" enctype="multipart/form-data">
  <input type="text" name="name" required>
  <input type="file" name="photo" accept="image/*">
  <button type="submit">Send</button>
</form>
```

Stored images appear in the submission payload as `_images` with public URLs:

```text
GET https://flareform-api.nic-58f.workers.dev/v1/files/img_…
```
