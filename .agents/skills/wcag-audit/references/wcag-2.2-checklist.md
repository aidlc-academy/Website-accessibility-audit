# WCAG 2.2 Level A & AA Quick Audit Checklist

This reference guide summarizes all WCAG 2.2 Level A and AA Success Criteria, highlighted with specific verification methods and test criteria.

---

## Principle 1: Perceivable

### 1.1 Text Alternatives
- [ ] **1.1.1 Non-text Content (Level A)**: All non-text content (images, icons, charts, SVG) has an appropriate text alternative (`alt` attribute, `<title>`, or `aria-label`). Decorative graphics have `alt=""` or `aria-hidden="true"`.

### 1.2 Time-based Media
- [ ] **1.2.1 Audio-only and Video-only (Prerecorded) (Level A)**: Transcripts provided for audio-only; audio tracks or text transcripts provided for video-only.
- [ ] **1.2.2 Captions (Prerecorded) (Level A)**: Synchronized closed captions provided for all prerecorded video with spoken dialog.
- [ ] **1.2.3 Audio Description or Media Alternative (Level A)**: Audio description or full text transcript provided for prerecorded video.
- [ ] **1.2.4 Captions (Live) (Level AA)**: Captions provided for live audio content in synchronized media.
- [ ] **1.2.5 Audio Description (Prerecorded) (Level AA)**: Synchronized audio description provided for all prerecorded video.

### 1.3 Adaptable
- [ ] **1.3.1 Info and Relationships (Level A)**: Visual structure matches programmatic structure (semantic headings `<h1>`-`<h6>`, lists `<ul>`/`<ol>`, tables with `<th>` and `scope`, form labels with `for` and `id`).
- [ ] **1.3.2 Meaningful Sequence (Level A)**: DOM order corresponds to logical reading order.
- [ ] **1.3.3 Sensory Characteristics (Level A)**: Instructions do not rely solely on shape, size, color, or sound (e.g. avoid "click the green button on the right").
- [ ] **1.3.4 Orientation (Level AA)**: Content is not locked to portrait or landscape mode unless essential.
- [ ] **1.3.5 Identify Input Purpose (Level AA)**: Form inputs collecting personal info use appropriate HTML autocomplete tokens (e.g., `autocomplete="name"`, `autocomplete="email"`).

### 1.4 Distinguishable
- [ ] **1.4.1 Use of Color (Level A)**: Color is not the only visual cue used to convey meaning, indicate an action, or prompt a response.
- [ ] **1.4.2 Audio Control (Level A)**: Audio that plays automatically for >3 seconds can be paused, stopped, or muted.
- [ ] **1.4.3 Contrast (Minimum) (Level AA)**: Normal text (< 18pt or < 14pt bold) has at least **4.5:1** contrast; large text has at least **3.0:1** contrast.
- [ ] **1.4.4 Resize Text (Level AA)**: Text can be resized up to 200% without assistive technology and without loss of content/functionality.
- [ ] **1.4.5 Images of Text (Level AA)**: Real text is used instead of raster images of text (except logos).
- [ ] **1.4.10 Reflow (Level AA)**: Content reflows without loss of information and without two-dimensional scrolling at 320 CSS pixels wide (or 400% zoom at 1280px).
- [ ] **1.4.11 Non-text Contrast (Level AA)**: UI components (buttons, inputs borders, focus rings) and graphical objects have at least **3.0:1** contrast against adjacent background.
- [ ] **1.4.12 Text Spacing (Level AA)**: No content or functionality is lost when line height is 1.5x font size, letter spacing is 0.12x, and word spacing is 0.16x.
- [ ] **1.4.13 Content on Hover or Focus (Level AA)**: Tooltips or popups triggered by hover/focus are dismissible without moving pointer (e.g. via <kbd>Esc</kbd>), hoverable, and persistent.

---

## Principle 2: Operable

### 2.1 Keyboard Accessible
- [ ] **2.1.1 Keyboard (Level A)**: All functionality is operable through a keyboard interface without specific timing constraints.
- [ ] **2.1.2 No Keyboard Trap (Level A)**: Keyboard focus can leave any component using standard keys (<kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>, <kbd>Esc</kbd>).
- [ ] **2.1.4 Character Key Shortcuts (Level A)**: Single-key shortcuts can be turned off, remapped, or are only active when focused.

### 2.2 Enough Time
- [ ] **2.2.1 Timing Adjustable (Level A)**: Users can turn off, adjust, or extend session timeouts.
- [ ] **2.2.2 Pause, Stop, Hide (Level A)**: Any moving, blinking, or auto-updating content (carousels, tickers) can be paused or stopped.

### 2.3 Seizures and Physical Reactions
- [ ] **2.3.1 Three Flashes or Below Threshold (Level A)**: No elements flash more than 3 times in any 1-second period.

