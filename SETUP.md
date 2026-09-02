# Pairspace setup

Everything in one place. The parts marked **you** need a browser and your own
accounts. Everything else is a single script.

Total hands on time is about 25 minutes, most of it waiting for builds.

---

## 0. Clean install, once

```bash
cd ~/Code/pairspace
rm -rf node_modules
npm install
```

---

## 1. Firebase, the script does almost all of it

```bash
bash scripts/setup-firebase.sh
```

The script signs you in, creates the project, registers the web app, writes
`.env.local` with your keys, creates Firestore, and deploys the security rules,
the indexes and the Cloud Functions. It is safe to run again at any point, and
it skips whatever already exists.

It stops and asks you for exactly four things:

| Question | What to answer |
| --- | --- |
| Project id | `pairspace-live`, or any free id |
| Public site URL | `http://localhost:3000` for now, your domain later |
| Firestore location | `eur3` keeps the data in Europe |
| Blaze plan yes or no | see the next step |

### **you** Upgrade to Blaze before the functions step

Cloud Functions do not exist on the free Spark plan, so the project needs the
Blaze plan. Blaze is pay as you go on top of a free monthly allowance, not a
subscription: 50,000 Firestore reads and 20,000 writes per day, 2 million
function calls, 5 GB storage and 50,000 monthly active auth users are free every
month. At Pairspace's early volume the bill is zero, and a card is on file for
the day it is not.

1. Open the [usage and billing page](https://console.firebase.google.com/) for
   your project, Settings, Usage and billing, Details and settings
2. Modify plan, pick Blaze, add a card
3. Set a **budget alert** at 5 EUR so you hear about it before anything grows
4. Run `bash scripts/setup-firebase.sh` again and answer `y` this time

### **you** Three console clicks

1. Authentication, Sign in method: enable **Google**, **Apple** and **Anonymous**.
   Anonymous is what lets a participant edit their own profile without a password.
2. Authentication, Settings, Authorized domains: add your live domain once you have it
3. Cloud Storage: click through the one time setup if the script reported it was missing

---

## 2. **you** Apple Sign In

You have an Apple Developer account already, so this is only configuration.

In the [Apple Developer portal](https://developer.apple.com/account/resources):

1. **Identifiers, App IDs**: create or pick an App ID, enable the capability
   *Sign in with Apple*
2. **Identifiers, Services IDs**: create one, for example `app.pairspace.web`.
   This string is the **Service ID** Firebase asks for.
   Configure it, enable *Sign in with Apple*, then set
   * Domains: `<your-project>.firebaseapp.com` and later your own domain
   * Return URLs: `https://<your-project>.firebaseapp.com/__/auth/handler`
3. **Keys**: create a key, enable *Sign in with Apple*, download the `.p8` file.
   Note the **Key ID** and your **Team ID** from the top right of the portal.
4. In Firebase, Authentication, Sign in method, Apple: paste the Service ID, the
   Apple Team ID, the Key ID and the contents of the `.p8` file.

Apple only hands out the `.p8` once. Keep it somewhere safe and out of git.

---

## 3. Email delivery

Notification emails go through [Resend](https://resend.com). The free tier covers
3,000 mails a month, which is a lot of events.

1. Create the account, verify your sending domain, or start with their test
   sender `onboarding@resend.dev`
2. Create an API key
3. The setup script asks for it and stores it as a Firebase secret, so it never
   lands in the repository

Without a key the functions still run, they just log the mail instead of sending
it. That is fine for local development.

---

## 4. Deploy to Firebase App Hosting

App Hosting builds from a GitHub repository, so the code goes to GitHub first.

```bash
# once, if the repo is not on GitHub yet
gh repo create pairspace --private --source=. --push
```

Then in the Firebase console, App Hosting, Get started:

1. Connect the GitHub repository, pick the `main` branch
2. Root directory `/`, the `apphosting.yaml` in the repo is picked up automatically
3. Before the first build, open apphosting.yaml and replace the placeholder
   values with your real project id and domain, or set them as secrets with
   `firebase apphosting:secrets:set`

Every push to `main` deploys from then on. There is no monthly fee, only the
usual pay as you go usage.

---

## 5. Your domain

Buy it wherever you like. Once it exists:

1. Firebase console, App Hosting, your backend, Custom domain, add it and copy
   the DNS records it shows you
2. Put those records in at your registrar, certificates are issued automatically
3. Set `NEXT_PUBLIC_SITE_URL` to `https://yourdomain` in `apphosting.yaml`
4. Add the domain under Authentication, Settings, Authorized domains, otherwise
   Google and Apple sign in are refused on the live site
5. Update the Apple Services ID with the new domain and return URL

---

## What it costs

| | Cost |
| --- | --- |
| Firebase Blaze | No base fee. Free every month: 50K Firestore reads and 20K writes per day, 2M function calls, 5 GB storage, 50K monthly active auth users. |
| Firebase App Hosting | Pay as you go on the same bill, no separate subscription |
| Resend | Free up to 3,000 emails a month |
| Apple Developer | 99 USD a year, which you already pay |
| Domain | 10 to 40 EUR a year depending on the ending |

One billing account covers as many Firebase projects as you want. A second or
third project does not add a base fee, it just draws from the same free
allowances and then bills usage.

---

## Checklist

- [ ] `npm install` runs clean
- [ ] `bash scripts/setup-firebase.sh` finished without warnings
- [ ] Blaze active, budget alert set
- [ ] Google, Apple and Anonymous sign in enabled
- [ ] `npm run dev`, create an event, get a link
- [ ] Open the link in a private window, join as a participant, see yourself in the dashboard
- [ ] Resend key set, a join triggers a real email
- [ ] Repository on GitHub, App Hosting backend building
- [ ] Domain pointing at the backend and in the authorized domains list
