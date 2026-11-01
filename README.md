# Pairspace

**Flatmate matching for furnished shared flats.** A landlord creates a flat with its rooms, shares one link in the listing, and every applicant rates the other applicants (no way, bad, okay, good, absolutely) and ranks the rooms. The landlord sees an Obsidian style graph of who wants to live with whom, and the best group for the free rooms including who gets which room.

Status and decisions: [BERICHT.md](./BERICHT.md). The math: [docs/MATCHING.md](./docs/MATCHING.md).

## Stack

* Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
* Design tokens copied from Obsidian's default dark theme in `src/app/globals.css`, Lucide icons
* Graph: d3-force simulation drawn on canvas, `src/components/graph/ApplicantGraph.tsx`
* Firebase: Auth (Google and mail for landlords, anonymous for applicants), Firestore, Storage
* Deploys to Firebase App Hosting (`apphosting.yaml`)

## Run it locally

Everything runs against the Firebase emulators, never against the live project.

```bash
npm install
npm run emulators      # terminal 1: auth 9099, firestore 8080, storage 9199, ui 4000
npm run seed           # terminal 2: demo landlord, one flat, 14 applicants
npm run dev            # http://localhost:3000
```

The seed prints the demo login. The applicant link is `/w/demo2wg8`. Open it in a private window, otherwise you are the landlord.

`.env.local` needs `NEXT_PUBLIC_USE_EMULATORS=1` plus the three `*_EMULATOR_HOST` lines for this. The emulators need Java 21, the script takes it from Homebrew's `openjdk@21`.

## Checks

```bash
npm run typecheck
npm run test:matching   # matching math against brute force
npm run test:rules      # firestore.rules, needs emulators and seed
npm run check:copy      # no dashes in user facing copy
```