### 2.4 Navigable
- [ ] **2.4.1 Bypass Blocks (Level A)**: A mechanism exists to bypass repeated navigation blocks (e.g., "Skip to main content").
- [ ] **2.4.2 Page Titled (Level A)**: Web pages have descriptive, unique `<title>` elements.
- [ ] **2.4.3 Focus Order (Level A)**: Keyboard focus order preserves meaning and operability.
- [ ] **2.4.4 Link Purpose (In Context) (Level A)**: The purpose of each link is clear from its text alone or combined with context.
- [ ] **2.4.5 Multiple Ways (Level AA)**: More than one way is available to locate a page (search bar, site map, table of contents).
- [ ] **2.4.6 Headings and Labels (Level AA)**: Headings and labels describe topic or purpose clearly.
- [ ] **2.4.7 Focus Visible (Level AA)**: Any keyboard-operable interface has a clearly visible focus indicator.
- [ ] **2.4.11 Focus Not Obscured (Minimum) (Level AA - NEW in WCAG 2.2)**: Focused components must not be completely hidden beneath sticky headers, footers, cookie prompts, or popups.

### 2.5 Input Modalities
- [ ] **2.5.1 Pointer Gestures (Level A)**: Multi-point or path-based gestures (pinch zoom, swipe) can also be operated with a simple single pointer click/tap.
- [ ] **2.5.2 Pointer Cancellation (Level A)**: Functions activate on the up-event (pointer up) with ability to abort/undo.
- [ ] **2.5.3 Label in Name (Level A)**: For components with visible text labels, the accessible name matches or contains the visible label.
- [ ] **2.5.4 Motion Actuation (Level A)**: Actions triggered by device shaking or tilting can also be operated via UI controls.
- [ ] **2.5.7 Dragging Movements (Level AA - NEW in WCAG 2.2)**: Functionality that relies on dragging (e.g. kanban card drag-and-drop, sliders) can also be achieved with single-pointer clicks (e.g. "Move Up", "Move Down" buttons).
- [ ] **2.5.8 Target Size (Minimum) (Level AA - NEW in WCAG 2.2)**: Clickable/tappable elements must have a target size of at least **24x24 CSS pixels**, or have sufficient spacing from adjacent targets.

---

## Principle 3: Understandable

### 3.1 Readable
- [ ] **3.1.1 Language of Page (Level A)**: The default human language of the page is identified with the `lang` attribute on `<html>` (e.g., `<html lang="en">`).
- [ ] **3.1.2 Language of Parts (Level AA)**: Passages or phrases in languages different from the page default are marked with `lang="..."`.

### 3.2 Predictable
- [ ] **3.2.1 On Focus (Level A)**: Receiving focus does not automatically trigger a change of context (e.g., navigating away, submitting form).
- [ ] **3.2.2 On Input (Level A)**: Changing the setting of any UI control does not automatically trigger an unexpected context change without warning.
- [ ] **3.2.3 Consistent Navigation (Level AA)**: Navigational mechanisms that appear on multiple pages occur in the same relative order.
- [ ] **3.2.4 Consistent Identification (Level AA)**: Components with the same functionality across pages are identified consistently.
- [ ] **3.2.6 Consistent Help (Level A - NEW in WCAG 2.2)**: Help mechanisms (support contact, chat bot, FAQs) repeated across pages appear in the same relative place.

### 3.3 Input Assistance
- [ ] **3.3.1 Error Identification (Level A)**: If an input error is detected, the item in error is identified and described in text.
- [ ] **3.3.2 Labels or Instructions (Level A)**: Labels or instructions are provided when content requires user input.
- [ ] **3.3.3 Error Suggestion (Level AA)**: If an error is detected and suggestions for correction are known, suggestions are provided to the user.
- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)**: Submissions with legal/financial consequences can be reviewed, confirmed, or reversed.
- [ ] **3.3.7 Redundant Entry (Level A - NEW in WCAG 2.2)**: Information previously entered in the same session is either auto-populated or available for selection.
- [ ] **3.3.8 Accessible Authentication (Minimum) (Level AA - NEW in WCAG 2.2)**: Logging in does not require solving cognitive tests (like memorizing text or transcribing captcha) without an accessible alternative (such as copy-pasting or password manager support).

---

## Principle 4: Robust

### 4.1 Compatible
- [ ] **4.1.2 Name, Role, Value (Level A)**: For all UI components, the name and role can be programmatically determined; states, properties, and values can be set and observed by assistive tech.
- [ ] **4.1.3 Status Messages (Level AA)**: In content implemented using markup, status messages can be programmatically determined through role or properties (`role="status"`, `role="alert"`, `aria-live`) without receiving focus.
