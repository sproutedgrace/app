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
| `bible/kjv/`, `gnv/`, `bsb/` | The three Bible versions in the app (KJV, Geneva 1599, Berean Standard). Other versions open on BibleGateway. One file per book (1 = Genesis, 66 = Revelation). The words of Jesus are inside `{ }` so the app can show them in red. |
| `bible/study/` | Word study: Hebrew and Greek word by word (1–66), Strong's dictionary (`lex-H`, `lex-G`), and the concordance (`conc-H`, `conc-G`). |
| `bible/extra/` | 1 Enoch (67), 1 Maccabees (68), 2 Maccabees (69). |
| `guide/redletters.json` | The Red Letters guide: a context note for every chapter where Jesus speaks, plus notes on easy-to-misread verses. (`.txt` files are the same notes, easy to edit.) |
| `seeds/seeds.js` | The Seven Seeds screens. The guide's words live in Supabase, so only people who own it can read them. |
| `supabase-update-covenant-seeds.sql` | Run once: Covenant Membership, the Covenant Circle room, and The Seven Seeds. |
| `games/` | The Fun Room: `games.js` (all nine games) and `words.txt` (the word list for Word Builder). |
| `supabase-update-fun-room.sql` | Run once in Supabase to turn on online game tables. |
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

## Covenant Members and The Seven Seeds

- **Covenant Members:** people apply in the app (Account → Covenant Membership). You approve them in Account → Admin tools → Applications. Edit the Member Covenant and your Statement of Faith link in `CONFIG` (`COVENANT`, `STATEMENT_URL`).
- **The Seven Seeds:** put your Stripe link in `SEEDS_STRIPE_URL` (and the price in `SEEDS_PRICE`). In Stripe, set the payment link's "after payment" page to `https://app.sproutedgrace.net/#/seeds?paid`. When someone buys, make a code in Admin tools → Seven Seeds codes and email it to them. Or check "Seven Seeds" next to their name in Members.

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

- **Bible text:** all public domain. KJV and WEB come from the open-bibles collection (github.com/seven1m/open-bibles), which marks the words of Jesus. BSB, Bible in Basic English, Geneva 1599, Young's Literal, and Darby come from eBible.org (github.com/BibleNLP/ebible). Their red letters were matched from the KJV verse by verse, so a few verses where Jesus speaks partway through stay black.
- **Other books:** 1 Enoch is the R. H. Charles translation (1917), from github.com/scrollmapper/bible_databases_deuterocanonical. 1 and 2 Maccabees are the KJV Apocrypha text from eBible.org.
- **Word study:** Hebrew and Greek word data from STEPBible.org (TAHOT and TAGNT, CC BY 4.0 — free to use with credit). Strong's dictionary by James Strong (1890, public domain), Open Scriptures edition (CC BY-SA). The app shows this credit on every study page.
- **Fun Room:** all games, names, boards, card text, and art are original to this app. The Word Builder word list is ENABLE (public domain), with crude words removed.
- **Font:** EB Garamond, SIL Open Font License (`fonts/OFL.txt`).
- **QR codes:** qrcode-generator by Kazuhiko Arase, MIT License (notice at the top of `qrcode.js`).

## Daily Walk (added Nov 23, 2026)
A daily devotional checklist at `#/walk`, with a card at the top of Home.
- **Morning:** 1) Read today's Red Letters chapters (buttons open the Bible reader, with a "Back to Daily Walk" button) and write one line that stood out. 2) Pray: thanks, needs, who I'm praying for. 3) Be still: a timer (15 min by default) with a soft chime at the start and end. 4) Journal: gratitude, what is true about me, today's win.
- **Evening:** 5) A Psalm or Proverb, give thanks, pray for rest.
- **Extras:** a streak counter, a daily calendar reminder (.ics), and a Saturday LIVE card.
- **Reading plan:** follows the 13-week Red Letters sermon series (Mark first, then Matthew, Luke, John, Acts, the letters, and Revelation). Week 1 starts Monday, Nov 23, 2026. Mon–Fri are reading days, Saturday is the LIVE passage, and Sunday is a rest/catch-up day. The plan lives at the top of `walk/walk.js`. To start a new round later, add `WALK_START:'YYYY-MM-DD'` (a Monday) to CONFIG.
- **Sermon notes:** when signed in as admin, open the Daily Walk, open "Admin: sermon notes link" on the LIVE card, paste the link, and tap Save.
- **Data:** each member's day is saved in `walk_days` (only they can read it). Run `supabase-update-daily-walk.sql` once.

## Weekly Garden, card games link, Library tidy-up (Nov 25, 2026)
- **The Weekly Garden** (`#/walk/garden`): a Sunday check-in. Slide 8 parts of life from 1 to 10 and watch your flower grow. Look back with God, then pick one bed to water with one small step. Next week it asks "Did you do it?". Saved with your Daily Walk (no new database table). Shows big on Sundays in Daily Walk, small on other days.
- **Card games:** the Fun Room links to the sister site's card games. Change `CARDS_URL` in CONFIG (empty = hidden).
- **Library:** "Teachings" is now "Sermon Notes" and the "Coming Soon" row is gone (run `supabase-update-library.sql` once). Admin can now remove any empty row with the Remove button.
