# Sprouted Grace Ministry app

**app.sproutedgrace.net** · Rooted in His Words. Growing in Grace.

This is one web page that works like a phone app. GitHub Pages shows it to the world. Supabase keeps accounts, posts, and Library files. The Bible is saved right in this folder, so it works with no internet.

---

## What is in this folder

| File or folder | What it does |
|---|---|
| `index.html` | The whole app. Your settings are at the top, in `CONFIG`. |
| `sw.js` | Lets the app open fast and work offline. |
| `manifest.json` | Lets people add the app to their home screen. |
| `bible/kjv/` and `bible/web/` | The King James Version and the World English Bible. One file per book (1 = Genesis, 66 = Revelation). The words of Jesus are inside `{ }` so the app can show them in red. |
| `fonts/` | The Bible font (EB Garamond). |
| `qrcode.js` | Draws the Bitcoin QR code on the Give page. |
| `logo.png`, `favicon.png`, `apple-touch-icon.png`, `icon-*.png` | Logo and app icons. |
| `hero.jpg` | The sprout-through-concrete photo at the top of Home. |
| `og-image.jpg` | The picture that shows when someone shares the link. |
| `CNAME` | Tells GitHub Pages to use app.sproutedgrace.net. |
| `supabase-setup.sql` | Sets up the church database. Run it one time. |
| `tools/make-icons.py` | Makes all the icons from your logo. |

---

## Step 1. Make a new Supabase project

Use a **brand-new** project. Do not reuse any other app's project or members.

1. Go to supabase.com and sign in. Click **New project**. Name it "Sprouted Grace". Pick a strong database password and save it somewhere safe.
2. When it is ready, open **SQL Editor** → **New query**.
3. Open `supabase-setup.sql`, copy all of it, paste it in, and click **Run**. You should see "Success."
4. Open **Authentication** → **URL Configuration**.
   - **Site URL:** `https://app.sproutedgrace.net`
   - **Redirect URLs:** add `https://app.sproutedgrace.net/**`
5. Open **Project Settings** → **API**. Copy the **Project URL** and the **anon public** key.
6. Open `index.html`. Near the top, find `CONFIG` and paste them in:
   ```js
   SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJ...',
   ```

> Tip: Supabase's free email sender can only send a few emails each hour. Before you invite a lot of people, set up your own email sender under **Authentication** → **Emails** → **SMTP Settings**.

While `SUPABASE_URL` still says `YOUR-PROJECT`, the app runs in **Preview mode**. You can click through every screen, but nothing is saved.

---

## Step 2. Fill in the rest of your settings

In `index.html`, in `CONFIG`:

- `STRIPE_DONATE_URL` – your Stripe payment link (Stripe → Payment Links → New). Leave it `''` to show "Card giving opens soon."
- `BTC_ADDRESS` – your Bitcoin address. The app makes the QR code for you.
- `COPYRIGHT_HOLDER` – the name in the footer. It is set to `Sprouted Grace Ministry`.
- `PARTNER_ON` – leave `false`. Change it to `true` if you want the "Partner" label in the Library. Then you can mark members as partners in **Account → Members**.
- `LIVE_DEFAULT`, `TIKTOK_URL` – the live service line and the TikTok link.

---

## Step 3. Put it on GitHub Pages

1. On github.com, make a new repository, for example `sproutedgrace-app`.
2. Click **Add file → Upload files**. Drag in **everything in this folder** (keep the `bible`, `fonts`, and `tools` folders). Click **Commit changes**.
3. Open **Settings → Pages**.
   - **Source:** Deploy from a branch. **Branch:** `main`, folder `/ (root)`. Click **Save**.
   - **Custom domain:** type `app.sproutedgrace.net` and click **Save**. (The `CNAME` file already says this.)

## Step 4. Point app.sproutedgrace.net at GitHub (DNS)

Where you bought sproutedgrace.net (for example Namecheap), open the DNS settings and add **one** record:

| Type | Host | Value | TTL |
|---|---|---|---|
| `CNAME` | `app` | `YOUR-GITHUB-USERNAME.github.io` | Automatic |

Use your own GitHub username. Do not add the repository name.

It can take a few minutes to a few hours. Then go back to **Settings → Pages** on GitHub and check **Enforce HTTPS**. (If the box is gray, wait a little and try again.)

> Optional but good: in GitHub, open your profile **Settings → Pages → Add a domain** and verify `sproutedgrace.net`. This stops anyone else from using your domain on GitHub.

---

## Step 5. Make yourself admin

1. Open https://app.sproutedgrace.net and make your account. Tap the link in the email.
2. In Supabase, open **SQL Editor → New query**. Paste this, with your email, and click **Run**:
   ```sql
   update public.profiles set is_admin = true
    where id = (select id from auth.users where email = 'admin@sproutedgrace.net');
   ```
3. Reload the app. Your Account page now shows **Admin tools**:
   - **Library manager** – add lessons (PDF, audio, video link, or "Coming soon"), set who can open them, add covers, rename or add rows.
   - **Members** – copy emails, download a CSV, mark who is on your email list, and make someone an admin.
   - **Post a live time** – on the Home page, under "Join us live."
   - **Remove posts** – open any Fellowship post and tap **Remove post**. You can also see who wrote a prayer request with a hidden name.

---

## Changing the logo

The app already uses the official logo (the sprout coming out of the gold box). To change it later:

1. Put the new logo (white or clear background) and a banner photo in this folder.
2. On a computer with Python: `pip install pillow`, then
   `python3 tools/make-icons.py your-logo.png your-photo.jpg`
3. Upload the new `logo.png`, icons, `hero.jpg`, and `og-image.jpg` to GitHub.

## When you change index.html

Open `sw.js` and change `VERSION` (for example `sproutedgrace-v1` → `sproutedgrace-v2`). This tells phones to get the new version.

---

## Where things come from

- **Bible text:** the King James Version and the World English Bible, both in the public domain. Taken from the open-bibles collection (github.com/seven1m/open-bibles), which marks the words of Jesus.
- **Font:** EB Garamond, SIL Open Font License (`fonts/OFL.txt`).
- **QR codes:** qrcode-generator by Kazuhiko Arase, MIT License (notice at the top of `qrcode.js`).
