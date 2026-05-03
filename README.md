# ePlate Pre-Launch App

This is a separate working preview app for the order system. It does not replace the SEO site in `/Users/jkang/Documents/eplate-static`.

## Run locally

```bash
python3 -m http.server 3000
```

Open:

```text
http://localhost:3000
```

## Preview accounts

Admin:

```text
username: admin
password: admin123
```

Installer:

```text
username: installer
password: install123
```

Customer login uses mock OTP. Click `Send OTP` and the demo OTP appears on screen.

## What is mocked

- OTP sending
- ToyyibPay payment
- WhatsApp messages
- Invoice delivery
- File storage

All data is stored in browser `localStorage`.

## Publish target

This app is prepared for GitHub Pages on:

```text
order.eplate.my
```

The `CNAME` file is already included.

Recommended publishing path:

1. Create a new GitHub repository, for example `eplate-order`.
2. Push this folder to that repository.
3. Enable GitHub Pages from the `main` branch root.
4. In Cloudflare DNS, add:

```text
order  CNAME  jasonzlah.github.io
```

Keep the record DNS only until GitHub Pages verifies the custom domain.
