"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { CategoryEditor } from "@/components/app/CategoryEditor";
import { Notice } from "@/components/app/Notice";
import { QuestionEditor } from "@/components/app/QuestionEditor";
import { ShareLink } from "@/components/app/ShareLink";
import { SignInButtons } from "@/components/app/SignInButtons";
import { Stepper } from "@/components/app/Stepper";
import { useAuth } from "@/lib/firebase/auth";
import { createEvent } from "@/lib/firebase/db";
import { clearDraft, emptyDraft, loadDraft, rememberEvent, saveDraft } from "@/lib/draft";
import { CATEGORY_PRESETS } from "@/lib/presets";
import type { EventDraft } from "@/lib/types";

const STEPS = ["Event", "Categories", "Questions", "Share"];

export function CreateWizard() {
  const router = useRouter();
  const { user, isAnonymous, loading, configured } = useAuth();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const signedIn = Boolean(user) && !isAnonymous;

  function patch(next: Partial<EventDraft>) {
    setDraft((d) => ({ ...d, ...next }));
  }

  function applyPreset(id: string) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    patch({
      categories: preset.categories.map((c) => ({ ...c })),
      questions: preset.questions.map((q) => ({ ...q })),
    });
  }

  const canContinue = useMemo(() => {
    if (step === 0) return draft.name.trim().length >= 3;
    if (step === 1) return draft.categories.length >= 1;
    return true;
  }, [step, draft]);

  async function publish() {
    if (!user || isAnonymous) return;
    setCreating(true);
    setError(null);
    try {
      const event = await createEvent(draft, user.uid);
      rememberEvent(event.slug);
      clearDraft();
      setCreatedSlug(event.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the event");
    } finally {
      setCreating(false);
    }
  }

  // Publish automatically once the organizer signs in on the last step.
  useEffect(() => {
    if (step === 3 && signedIn && !createdSlug && !creating && draft.name) {
      void publish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, signedIn]);

  return (
    <AppShell
      right={
        signedIn ? (
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            My events
          </Link>
        ) : (
          <Link href="/" className="btn btn-ghost btn-sm">
            Back to home
          </Link>
        )
      }
    >
      <Stepper steps={STEPS} current={step} />

      <div className="mt-10">
        {step === 0 ? (
          <section className="space-y-6">
            <header>
              <p className="eyebrow">Step one</p>
              <h1 className="display-m mt-3">Tell us about your event</h1>
              <p className="mt-3 text-[0.9375rem] text-ink-muted">
                Only the name is required. Everything else can change later.
              </p>
            </header>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Event name
                </label>
                <input
                  id="name"
                  className="field"
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Acro Weekend Berlin"
                  autoFocus
                />
              </div>

              <div>
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  className="field"
                  value={draft.location}
                  onChange={(e) => patch({ location: e.target.value })}
                  placeholder="Berlin, Germany"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="start">
                    Starts
                  </label>
                  <input
                    id="start"
                    type="date"
                    className="field"
                    value={draft.startDate}
                    onChange={(e) => patch({ startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="end">
                    Ends
                  </label>
                  <input
                    id="end"
                    type="date"
                    className="field"
                    value={draft.endDate}
                    onChange={(e) => patch({ endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="description">
                  What should participants know
                </label>
                <textarea
                  id="description"
                  className="field"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Two days of acro jams, workshops and open practice. Find someone to train with before you arrive."
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-6">
            <header>
              <p className="eyebrow">Step two</p>
              <h1 className="display-m mt-3">Define participant categories</h1>
              <p className="mt-3 text-[0.9375rem] text-ink-muted">
                Start from a preset or build your own. Say which categories pair with which.
              </p>
            </header>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="chip"
                  data-active={presetId === p.id}
                  onClick={() => applyPreset(p.id)}
                  title={p.blurb}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <CategoryEditor
              categories={draft.categories}
              onChange={(categories) => patch({ categories })}
            />
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-6">
            <header>
              <p className="eyebrow">Step three</p>
              <h1 className="display-m mt-3">Ask what matters at your event</h1>
              <p className="mt-3 text-[0.9375rem] text-ink-muted">
                Questions marked for matching move suitable people to the top of the list.
              </p>
            </header>

            <QuestionEditor
              questions={draft.questions}
              onChange={(questions) => patch({ questions })}
            />

            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[0.9375rem] font-medium text-ink">Privacy settings</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[0.8125rem] text-ink-muted">Who can see participant profiles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="chip"
                      data-active={draft.visibility === "participants"}
                      onClick={() => patch({ visibility: "participants" })}
                    >
                      Other participants
                    </button>
                    <button
                      type="button"
                      className="chip"
                      data-active={draft.visibility === "organizerOnly"}
                      onClick={() => patch({ visibility: "organizerOnly" })}
                    >
                      Only me
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[0.8125rem] text-ink-muted">
                    Delete participant data after the event
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="chip"
                        data-active={draft.retentionDays === d}
                        onClick={() => patch({ retentionDays: d })}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-6">
            {createdSlug ? (
              <>
                <header>
                  <p className="eyebrow">Your event is live</p>
                  <h1 className="display-m mt-3">Share this link with your participants</h1>
                  <p className="mt-3 text-[0.9375rem] text-ink-muted">
                    Anyone who opens it can join in the browser. No app, no account.
                  </p>
                </header>
                <ShareLink slug={createdSlug} />
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard" className="btn btn-primary">
                    Go to my events
                  </Link>
                  <Link href={`/e/${createdSlug}`} className="btn btn-secondary">
                    Open the participant view
                  </Link>
                </div>
              </>
            ) : (
              <>
                <header>
                  <p className="eyebrow">Last step</p>
                  <h1 className="display-m mt-3">Sign in to keep your event link</h1>
                  <p className="mt-3 text-[0.9375rem] text-ink-muted">
                    Your event is ready. Signing in saves it to your account so you can come back to
                    the link and see who joined.
                  </p>
                </header>

                <div className="rounded-xl border border-line bg-surface p-5">
                  <p className="text-[0.9375rem] font-medium text-ink">{draft.name || "Your event"}</p>
                  <p className="mt-1 text-[0.875rem] text-ink-muted">
                    {draft.categories.map((c) => c.label).join(", ") || "No categories yet"}
                  </p>
                  <p className="mt-1 text-[0.875rem] text-ink-faint">
                    {draft.questions.length} question{draft.questions.length === 1 ? "" : "s"}, data
                    deleted after {draft.retentionDays} days
                  </p>
                </div>

                {loading ? (
                  <p className="text-[0.875rem] text-ink-faint">Checking your session</p>
                ) : (
                  <SignInButtons label="Sign in" />
                )}

                {creating ? (
                  <Notice tone="info">Creating your event and your link</Notice>
                ) : null}
                {error ? <Notice tone="danger" title="Something went wrong">{error}</Notice> : null}
                {!configured ? (
                  <Notice tone="warning" title="Firebase keys missing">
                    Add your Firebase web app keys to .env.local, then reload this page. Your draft
                    stays saved in this browser.
                  </Notice>
                ) : null}

                <p className="text-[0.8125rem] text-ink-faint">
                  We only use your account to keep your events. Participants never see your address.
                </p>
              </>
            )}
          </section>
        ) : null}
      </div>

      {step < 3 || (step === 3 && !createdSlug) ? (
        <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (step === 0 ? router.push("/") : setStep((s) => s - 1))}
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
