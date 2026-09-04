"use client";

import { useEffect, useState } from "react";

import { PhotoField, type PhotoSelection } from "@/components/app/PhotoField";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import type {
  ContactMethod,
  EventQuestion,
  PairspaceEvent,
  Participant,
  ParticipantAnswer,
  ParticipantContact,
} from "@/lib/types";

export interface ParticipantFormValue {
  firstName: string;
  categoryIds: string[];
  lookingForIds: string[];
  answers: ParticipantAnswer[];
  note: string;
  contactMethods: ContactMethod[];
  email: string;
  phone: string;
  notifyOnMatch: boolean;
}

export interface ParticipantSubmission extends ParticipantFormValue {
  photo: PhotoSelection;
}

const CONTACT_OPTIONS: { id: ContactMethod; label: string; hint: string }[] = [
  { id: "email", label: "Email", hint: "You get an email for requests and for new matches." },
  { id: "whatsapp", label: "WhatsApp or phone", hint: "Your number is shared once you both accept." },
  { id: "link", label: "Only through this link", hint: "Nothing leaves this page. Come back here to see requests." },
];

export const EMAIL_PATTERN = /.+@.+\..+/;

/** At least seven digits, so a typo like a single area code does not pass. */
export function phoneLooksValid(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 7;
}

function emptyValue(): ParticipantFormValue {
  return {
    firstName: "",
    categoryIds: [],
    lookingForIds: [],
    answers: [],
    note: "",
    contactMethods: ["email"],
    email: "",
    phone: "",
    notifyOnMatch: true,
  };
}

