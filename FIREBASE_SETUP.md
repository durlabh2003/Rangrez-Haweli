# Firebase setup — new project for Rangrez Haveli (user storefront)

Step-by-step setup of a **brand-new Firebase project** for this app, locally and on Vercel.
Commands are for **Windows PowerShell**, run from the repo root. Takes about 20–30 minutes.

## 0. What Firebase is used for

| Part | Firebase product | Needs a secret? | Configured by |
|---|---|---|---|
| Browser sign-in (Google) and each patron's profile (`users/{uid}`) | Authentication + Firestore (client SDK) | No — public web config | `firebase-applet-config.json` |
| Server data: products, orders, reviews, coupons, leads, B2B quotes, config… | Firestore (Admin SDK) | **Yes — service account** | `.env` / Vercel env vars |
| Server checks of signed-in users (`verifyIdToken`) | Authentication (Admin SDK) | No | `firebase-applet-config.json` |
| Bot protection (optional) | App Check (reCAPTCHA v3) | No — public site key | `VITE_FIREBASE_APP_CHECK_KEY` |

**`firebase-applet-config.json` is the single switch:** both the browser and the server read the project ID
and database ID from it. Pointing it at the new project moves the whole app.

---

## 1. Create the project

1. Go to <https://console.firebase.google.com> → **Create a project**.
2. Name it, e.g. `rangrez-haveli` (Firebase may append a suffix — note the final **Project ID**).
3. **Google Analytics:** turn it **off** (the app doesn't use it). → **Create project**.

The free **Spark** plan is enough to start (Firestore: 50k reads / 20k writes per day). Upgrade to
**Blaze** (pay-as-you-go) before launch so traffic spikes don't hit the daily cap.

## 2. Register the web app and update the config file

1. Project overview → click the **Web** icon `</>` → nickname `storefront` → **Register app**
   (leave Firebase Hosting unticked — Vercel hosts the site).
2. Firebase shows a `firebaseConfig` object. Copy its values into **`firebase-applet-config.json`**,
   replacing the whole file:

   ```json
   {
     "projectId": "YOUR_PROJECT_ID",
     "appId": "YOUR_APP_ID",
     "apiKey": "YOUR_WEB_API_KEY",
     "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "YOUR_PROJECT_ID.firebasestorage.app",
     "messagingSenderId": "YOUR_SENDER_ID",
     "measurementId": "",
     "oAuthClientId": "",
     "recaptchaSiteKey": ""
   }
   ```

   - `firestoreDatabaseId` stays **`(default)`** — you'll create the default database in step 3.
   - `apiKey` here is a public web key (it ships to every browser); committing it is fine.
     The *service account* in step 6 is the secret one.
   - `oAuthClientId` and `recaptchaSiteKey` aren't needed; leave them empty.

## 3. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. Database ID: keep **`(default)`**.
3. Location: pick one near your customers, e.g. **`asia-south1` (Mumbai)**. *This can't be changed later.*
4. Start in **production mode** → **Create**. (Step 5 replaces the default rules with the app's rules.)

## 4. Authentication (Google sign-in)

1. **Build → Authentication → Get started → Sign-in method** → enable **Google**,
   choose a support email → **Save**.
2. **Authentication → Settings → Authorized domains** → add every domain the site runs on:
   - `localhost` (already there)
   - your Vercel domain, e.g. `rangrez-haweli.vercel.app`
   - any custom domain you add later

   A missing domain causes `auth/unauthorized-domain` when signing in.

## 5. Deploy the security rules

`firestore.rules` lets each patron read/write only their own profile and blocks clients from everything
else (the server bypasses rules through the Admin SDK).

1. **Admin email in the rules:** open `firestore.rules` and check the email inside `isTokenAdmin()`.
   Change it if the admin will be a different Google account.
2. Create `firebase.json` in the repo root:

   ```json
   {
     "firestore": {
       "rules": "firestore.rules"
     }
   }
   ```

3. Log in and deploy (replace `YOUR_PROJECT_ID`):

   ```powershell
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

4. Check: Firestore → **Rules** tab shows the app's rules.

## 6. Service account for the server

1. ⚙ **Project settings → Service accounts → Generate new private key** → **Generate key**.
   A `.json` file downloads. **It's a password for your database:** never commit it, never share it.
2. Move it **outside the repo**, e.g. `D:\secrets\rangrez-sa.json`.

### Local — `.env` in the repo root

```
GOOGLE_APPLICATION_CREDENTIALS="D:\secrets\rangrez-sa.json"
ADMIN_EMAILS="your-admin@gmail.com"
```

### Vercel

Vercel can't read a file on your PC, so it gets the JSON itself as **one line**. This copies it to the clipboard:

```powershell
Get-Content D:\secrets\rangrez-sa.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 10 | Set-Clipboard
```

Vercel → project → **Settings → Environment Variables** → add `FIREBASE_SERVICE_ACCOUNT_JSON` = *(paste)*
for **Production** (and Preview if wanted). Full list in step 10.

## 7. Upload the data

```powershell
npm install
npm run seed:firestore
```

Use `seed:firestore`, **not** `npm run seed -- --firestore` — Windows PowerShell drops the `--`, so the
flag never reaches the script.

**Success** — the last lines look like this (counts will differ):

```
Firestore sync: { synced: true, collectionsWritten: 560, note: 'Firestore synced: 560 written, 0 deleted.' }
```

Firestore now shows `products`, `reviews`, `orders`, `coupons`, `quotes`, `config`, `_meta` and more.

From here on:

- Every save (order, lead, review, admin edit) writes the changed documents straight to Firestore.
- `npm run dev` loads its data from Firestore too (set `STORE_BACKEND=file` in `.env` to work offline).

> **The seed catalog is demo data and is hidden in production.** Seeded records are marked `isMock`, and with
> `NODE_ENV=production` (always on Vercel) they are not shown — the live shop stays empty until real
> products are added through the Admin Console. To remove demo data from Firestore later:
> `npx tsx src/server/seedCli.ts --purge --firestore`

## 8. Admin access

Both layers check a **verified Google email**:

1. **Server API:** `ADMIN_EMAILS` (comma-separated) in `.env` and on Vercel.
2. **Firestore rules:** the email in `isTokenAdmin()` (step 5), or an `admins/{uid}` document — create it in
   the console: collection `admins`, document ID = the user's UID (Authentication → Users), any field.

## 9. App Check (optional, recommended before launch)

1. **Build → App Check** → register the web app with **reCAPTCHA v3**. Create the site key at
   <https://www.google.com/recaptcha/admin> with your domains (including `localhost` for testing).
2. Set the **site key** (public) as `VITE_FIREBASE_APP_CHECK_KEY` in `.env` and on Vercel.
   It's baked in at build time, so redeploy after setting it.
3. Watch App Check metrics for a few days, then click **Enforce** for Firestore and Authentication.
   Enforcing before the key is live locks real users out.

## 10. Vercel environment variables

| Variable | Value | Required |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | one-line service account JSON (step 6) | **Yes** |
| `ADMIN_EMAILS` | admin Google email(s) | **Yes** |
| `VITE_FIREBASE_APP_CHECK_KEY` | reCAPTCHA v3 site key | Optional |
| `STORE_SYNC_INTERVAL_MS` | e.g. `2000` | Optional |
| `GEMINI_API_KEY`, Razorpay, SMS, email keys… | see `.env.example` | As needed |

Don't set `GOOGLE_APPLICATION_CREDENTIALS` on Vercel (it's a file path on your PC).

## 11. Ship it

```powershell
git add firebase-applet-config.json firebase.json firestore.rules
git commit -m "Point app at new Firebase project"
git push origin user
```

Vercel redeploys from the push. If you only changed env vars, use **Deployments → ⋯ → Redeploy**.

## 12. Verify

- **Locally:** `npm run seed:firestore` ends with `synced: true`; `npm run dev` → sign in with Google works.
- **Firestore:** a `users/{uid}` document appears after your first sign-in; `_meta/version` changes after a
  test order or lead.
- **Live site:** sign in as admin → Admin Console → *Launch readiness* reports Firestore connected.
- **Persistence:** add something in admin, redeploy on Vercel, confirm it's still there.

## 13. Leaving the old AI Studio project

- The old project (`gen-lang-client-0813412107`) never held server data — the server was never connected —
  so there's nothing to migrate. Patron profiles there aren't carried over; users just sign in again.
- `src/server/db.ts` still has the old IDs as **fallbacks**, used only if `firebase-applet-config.json` is
  missing. They're harmless, but can be replaced with the new IDs.
- Once the new project works, you can delete the old one (Project settings → General → Delete project) or
  leave it.

## 14. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `'tsx' is not recognized` | Packages not installed in the repo root → `npm install`. |
| `npm warn Unknown cli config "--firestore"` | PowerShell dropped `--` → use `npm run seed:firestore`. |
| `synced: false … no credentials configured` | `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT_JSON` empty, or `.env` isn't in the repo root. |
| `Could not load the default credentials` | Credentials path is wrong or the file moved. |
| `NOT_FOUND` / `The database (default) does not exist` | Step 3 not done, or `firestoreDatabaseId` doesn't match the console. |
| `PERMISSION_DENIED` from the server | Service account is from a different project than `projectId` → generate a key in the new project. |
| `auth/unauthorized-domain` | Add the domain under Authentication → Settings → Authorized domains. |
| `auth/configuration-not-found` | Google sign-in not enabled (step 4). |
| API returns `503 Store temporarily unavailable` | Firestore unreachable at startup (credentials or network); retried on the next request. Vercel logs show `[store] Firestore unavailable: …`. |
| `RESOURCE_EXHAUSTED` / quota exceeded | Spark daily limits hit → upgrade to Blaze. |
| Shop is empty on Vercel | Expected until real (non-mock) products are added — see step 7. |
