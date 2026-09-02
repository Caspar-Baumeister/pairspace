#!/usr/bin/env bash
#
# Pairspace one command Firebase setup.
#
#   bash scripts/setup-firebase.sh
#
# Creates or selects a Firebase project, registers the web app, writes
# .env.local, and deploys Firestore rules, indexes, Storage rules and the Cloud
# Functions. Safe to run again: every step checks before it acts.
#
set -euo pipefail

BOLD=$'\033[1m'; DIM=$'\033[2m'; BLUE=$'\033[34m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; OFF=$'\033[0m'
step() { printf "\n%s==>%s %s%s%s\n" "$BLUE" "$OFF" "$BOLD" "$1" "$OFF"; }
info() { printf "    %s%s%s\n" "$DIM" "$1" "$OFF"; }
ok()   { printf "    %s✓%s %s\n" "$GREEN" "$OFF" "$1"; }
warn() { printf "    %s!%s %s\n" "$YELLOW" "$OFF" "$1"; }
die()  { printf "\n%serror%s %s\n" "$RED" "$OFF" "$1" >&2; exit 1; }
ask()  { local p="$1" d="${2:-}" a; if [ -n "$d" ]; then read -r -p "    $p [$d]: " a; echo "${a:-$d}"; else read -r -p "    $p: " a; echo "$a"; fi; }

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# ---------------------------------------------------------------- prerequisites
step "Checking prerequisites"

command -v node >/dev/null || die "Node.js is not installed. Get it from https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node 20 or newer is required, you have $(node -v)"
ok "Node $(node -v)"

if ! command -v firebase >/dev/null; then
  info "Installing the Firebase CLI, this takes a moment"
  npm install -g firebase-tools >/dev/null 2>&1 || die "Could not install firebase-tools. Try: sudo npm install -g firebase-tools"
fi
ok "Firebase CLI $(firebase --version)"

# ------------------------------------------------------------------------ login
step "Signing in to Firebase"

if firebase login:list 2>/dev/null | grep -qi "logged in as"; then
  ok "Already signed in as $(firebase login:list 2>/dev/null | sed -n 's/.*logged in as //p' | head -1)"
else
  info "A browser window opens. Sign in with the Google account that should own Pairspace."
  firebase login
fi

# ---------------------------------------------------------------------- project
step "Choosing the Firebase project"

if [ -f .firebaserc ] && grep -q '"default"' .firebaserc; then
  PROJECT_ID="$(node -p "JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default")"
  ok "Using the project already configured here: $PROJECT_ID"
else
  echo
  firebase projects:list || true
  echo
  info "Type the id of an existing project, or a new id to create one."
  info "A project id is lowercase letters, digits and dashes, for example pairspace-live."
  PROJECT_ID="$(ask "Project id" "pairspace-live")"

  if firebase projects:list 2>/dev/null | grep -q "\b$PROJECT_ID\b"; then
    ok "Found the existing project $PROJECT_ID"
  else
    info "Creating $PROJECT_ID"
    firebase projects:create "$PROJECT_ID" --display-name "Pairspace" \
      || die "Could not create the project. The id may be taken, try another one."
    ok "Created $PROJECT_ID"
  fi
  printf '{\n  "projects": {\n    "default": "%s"\n  }\n}\n' "$PROJECT_ID" > .firebaserc
  ok "Wrote .firebaserc"
fi

export PROJECT_ID

# --------------------------------------------------------------------- web app
step "Registering the web app"

APP_ID="$(firebase apps:list WEB --project "$PROJECT_ID" 2>/dev/null | grep -o '1:[0-9]*:web:[a-z0-9]*' | head -1 || true)"

if [ -z "$APP_ID" ]; then
  info "Creating a web app called Pairspace"
  firebase apps:create WEB "Pairspace" --project "$PROJECT_ID" >/dev/null \
    || die "Could not create the web app"
  APP_ID="$(firebase apps:list WEB --project "$PROJECT_ID" 2>/dev/null | grep -o '1:[0-9]*:web:[a-z0-9]*' | head -1)"
fi
ok "Web app $APP_ID"

# -------------------------------------------------------------------- env.local
step "Writing .env.local"

CONFIG_JSON="$(firebase apps:sdkconfig WEB "$APP_ID" --project "$PROJECT_ID" --json 2>/dev/null)" \
  || die "Could not read the SDK config"

SITE_URL="$(ask "Public site URL for now" "http://localhost:3000")"

node - "$CONFIG_JSON" "$SITE_URL" <<'NODE'
const fs = require("node:fs");
const raw = JSON.parse(process.argv[2]);
const c = raw.result?.sdkConfig ?? raw.sdkConfig ?? raw;
const siteUrl = process.argv[3];

const lines = [
  "# Written by scripts/setup-firebase.sh. Safe to edit by hand.",
  `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
  "",
  `NEXT_PUBLIC_FIREBASE_API_KEY=${c.apiKey}`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${c.authDomain}`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${c.projectId}`,
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${c.storageBucket}`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${c.messagingSenderId}`,
  `NEXT_PUBLIC_FIREBASE_APP_ID=${c.appId}`,
  "",
  "NEXT_PUBLIC_USE_EMULATORS=0",
  "",
];

// Keep anything the developer added by hand that we do not manage.
if (fs.existsSync(".env.local")) {
  const kept = fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && !lines.some((n) => n.split("=")[0] === l.split("=")[0]));
  if (kept.length) lines.push("# Kept from your previous .env.local", ...kept, "");
}

fs.writeFileSync(".env.local", lines.join("\n"));
console.log("    \x1b[32m✓\x1b[0m .env.local written for " + c.projectId);
NODE

# ------------------------------------------------------------------- databases
step "Creating Firestore and Storage"

if firebase firestore:databases:list --project "$PROJECT_ID" 2>/dev/null | grep -q "(default)"; then
  ok "Firestore already exists"
else
  LOCATION="$(ask "Firestore location" "eur3")"
  info "Creating the Firestore database in $LOCATION"
  firebase firestore:databases:create "(default)" --location "$LOCATION" --project "$PROJECT_ID" \
    || warn "Could not create Firestore from the CLI. Create it once in the console, then run this script again."
fi

# ---------------------------------------------------------------------- deploy
step "Deploying rules and indexes"

firebase deploy --only firestore:rules,firestore:indexes --project "$PROJECT_ID" \
  || warn "Firestore deploy failed, see the message above"

firebase deploy --only storage --project "$PROJECT_ID" \
  || warn "Storage deploy failed. Enable Cloud Storage once in the console, then run this script again."

# ------------------------------------------------------------------- functions
step "Cloud Functions"

info "Cloud Functions need the Blaze plan, which is pay as you go with a free tier."
BLAZE="$(ask "Is this project already on Blaze? y or n" "n")"

if [ "$BLAZE" = "y" ]; then
  info "Installing function dependencies"
  ( cd functions && npm install --no-audit --no-fund ) || die "npm install inside functions failed, see the output above"
  ok "Function dependencies installed"

  echo
  info "Emails are sent through Resend. Get a key at https://resend.com, it is free for low volume."
  HAS_KEY="$(ask "Set the Resend API key now? y or n" "y")"
  if [ "$HAS_KEY" = "y" ]; then
    firebase functions:secrets:set RESEND_API_KEY --project "$PROJECT_ID" || warn "Could not store the secret"
  fi

  MAIL_FROM="$(ask "From address for outgoing mail" "Pairspace <onboarding@resend.dev>")"
  SITE="$(ask "Public site URL for the links inside those mails" "https://joinpairspace.com")"

  # firebase-functions v2 reads functions/.env at deploy time. Secrets stay in
  # Secret Manager, only these two plain values live here.
  cat > functions/.env <<ENVFILE
SITE_URL=$SITE
MAIL_FROM=$MAIL_FROM
ENVFILE
  ok "Wrote functions/.env"

  firebase deploy --only functions --project "$PROJECT_ID" \
    || warn "Function deploy failed, see the message above"
else
  warn "Skipping functions. Upgrade at https://console.firebase.google.com/project/$PROJECT_ID/usage/details and run this script again."
fi

# ----------------------------------------------------------------------- done
step "Done"

cat <<EOF

    Project:   $PROJECT_ID
    Console:   https://console.firebase.google.com/project/$PROJECT_ID

    ${BOLD}Three things still need a click in the console${OFF}

    1. Authentication, Sign in method: enable ${BOLD}Google${OFF}, ${BOLD}Apple${OFF} and ${BOLD}Anonymous${OFF}
       https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers

    2. Authentication, Settings, Authorized domains: add your live domain

    3. Cloud Storage: if the storage deploy above failed, click through the
       one time setup, then run this script again
       https://console.firebase.google.com/project/$PROJECT_ID/storage

    Then start the app:

       npm run dev

EOF