export function ParticipantForm({
  event,
  existing,
  existingContact,
  onSubmit,
  busy,
}: {
  event: PairspaceEvent;
  existing?: Participant | null;
  existingContact?: ParticipantContact | null;
  onSubmit: (value: ParticipantSubmission) => void | Promise<void>;
  busy?: boolean;
}) {
  // While editing an existing profile the source of truth is the record, not a
  // draft, so persistence is only enabled for a first time join.
  const isNew = !existing;
  const [value, setValue, { restored, clear }] = usePersistentState<ParticipantFormValue>(
    `pairspace.participant.${event.id}`,
    emptyValue(),
    { enabled: isNew },
  );
  const [photo, setPhoto] = useState<PhotoSelection>({
    blob: null,
    preview: existing?.photoUrl ?? null,
    removed: false,
  });
  const [touched, setTouched] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    if (!existing) return;
    const email = existingContact?.email ?? "";
    const phone = existingContact?.phone ?? "";
    // Profiles from before contact methods existed only had an email.
    const methods: ContactMethod[] = existing.contactMethods?.length
      ? existing.contactMethods
      : email
        ? ["email"]
        : ["link"];
    setValue({
      firstName: existing.firstName,
      categoryIds: existing.categoryIds,
      lookingForIds: existing.lookingForIds,
      answers: existing.answers,
      note: existing.note,
      contactMethods: methods,
      email,
      phone,
      notifyOnMatch: existing.notifyOnMatch,
    });
  }, [existing, existingContact, setValue]);

  useEffect(() => {
    if (restored) setNoticeVisible(true);
  }, [restored]);

  function toggle(list: "categoryIds" | "lookingForIds", id: string) {
    setValue((v) => {
      const has = v[list].includes(id);
      return { ...v, [list]: has ? v[list].filter((x) => x !== id) : [...v[list], id] };
    });
  }

  function toggleContact(id: ContactMethod) {
    setValue((v) => {
      const has = v.contactMethods.includes(id);
      if (has) return { ...v, contactMethods: v.contactMethods.filter((m) => m !== id) };
      // "Only through this link" rules the other two out, and the other way round.
      if (id === "link") return { ...v, contactMethods: ["link"] };
      return { ...v, contactMethods: [...v.contactMethods.filter((m) => m !== "link"), id] };
    });
  }

  function answerFor(q: EventQuestion): string[] {
    const found = value.answers.find((a) => a.questionId === q.id);
    if (!found) return [];
    return Array.isArray(found.value) ? found.value : found.value ? [found.value] : [];
  }

  function setAnswer(q: EventQuestion, next: string | string[]) {
    setValue((v) => ({
      ...v,
      answers: [
        ...v.answers.filter((a) => a.questionId !== q.id),
        { questionId: q.id, value: next },
      ],
    }));
  }

  const missingRequired = event.questions
    .filter((q) => q.required)
    .filter((q) => answerFor(q).length === 0);

  const photoMissing =
    event.allowPhotos && event.requirePhotos && !photo.preview && !existing?.photoUrl;

  const wantsEmail = value.contactMethods.includes("email");
  const wantsPhone = value.contactMethods.includes("whatsapp");
  const linkOnly = value.contactMethods.includes("link");

  const contactProblems: string[] = [];
  if (!value.contactMethods.length) contactProblems.push("choose how people can reach you");
  if (wantsEmail && !EMAIL_PATTERN.test(value.email)) contactProblems.push("enter a valid email address");
  if (wantsPhone && !phoneLooksValid(value.phone)) contactProblems.push("enter a phone number with country code");

  const valid =
    value.firstName.trim().length >= 2 &&
    value.categoryIds.length > 0 &&
    contactProblems.length === 0 &&
    missingRequired.length === 0 &&
    !photoMissing;

  return (
    <form
      className="space-y-7"
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!valid) return;
        await onSubmit({
          ...value,
          email: wantsEmail ? value.email : "",
          phone: wantsPhone ? value.phone : "",
          notifyOnMatch: wantsEmail && value.notifyOnMatch,
          photo,
        });
        if (isNew) clear();
      }}
    >
      {noticeVisible ? (
        <div className="flex items-start gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-[3px] shrink-0" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="var(--color-accent)" />
            <path d="M8 4.6v4.2M8 11.1v.6" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <div className="flex-1">
            <p className="text-[0.875rem] text-ink-secondary">
              We brought back what you had already filled in.
            </p>
          </div>
          <button
            type="button"
            className="text-[0.8125rem] text-accent hover:underline"
            onClick={() => {
              clear();
              setValue(emptyValue());
              setNoticeVisible(false);
            }}
          >
            Start over
          </button>
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="firstName">
          Your first name
        </label>
        <input
          id="firstName"
          className="field"
          value={value.firstName}
          onChange={(e) => setValue((v) => ({ ...v, firstName: e.target.value }))}
          placeholder="Maya"
          maxLength={40}
          autoComplete="given-name"
        />
        <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
          Only your first name is shown to other participants.
        </p>
      </div>

      {event.allowPhotos ? (
        <PhotoField
          name={value.firstName}
          seed={existing?.id ?? `${event.id}:${value.firstName || "you"}`}
          currentUrl={existing?.photoUrl}
          required={event.requirePhotos}
          onChange={setPhoto}
        />
      ) : null}

      <div>
        <p className="label">I am</p>
        <div className="flex flex-wrap gap-2">
          {event.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              data-active={value.categoryIds.includes(c.id)}
              onClick={() => toggle("categoryIds", c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">I am looking for</p>
        <div className="flex flex-wrap gap-2">
          {event.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              data-active={value.lookingForIds.includes(c.id)}
              onClick={() => toggle("lookingForIds", c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {event.questions.map((q) => (
        <div key={q.id}>
          <label className="label" htmlFor={`q-${q.id}`}>
            {q.label}
            {q.required ? <span className="ml-1 text-accent">required</span> : null}
          </label>
          {q.helpText ? (
            <p className="-mt-1 mb-2.5 text-[0.8125rem] text-ink-faint">{q.helpText}</p>
          ) : null}
          {q.type === "text" ? (
            <textarea
              id={`q-${q.id}`}
              className="field"
              rows={2}
              value={answerFor(q)[0] ?? ""}
              onChange={(e) => setAnswer(q, e.target.value)}
              maxLength={280}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = answerFor(q).includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    className="chip h-auto min-h-10 py-2 text-left whitespace-normal"
                    data-active={selected}
                    onClick={() => {
                      if (q.type === "single") setAnswer(q, selected ? "" : o);
                      else {
                        const current = answerFor(q);
                        setAnswer(q, selected ? current.filter((x) => x !== o) : [...current, o]);
                      }
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div>
        <label className="label" htmlFor="note">
          Anything else worth knowing
        </label>
        <textarea
          id="note"
          className="field"
          rows={2}
          value={value.note}
          onChange={(e) => setValue((v) => ({ ...v, note: e.target.value }))}
          placeholder="Happy to warm up slowly, I train mostly standing acro."
          maxLength={280}
        />
      </div>

      <fieldset className="rounded-xl border border-line bg-sunken/60 p-4 sm:p-5">
        <legend className="label px-1">How can people reach you</legend>
        <p className="-mt-1 text-[0.8125rem] text-ink-faint">
          Hidden from everyone. Shared only with a person you both agreed to connect with.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTACT_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className="chip"
              data-active={value.contactMethods.includes(o.id)}
              onClick={() => toggleContact(o.id)}
              title={o.hint}
            >
              {o.label}
            </button>
          ))}
        </div>

        {wantsEmail ? (
          <div className="mt-4">
            <label className="label" htmlFor="email">
              Your email address
            </label>
            <input
              id="email"
              type="email"
              className="field"
              value={value.email}
              onChange={(e) => setValue((v) => ({ ...v, email: e.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
            <label className="mt-3 flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                checked={value.notifyOnMatch}
                onChange={(e) => setValue((v) => ({ ...v, notifyOnMatch: e.target.checked }))}
              />
              <span className="text-[0.875rem] text-ink-secondary">
                Email me when a matching participant joins this event
              </span>
            </label>
          </div>
        ) : null}

        {wantsPhone ? (
          <div className="mt-4">
            <label className="label" htmlFor="phone">
              Your WhatsApp or phone number
            </label>
            <input
              id="phone"
              type="tel"
              className="field"
              value={value.phone}
              onChange={(e) => setValue((v) => ({ ...v, phone: e.target.value }))}
              placeholder="+49 170 1234567"
              autoComplete="tel"
              inputMode="tel"
              maxLength={40}
            />
            <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
              With country code, so people from abroad can reach you.
            </p>
          </div>
        ) : null}

        {linkOnly ? (
          <p className="mt-4 text-[0.875rem] leading-relaxed text-ink-secondary">
            We cannot notify you. Open this link again to see requests, and whoever you pair up
            with will look for you at the event.
          </p>
        ) : !wantsEmail && wantsPhone ? (
          <p className="mt-3 text-[0.8125rem] text-ink-faint">
            Without an email address we cannot notify you about requests. Open this link again
            to see them.
          </p>
        ) : null}
      </fieldset>

      {touched && !valid ? (
        <p className="text-[0.875rem] text-danger">
          Please add your name, at least one category
          {contactProblems.length ? `, ${contactProblems.join(", ")}` : ""}
          {missingRequired.length
            ? `, answer ${missingRequired.map((q) => q.label).join(", ")}`
            : ""}
          {photoMissing ? " and upload a photo" : ""}.
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Saving" : existing ? "Save changes" : "Join this event"}
      </button>

      {isNew ? (
        <p className="text-center text-[0.8125rem] text-ink-faint">
          Your answers are kept in this browser while you fill them in, so a reload never loses
          them.
        </p>
      ) : null}
    </form>
  );
}
