# Pairspace Design System

Derived from the reference landing page. The visual character is: a lot of white,
one strong near black type voice, one restrained blue accent, hairline borders,
almost no shadow, and geometry (circles and orbits) instead of decoration.

## 1. Color palette

### Neutrals (the backbone, 90 percent of the page)

| Token | Hex | Use |
| --- | --- | --- |
| `--canvas` | `#F7F7F8` | page background behind the content sheet |
| `--surface` | `#FFFFFF` | cards, nav pill, panels, content sheet |
| `--surface-sunken` | `#FAFAFB` | inset rows, table stripes, code blocks |
| `--line` | `#EAEAEC` | hairline borders, dividers, orbit rings |
| `--line-strong` | `#D8D8DC` | hover borders, focused field borders |
| `--ink` | `#0A0A0B` | display headlines, primary buttons |
| `--ink-secondary` | `#3C3C42` | body copy on white |
| `--ink-muted` | `#71717A` | supporting copy, captions, labels |
| `--ink-faint` | `#A1A1AA` | placeholder text, disabled labels |

### Accent (used sparingly, never as a background wash)

| Token | Hex | Use |
| --- | --- | --- |
| `--blue` | `#2B4EF0` | primary accent, eyebrow labels, active chips, links |
| `--blue-hover` | `#2340CC` | hover state of blue elements |
| `--blue-soft` | `#EDF1FE` | active chip background, badge background |
| `--blue-line` | `#C7D3FB` | border of active chips and selected cards |
| `--glow` | `rgba(43,78,240,0.16)` | the soft halo behind the notification stack |

### Semantic

| Token | Hex | Use |
| --- | --- | --- |
| `--positive` | `#15803D` | match found, verified, live event |
| `--positive-soft` | `#E9F6EE` | background of positive badges |
| `--warning` | `#B45309` | pending, waiting for confirmation |
| `--warning-soft` | `#FDF4E7` | background of warning badges |
| `--danger` | `#B42318` | destructive actions, delete event |
| `--danger-soft` | `#FDECEA` | background of danger badges |

Rules
1. Blue never covers a large surface. It appears in text, thin borders, small
   badges, one glow and the focus ring.
2. Primary buttons are near black, not blue. Blue is the second voice.
3. Every colored badge pairs a `-soft` background with the full strength text color.

## 2. Typography

Two families from the same superfamily so the page stays quiet.

* Display: **Inter Tight**, weight 600 and 700, tracking pulled in tight.
* Text: **Inter**, weight 400 and 500.
* Numbers in the dashboard use tabular figures.

| Style | Size (desktop) | Size (mobile) | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- | --- |
| Display XL (hero) | 76px | 40px | 700 | -0.04em | 0.98 |
| Display L (section) | 56px | 32px | 700 | -0.035em | 1.02 |
| Display M | 40px | 27px | 700 | -0.03em | 1.06 |
| Heading | 24px | 21px | 600 | -0.02em | 1.2 |
| Subheading | 19px | 17px | 500 | -0.015em | 1.4 |
| Body L (hero support) | 20px | 17px | 400 | -0.01em | 1.55 |
| Body | 16px | 16px | 400 | 0 | 1.6 |
| Small | 14px | 14px | 400 | 0 | 1.55 |
| Caption | 13px | 13px | 500 | 0 | 1.4 |
| Eyebrow | 12px | 12px | 600 | 0.14em | 1.2, uppercase |

Rules
1. Headlines are near black at `--ink`, never gray, never gradient.
2. Supporting copy under a headline is `--ink-muted` and never wider than 62ch.
3. Eyebrows are uppercase, letterspaced and colored `--blue`.
4. Only one Display XL per page.

## 3. Spacing and layout

* Base unit 4px. The scale in use: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120, 160.
* Content column max width 1200px, reading column 720px, narrow forms 560px.
* Section rhythm: 160px vertical on desktop, 88px on mobile.
* The page sits on a white sheet with a 28px radius floating above `--canvas`,
  the same way the reference frames its content.

## 4. Radius

| Token | Value | Use |
| --- | --- | --- |
| `--r-sm` | 8px | chips, badges, inputs inside dense rows |
| `--r-md` | 12px | inputs, small cards |
| `--r-lg` | 16px | panels, product preview cards |
| `--r-xl` | 24px | large panels, the content sheet |
| `--r-pill` | 999px | nav container, buttons, avatars |

## 5. Elevation

Shadows stay almost invisible. Depth comes from hairlines.

| Token | Value |
| --- | --- |
| `--shadow-xs` | `0 1px 2px rgba(10,10,11,0.04)` |
| `--shadow-sm` | `0 2px 8px rgba(10,10,11,0.05)` |
| `--shadow-md` | `0 8px 28px rgba(10,10,11,0.07)` |
| `--shadow-lg` | `0 24px 64px rgba(10,10,11,0.09)` |

## 6. Motion

* Standard easing `cubic-bezier(0.22, 1, 0.36, 1)`.
* Micro interactions 160ms, panel and card transitions 260ms, orbit drift 40s and slower.
* Entrances move 12px and fade. Nothing scales more than 1.02.
* Every motion is wrapped in `prefers-reduced-motion` guards.

## 7. Orbit language

The hero is built from concentric circles centered under the headline. The same
language returns in the section dividers, the avatar rail, the use case ring and
the footer mark, so the page never switches to a generic template.

* Ring stroke: 1px `--line`, plus one accent arc per ring in `--blue` at 22 percent opacity.
* Ring diameters step by roughly 260px.
* Avatars ride the rings at 56px to 72px, white background, 1px `--line` border,
  `--shadow-sm`, and a small role badge in `--blue-soft`.

## 8. Component rules

* Buttons: primary is `--ink` on white text, pill, 44px tall, 24px side padding.
  Secondary is white with `--line` border. Tertiary is text only with a blue underline on hover.
* Inputs: 44px tall, 1px `--line`, radius `--r-md`, focus ring 3px `--blue-soft` plus
  1px `--blue` border.
* Cards: 1px `--line`, radius `--r-lg`, white, `--shadow-xs`. Hover lifts to `--shadow-sm`.
* Never a three column icon feature grid. Sections alternate between a wide editorial
  text block and one realistic interface preview.

## 9. Copy rules

* Product English, international, no hyphen characters anywhere in visible copy.
* Sentences stay short. Claims stay concrete.
* Never dating language. Never social network language.
