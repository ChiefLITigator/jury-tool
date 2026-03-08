# VF Data Entry Manual — v2
## How to Author Special Verdict Form JSON Entries

This manual is your reference while transcribing CACI special verdict forms
into `vf-data.json`. Keep it open in VS Code alongside the data file.

---

## What This File Is (and Isn't)

`vf-data.json` is a **component library**, not a collection of complete forms.

Each entry is a named *group* of question blocks drawn from an official Judicial
Council VF. When you build a verdict form in the app, you pull individual
question blocks out of these groups and assemble them in whatever order your
case requires. You can mix questions from multiple groups — for example,
combining breach of fiduciary duty liability questions with a general damages
block from VF-3900.

The routing you enter here is the **default routing** for that group when used
as a complete standalone form. Once a question block is added to a working form
in the builder, the routing can be overridden freely. So transcribe routing
accurately from the official VF — it will pre-populate the editor correctly for
the standard case, and you'll adjust it when your case needs something different.

---

## The Golden Rule

Work directly from the official Judicial Council VF text.
Transcribe exactly what you see. Do not paraphrase questions.
The routing logic (the "If your answer is Yes, answer question X"
instructions) is just as important as the question text — capture it all.

---

## File Structure Overview

`vf-data.json` has a single top-level key `"groups"` which holds an array.
Each element of the array is one group object.

```json
{
  "groups": [
    {
      "id": "VF-400",
      "title": "Negligence—Essential Factual Elements",
      "category": "negligence",
      "signature_block": true,
      "questions": [ ...question objects... ]
    },
    {
      "id": "VF-500",
      "title": "Breach of Contract—Essential Factual Elements",
      "category": "contract",
      "signature_block": true,
      "questions": [ ...question objects... ]
    }
  ]
}
```

**Important:** The outer structure is an array, not an object keyed by VF id.
Always add new groups by appending to the array. Do not use VF ids as JSON
object keys at the top level.

---

## The Group Object

Every group has these fields:

| Field | What to put |
|-------|-------------|
| `id` | Exact VF number: `"VF-400"` |
| `title` | Title exactly as printed on the form |
| `category` | One of: `negligence`, `premises`, `contract`, `insurance`, `products`, `intentional`, `damages`, `employment` |
| `questions` | Array of question objects — see below |
| `signature_block` | Always `true` for special verdict forms |

---

## Question IDs: Internal vs. Display Numbers

This is the most important concept to understand before entering data.

**Internal ids** (`"q1"`, `"q2"`, `"q3"`) are stable identifiers you assign
in the JSON. They never change, never appear on the printed form, and are
what routing references point to.

**Display numbers** (1., 2., 3. on the printed form) are computed
automatically by the app based on the order questions appear in the working
form at the time you print. If you reorder questions in the builder, display
numbers update automatically.

This means:
- Your `if_yes: "q3"` routing reference is always correct regardless of
  whether q3 prints as question 2 or question 5 in a given custom form.
