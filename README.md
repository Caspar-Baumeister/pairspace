# Pairspace

**Participant Matching for Events.** An organizer creates an event, defines the participant
categories that matter there, and shares one link. Participants open that link in a browser,
introduce themselves, and find someone to pair up with. No app, no permanent account.

Not dating. Not a social network. Not event management software.

## Stack

* Next.js 16, App Router, TypeScript
* Tailwind CSS v4 with a token layer in `src/app/globals.css`
* Self hosted Inter and Inter Tight through `@fontsource-variable` so no request leaves the page
* Firebase: Auth (Google and Apple for organizers, anonymous for participants), Firestore,
  Cloud Functions for email, Scheduler for data retention
* Deploys to Firebase App Hosting (`apphosting.yaml`) or Vercel (`vercel.json`)

> **Setting this up for the first time?** Follow [SETUP.md](./SETUP.md). It is one
> script plus a handful of console clicks.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in the Firebase web keys
npm run dev
```

If `npm install` complains about existing files, remove `node_modules` first and install again.

### Local Firebase

```bash
cp .firebaserc.example .firebaserc  # put in your project id
npm run emulators                   # auth 9099, firestore 8080, functions 5001, ui 4000
npm run seed                        # one demo event with five participants
```

Set `NEXT_PUBLIC_USE_EMULATORS=1` in `.env.local` to point the app at the emulators.

## What still needs your Firebase project

1. Create the project, add a Web app, and paste the six `NEXT_PUBLIC_FIREBASE_*` keys.
2. Authentication, Sign in method: enable **Google** and **Apple**, and enable **Anonymous**
   (participants use an anonymous session so they can edit their own profile without a password).
3. Add your domain under Authentication, Settings, Authorized domains.
4. Firestore: create the database, then `firebase deploy --only firestore:rules,firestore:indexes`.
5. Storage: enable Cloud Storage, then `firebase deploy --only storage` for `storage.rules`.
6. Functions: `cd functions && npm install`, then
   `firebase functions:secrets:set RESEND_API_KEY` and `firebase deploy --only functions`.
   Set `MAIL_FROM` and `SITE_URL` as function environment values.
7. Apple sign in additionally needs a Services ID, a key and the return URL in the Apple developer
   console. Google works out of the box.

## Avatars

Every participant gets a portrait, never an initial. `npm run avatars` pre renders a pool of
48 illustrated faces plus the 8 named faces used on the landing page into `public/avatars`
(Open Peeps by Pablo Stanley, CC0, rendered through DiceBear). The app picks one from the pool
by hashing the participant id, so a person keeps the same face for the whole event and the
avatar library never ships in the JavaScript bundle.

Organizers can additionally allow, or require, real photos per event. Photos are cropped square
and shrunk to 640 pixels in the browser before upload, stored as WebP under
`events/{eventId}/participants/{uid}.webp`, and deleted with the rest of the event data.

## Forms never lose input

Every form autosaves to local storage while it is being filled in: the event wizard including the
current step, the participant profile, and the notify me form. Reloading restores everything and
the participant sees a small note that their draft came back. Storage is cleared on a successful
submit. The hook is `src/lib/hooks/usePersistentState.ts`.

## Data model

```
events/{eventId}                       public read, owner write
  participants/{participantId}         first name, categories, answers, photo, hidden email
  watchers/{watcherId}                 email only, never readable from the client
  connections/{connectionId}           a contact exchange between two participants
slugs/{slug}                           public slug to eventId lookup
users/{uid}                            organizer record
```

Email addresses leave the database in exactly one place: `onConnectionAnswered` in
`functions/src/index.ts`, after both people accepted.

## Routes

| Route | Who | What |
| --- | --- | --- |
| `/` | everyone | Landing page, indexed |
| `/create` | organizer | Four step event setup, sign in at the end |
| `/signin` | organizer | Google and Apple only |
| `/dashboard` | organizer | Events, upcoming and history |
| `/dashboard/[eventId]` | organizer | Live stats, participants, waiting list |
| `/e/[slug]` | participant | Join, browse matches, connect, or notify me instead |
| `/privacy`, `/terms` | everyone | Legal drafts, review before launch |

Everything except the landing page and the legal pages is `noindex`.

## Design

`design/DESIGN_SYSTEM.md` holds the palette, type scale, spacing, radius, elevation and motion
rules derived from the reference. `design/SEO.md` holds the keyword clusters, metadata and the on
page checklist. Both are the source of truth. Change them before changing components.

## Conventions

* No visible copy contains a hyphen character. Run `npm run check:copy`.
* No three column icon feature grids. Sections alternate editorial text and one realistic
  interface preview.
* Blue is a second voice, never a background wash. Primary buttons are near black.
