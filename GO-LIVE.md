# Go live

Project `pairspace-live`. Work through this top to bottom. Anything marked
**you** needs your browser or your card, the rest is a command.

---

## 1. Cloud Functions, before anything else

Nothing else matters if the emails do not work. Right now `functions/node_modules`
is empty, so no function is deployed and the whole notification half of the
product is silent.

**you** Upgrade to Blaze:
https://console.firebase.google.com/project/pairspace-live/usage/details
Modify plan, Blaze, add a card, then set a budget alert at 5 EUR.

**you** Get a Resend API key at https://resend.com. Free up to 3,000 mails a
month. Start with their `onboarding@resend.dev` sender, switch to your own
domain once you have it.

Then:

```bash
cd ~/Code/pairspace
bash scripts/setup-firebase.sh     # answer y at the Blaze question this time
```

Check it worked:

```bash
firebase functions:list --project pairspace-live
```

You should see `onParticipantJoined`, `onConnectionCreated`, `onConnectionAnswered`,
`onParticipantChanged`, `onParticipantRemoved`, `onWatcherAdded` and
`cleanupExpiredEvents`.

---

## 2. Smoke test on localhost

```bash
npm run dev
```

1. Create an event, sign in with Google at the end, copy the link
2. Open the link in a private window, join as a participant with a real address
3. Open it in a second private window, join as a second participant of the
   matching category, press Connect
4. The first participant accepts, both should receive an email with the other
   address

If step 4 stays silent, check the function logs:

```bash
firebase functions:log --project pairspace-live --only onConnectionAnswered
```

---

## 3. Git and GitHub

Two lock files from an interrupted commit are still in `.git`. Clear them, then
push.

```bash
cd ~/Code/pairspace
rm -f .git/index.lock .git/HEAD.lock
git add -A
git commit -m "Pairspace ready for launch"
gh repo create pairspace --private --source=. --push
```

---

## 4. Domain, done

**joinpairspace.com** is registered on Vercel under the team "Caspar Baumeister",
11.25 USD a year with auto renew on and WHOIS privacy included. Vercel is only
the registrar and the DNS host, the site itself runs on Firebase App Hosting.

DNS lives at Vercel: https://vercel.com/caspar-baumeister-team/~/domains
Use "Manage DNS records" there for everything in step 6. Do not connect the
domain to a Vercel project, that would point it at Vercel instead of Firebase.

## 5. App Hosting

In the Firebase console, App Hosting, Get started:

1. Connect the GitHub repo, branch `main`, root directory `/`
2. `apphosting.yaml` already carries the real project values
3. Before the first build, set line 10 of `apphosting.yaml` to your domain:

```yaml
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://yourdomain
```

Commit and push, the build starts on its own. Every push to `main` deploys.

---

## 6. Domain and the last wiring

1. App Hosting, your backend, Custom domain, add `joinpairspace.com` and also
   `www.joinpairspace.com`, then copy the DNS records it shows
2. Enter those records at your registrar, the certificate is issued automatically,
   usually within an hour
3. **Authentication, Settings, Authorized domains: add `joinpairspace.com`.**
   Without this, Google and Apple sign in fail on the live site with a redirect
   error while they keep working on localhost, which is a confusing way to lose
   an afternoon
   https://console.firebase.google.com/project/pairspace-live/authentication/settings
4. Apple Developer, your Services ID: add `joinpairspace.com` to Domains and
   `https://joinpairspace.com/__/auth/handler` to Return URLs. Keep the
   firebaseapp.com entry as well, both are used
5. **Resend: verify `joinpairspace.com` as a sending domain. This is not
   optional.** With the test sender `onboarding@resend.dev` Resend only
   delivers to the address of the Resend account itself and answers every
   other recipient with a 403. That is why participant mail was silent.
   Steps:
   1. https://resend.com/domains, Add domain, `joinpairspace.com`, region EU
   2. Copy the DNS records it shows (one TXT for SPF, one TXT for DKIM, one
      MX for bounces) into Vercel DNS at
      https://vercel.com/caspar-baumeister-team/~/domains
   3. Wait for the green "Verified" in Resend, usually a few minutes
   4. Set the sender and redeploy:

      ```bash
      printf 'SITE_URL=https://joinpairspace.com\nMAIL_FROM=Pairspace <hello@joinpairspace.com>\n' > functions/.env
      firebase deploy --only functions --project pairspace-live
      ```

   A failed send now shows up as `[mail failed]` in the function logs, a
   successful one as `[mail sent]`:

   ```bash
   firebase functions:log --project pairspace-live
   ```

---

## 7. Before you share the link with anyone

- [ ] Landing page loads on the domain, no console errors
- [ ] Google sign in works on the live domain, not only localhost
- [ ] Apple sign in works on the live domain
- [ ] Creating an event gives a link on your domain, not localhost
- [ ] A participant can join from a phone, on mobile data, without an account
- [ ] The connect email arrives, from your address, and the link in it works
- [ ] Notify me instead sends its email when a matching participant joins
- [ ] `/privacy` and `/terms` read by a lawyer, they are drafts
- [ ] A budget alert exists in Google Cloud billing