- Never put a display number in a routing field. Always use the internal id.
- When transcribing routing text from the official VF ("If your answer to
  question 3 is Yes..."), translate the official display number to the
  corresponding internal id in your JSON.

**Reserved destination keywords** — these are not question ids, they are
special terminal destinations:

| Keyword | Meaning |
|---------|---------|
| `"sign"` | Proceed to the foreperson signature block — jury finds for plaintiff on all elements |
| `"stop"` | Jury finds for defense; include `stop_text` with the exact instruction |

---

## Question Types

There are four types. Every question has a `type` field.

---

### Type 1: `yes_no`
Used for every liability/element question with a Yes/No answer.

```json
{
  "id":        "q1",
  "type":      "yes_no",
  "text":      "Was [name of defendant] negligent?",
  "fields":    ["name of defendant"],
  "if_yes":    "q2",
  "if_no":     "stop",
  "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
}
```

| Field | Notes |
|-------|-------|
| `id` | Sequential within this group: `"q1"`, `"q2"`, `"q3"` etc. |
| `text` | Exact question text. Use `[brackets]` for fill-in party names. |
| `fields` | Every bracketed fill-in in `text`. If none, use `[]`. |
| `if_yes` | Internal question id, `"sign"`, or (rarely) `"stop"`. |
| `if_no` | Internal question id or `"stop"`. |
| `stop_text` | Required when `if_no` is `"stop"`. Exact instruction text from the form. Omit entirely when `if_no` is not `"stop"`. |

---

### Type 2: `damages`
Used for questions asking the jury to write in dollar amounts.

```json
{
  "id":    "q4",
  "type":  "damages",
  "text":  "What are [name of plaintiff]'s damages?",
  "fields": ["name of plaintiff"],
  "line_items": [
    { "id": "past_econ",      "label": "Past economic loss" },
    { "id": "future_econ",    "label": "Future economic loss" },
    { "id": "past_nonecon",   "label": "Past noneconomic loss" },
    { "id": "future_nonecon", "label": "Future noneconomic loss" }
  ],
  "if_done": "sign"
}
```

| Field | Notes |
|-------|-------|
| `line_items` | One entry per damages category. Copy labels exactly from the form. |
| `id` in line_items | Short snake_case you make up. Never appears in the form. |
| `if_done` | Almost always `"sign"`. |

**Standard line_item id conventions — use these consistently:**

| id | Label |
|----|-------|
| `past_econ` | Past economic loss |
| `future_econ` | Future economic loss |
| `past_nonecon` | Past noneconomic loss |
| `future_nonecon` | Future noneconomic loss |
| `medical` | Medical expenses |
| `lost_wages` | Lost earnings / lost wages |
| `property` | Property damage |
| `punitive` | Punitive damages |
| `brandt` | Brandt fees / attorneys' fees |
| `interest` | Prejudgment interest |

---

### Type 3: `percentage`
Used for comparative fault questions asking for percentage allocation.

```json
{
  "id":    "q5",
  "type":  "percentage",
  "text":  "What percentage of responsibility do you assign to each party?",
  "fields": [],
  "parties": [
    { "id": "p_plaintiff", "label": "[name of plaintiff]" },
    { "id": "p_defendant", "label": "[name of defendant]" }
  ],
  "must_total": 100,
  "if_done": "q6"
}
```

| Field | Notes |
|-------|-------|
| `parties` | One entry per party. Copy labels exactly, including brackets. |
| `must_total` | Always `100`. |
| `if_done` | Next question id or `"sign"`. |

---

### Type 4: `write_in`
Used for the rare question asking for a narrative or non-dollar text answer.

```json
{
  "id":      "q3",
  "type":    "write_in",
  "text":    "Describe the nature of [name of plaintiff]'s injury.",
  "fields":  ["name of plaintiff"],
  "if_done": "q4"
}
```

---

## Handling Fill-In Fields

Any bracketed term in the question text is a fill-in field.

1. Put it in `text` exactly as it appears in the form: `[name of defendant]`
2. List the exact same string in the `fields` array: `"fields": ["name of defendant"]`
3. If the same party appears multiple times in one question, list it only once
   in `fields`.

**Standard field name conventions — use these exactly, every time:**

| Always write | For |
|-------------|-----|
| `[name of plaintiff]` | Plaintiff |
| `[name of defendant]` | Defendant |
| `[name of plaintiff/cross-complainant]` | Cross-complainant |
| `[name of defendant/cross-defendant]` | Cross-defendant |

The app substitutes these globally — when the user types a party name once,
it populates everywhere that field appears. This only works if you use the
exact same string consistently across all groups.

---

## Routing Logic

### Pattern 1: Linear
Form proceeds to the next question on Yes, no special instruction shown.
```json
"if_yes": "q2"
```

### Pattern 2: Gate (most common)
Yes continues; No stops or skips.
```json
"if_yes": "q3",
"if_no":  "stop",
"stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
```

### Pattern 3: Branch
Different paths for Yes and No.
```json
"if_yes": "q4",
"if_no":  "q6"
```

### Translating official display numbers to internal ids

The official VF says: *"If your answer to question 3 is Yes, answer question 4."*

In your JSON, question 3 in the official form is whichever question you
assigned `"id": "q3"`. Its `if_yes` should be `"q4"` — the internal id of
whatever you assigned as question 4, regardless of what display number it
will eventually print as in a custom form.

As long as you assign ids sequentially in the same order as the official
form, `"if_yes": "q4"` will always correctly point to the right question.

---

## Step-by-Step Process for Each Group

1. **Open the official VF** in the Judicial Council PDF alongside your editor.

2. **Create the group skeleton:**
```json
{
  "id": "VF-400",
  "title": "Negligence—Essential Factual Elements",
  "category": "negligence",
  "signature_block": true,
  "questions": []
}
```

3. **Read the entire form once** before entering anything. Count the questions,
   note where stops are, note where the damages section begins.

4. **Assign internal ids mentally** — q1 through qN in the order they appear.
   Write them on a scratch copy of the form if it helps, so you know what
   `if_yes` and `if_no` values to enter for each question before you get there.

5. **Enter questions in order.** For each:
   - Set the type
   - Copy the question text exactly, converting party names to `[brackets]`
   - List the fields
   - Set the routing using internal ids

6. **Trace the routing when done:**
   - Path 1: all Yes answers → should end at `"sign"`
   - Path 2: first question No → should end at `"stop"`
   - Path 3: any branch paths → trace each to a valid terminal

7. **Validate your JSON** after completing each group. Paste the entire file
   into VS Code's JSON validator (it flags errors in the gutter) or
   jsonlint.com. A single missing comma breaks the entire file.

8. **Append to the groups array** — add a comma after the previous group's
   closing `}` before adding the new one.

---

## Worked Example: VF-400 (Negligence)

The official VF-400 text:

> 1. Was [name of defendant] negligent?
>    __ Yes  __ No
>    If your answer to question 1 is Yes, answer question 2.
>    If you answered No, stop here, answer no further questions, and have
>    the presiding juror sign and date this form.
>
> 2. Was [name of defendant]'s negligence a substantial factor in causing
>    harm to [name of plaintiff]?
>    __ Yes  __ No
>    If your answer to question 2 is Yes, answer question 3.
>    If you answered No, stop here, answer no further questions, and have
>    the presiding juror sign and date this form.
>
> 3. What are [name of plaintiff]'s damages?
>    Past economic loss           $ ________
>    Future economic loss         $ ________
>    Past noneconomic loss        $ ________
>    Future noneconomic loss      $ ________
>    TOTAL                        $ ________

Transcribed:

```json
{
  "groups": [
    {
      "id": "VF-400",
      "title": "Negligence—Essential Factual Elements",
      "category": "negligence",
      "signature_block": true,
      "questions": [
        {
          "id": "q1",
          "type": "yes_no",
          "text": "Was [name of defendant] negligent?",
          "fields": ["name of defendant"],
          "if_yes": "q2",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q2",
          "type": "yes_no",
          "text": "Was [name of defendant]'s negligence a substantial factor in causing harm to [name of plaintiff]?",
          "fields": ["name of defendant", "name of plaintiff"],
          "if_yes": "q3",
          "if_no": "stop",
          "stop_text": "Stop here, answer no further questions, and have the presiding juror sign and date this form."
        },
        {
          "id": "q3",
          "type": "damages",
          "text": "What are [name of plaintiff]'s damages?",
          "fields": ["name of plaintiff"],
          "line_items": [
            { "id": "past_econ",      "label": "Past economic loss" },
            { "id": "future_econ",    "label": "Future economic loss" },
            { "id": "past_nonecon",   "label": "Past noneconomic loss" },
            { "id": "future_nonecon", "label": "Future noneconomic loss" }
          ],
          "if_done": "sign"
        }
      ]
    }
  ]
}
```

---

## Common Mistakes to Avoid

**Wrong outer structure** — The file must start with `{ "groups": [ ... ] }`.
Do not use VF ids as top-level keys.

**Forgetting a comma between questions or between groups** — JSON requires a
comma after every array element except the last one.

**Using display numbers in routing** — `"if_yes": "3"` is wrong.
Always use internal ids: `"if_yes": "q3"`.

**Inconsistent party name brackets** — `[defendant]` and `[name of defendant]`
are different strings. The app won't substitute them as the same party.
Always use the standard conventions listed above.

**Missing fields array** — Every question needs `"fields"` even if empty: `"fields": []`.

**stop_text on non-stop questions** — Only include `stop_text` when
`if_no` equals `"stop"`. Omit it entirely otherwise.

**Copy-pasting a question and forgetting to change the id** — Duplicate ids
will silently break routing. Change the id immediately after pasting.

---

## Quick Schema Reference Card

```
FILE STRUCTURE
  { "groups": [ ...group objects... ] }

GROUP OBJECT
  id              string    "VF-400"
  title           string    exact title from form
  category        string    negligence|premises|contract|insurance|
                            products|intentional|damages|employment
  questions       array     question objects
  signature_block true

YES/NO QUESTION
  id              string    "q1"
  type            "yes_no"
  text            string    exact text with [brackets]
  fields          array     ["name of defendant"] or []
  if_yes          string    internal id, "sign"
  if_no           string    internal id, "stop"
  stop_text       string    only when if_no is "stop"

DAMAGES QUESTION
  id              string    "q4"
  type            "damages"
  text            string    exact text with [brackets]
  fields          array     [...] or []
  line_items      array     [{ "id": "past_econ", "label": "Past economic loss" }, ...]
  if_done         string    "sign" or internal id

PERCENTAGE QUESTION
  id              string    "q5"
  type            "percentage"
  text            string    exact text
  fields          array     [] usually
  parties         array     [{ "id": "p_plaintiff", "label": "[name of plaintiff]" }, ...]
  must_total      100
  if_done         string    internal id or "sign"

WRITE-IN QUESTION
  id              string    "q3"
  type            "write_in"
  text            string    exact text with [brackets]
  fields          array     [...] or []
  if_done         string    internal id or "sign"

RESERVED ROUTING DESTINATIONS
  "sign"          proceed to signature block
  "stop"          jury finds for defense; requires stop_text on the question
```

---

*End of manual. When in doubt, read the form one more time.*
