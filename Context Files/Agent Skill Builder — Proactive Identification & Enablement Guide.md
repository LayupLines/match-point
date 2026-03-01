# Agent Skill Builder: Proactive Identification & Enablement Guide

> **Purpose:** This document is a standing context file for AI agents working on active projects.
> Its job is to help you (the agent) recognize, draft, and enable Claude Skills in real time —
> without interrupting project work. Read this at session start, then operate from it passively.

-----

## Part 1: Your Standing Mandate

While executing any project task, you have a secondary, always-on responsibility:

**Identify workflows worth turning into Skills. Draft them immediately. Flag them to the user.**

You do not need to ask permission to draft a Skill. You do not need to finish the project first.
When you spot a candidate, draft a `SKILL.md` stub inline and keep moving.

### What counts as a Skill candidate?

Flag a workflow as a candidate if it meets **two or more** of these criteria:

|Signal                      |What it looks like                                                                    |
|----------------------------|--------------------------------------------------------------------------------------|
|**Repetition**              |You’ve done this same sequence of steps before, or the user will clearly need to again|
|**Multi-step**              |More than 3 discrete steps that must happen in a specific order                       |
|**Tool-dependent**          |Requires specific MCP tools, scripts, or APIs                                         |
|**Domain knowledge**        |Embeds rules, standards, or best practices the user shouldn’t have to re-explain      |
|**Fragile without guidance**|Likely to fail or produce inconsistent results without explicit instructions          |
|**Time-consuming to set up**|User had to provide significant context, constraints, or examples to get you started  |

### What does NOT need a Skill?

- One-off creative tasks with no repeatable structure
- Simple factual lookups
- Tasks fully handled by Claude’s default capabilities with no special context
- Anything under 3 steps with no tool dependencies

-----

## Part 2: Skill Anatomy (What You Need to Know to Build One)

### Minimum valid structure

A Skill is a folder containing at minimum one file: `SKILL.md`

```
your-skill-name/          ← kebab-case, no spaces, no capitals
└── SKILL.md              ← exact spelling, case-sensitive
```

Optional additions:

```
your-skill-name/
├── SKILL.md
├── scripts/              ← Python, Bash, etc.
├── references/           ← docs, API guides, examples
└── assets/               ← templates, fonts, icons
```

### SKILL.md format

```markdown
---
name: skill-name-in-kebab-case
description: What it does and when to use it. Include specific trigger phrases.
---

# Skill Name

## Instructions

### Step 1: [First step]
[What happens, what tools are called, what success looks like]

### Step 2: [Next step]
[Continue...]

## Examples

### Example 1: [Common scenario]
User says: "..."
Actions: ...
Result: ...

## Troubleshooting

**Error:** [Message]
**Cause:** [Why]
**Solution:** [Fix]
```

### YAML frontmatter rules (critical — violations prevent upload)

|Rule               |Correct              |Wrong                                         |
|-------------------|---------------------|----------------------------------------------|
|Name format        |`my-skill-name`      |`My Skill Name`, `my_skill_name`              |
|Name reserved words|anything else        |anything starting with `claude` or `anthropic`|
|Description length |under 1024 characters|over 1024 characters                          |
|XML characters     |not allowed anywhere |`<tool>`, `>`                                 |
|Delimiters         |`---` above and below|missing delimiters                            |
|Quotes             |matched or omitted   |`"unclosed string`                            |

### Writing a description that actually triggers

The description is the **most important part**. It determines when Claude loads the Skill automatically.

**Formula:**

```
[What the skill does] + [When to use it] + [Trigger phrases users would actually say]
```

**Good:**

```yaml
description: Generates executive-ready slide decks from bullet-point briefs.
Use when user asks to "build a deck", "make slides", "create a presentation",
or uploads a content outline and wants it turned into a PowerPoint.
```

**Bad:**

```yaml
description: Helps with presentations.
```

**Test yourself:** After writing a description, generate:

- 5 phrases that SHOULD trigger this skill
- 3 phrases that should NOT trigger it

If you can’t generate those easily, the description needs work.

-----

## Part 3: The Five Skill Patterns

Use these patterns to match the right structure to what you’re building.

### Pattern 1: Sequential Workflow

**Use when:** Steps must happen in a fixed order, with dependencies between them.

```markdown
## Instructions
### Step 1: [Action]
Call: [tool/script]
Wait for: [confirmation or output]

### Step 2: [Action]
Requires: Output from Step 1
Call: [tool/script]
```

*Best for:* onboarding flows, document generation pipelines, deployment sequences

-----

### Pattern 2: Multi-MCP Coordination

**Use when:** The workflow spans more than one external service or tool.

```markdown
## Instructions
### Phase 1: [Service A]
1. [Action via MCP Tool A]
2. Capture: [specific output to pass forward]

### Phase 2: [Service B]
1. Use [output from Phase 1]
2. [Action via MCP Tool B]
```

*Best for:* cross-platform content publishing, design-to-dev handoffs, research + reporting pipelines

-----

### Pattern 3: Iterative Refinement

**Use when:** Output quality improves through review-and-revise loops.

```markdown
## Instructions
### Draft
Generate first version.

### Quality Check
Validate against: [specific criteria]
Run: scripts/validate.py (if applicable)

### Refinement Loop
Address each issue. Re-validate. Repeat until criteria met.

### Finalize
Apply final formatting. Save output.
```

*Best for:* content creation, report generation, code review

-----

### Pattern 4: Context-Aware Tool Selection

**Use when:** The same goal requires different tools depending on inputs.

```markdown
## Instructions
### Decision Logic
1. Assess: [input property — file type, size, audience, etc.]
2. Route:
   - If [condition A]: use [Tool X]
   - If [condition B]: use [Tool Y]
   - Default: [fallback]

### Execution
Call selected tool. Explain routing decision to user.
```

*Best for:* smart file storage, adaptive content formatting, tiered processing

-----

### Pattern 5: Domain-Specific Intelligence

**Use when:** The skill’s primary value is embedded expertise, not just tool access.

```markdown
## Instructions
### Pre-Check (Domain Rules)
Before taking action, verify:
- [Rule 1]
- [Rule 2]
Document decision.

### Action
IF all checks pass: proceed
ELSE: flag for review, explain why

### Audit / Documentation
Log: what was checked, what decision was made, why.
```

*Best for:* compliance workflows, brand standards enforcement, style guide adherence, editorial review

-----

## Part 4: In-Session Skill Identification Protocol

Follow this process passively throughout any working session.

### Step 1: Observe (ongoing)

As you work, silently track:

- Steps you’re taking that follow a clear sequence
- Context the user provided that you’d need again next time
- Tools you’re calling in a specific order
- Domain rules or constraints the user specified

### Step 2: Trigger (when 2+ candidate signals appear)

Pause briefly and announce:

> “I’m noticing a pattern here that could become a reusable Skill.
> Want me to draft a `SKILL.md` for this workflow before we continue?”

If the user says yes (or doesn’t object), proceed to Step 3.
If the user says no, note the candidate and continue.

### Step 3: Draft Immediately

While the context is fresh, produce a `SKILL.md` stub using the template in Part 2.
Include:

- YAML frontmatter with name + description
- Step-by-step instructions from what you just did
- At least one example
- Any error conditions you encountered

Mark any gaps with `[TBD]` — a partial draft is better than none.

### Step 4: Self-Validate

Before presenting the draft, run through this checklist:

```
[ ] name is kebab-case, no spaces, no capitals
[ ] description has WHAT + WHEN + trigger phrases
[ ] description is under 1024 characters
[ ] no XML angle brackets anywhere
[ ] steps are specific and actionable (not vague)
[ ] at least one example included
[ ] 5 "should trigger" phrases I could name right now
[ ] 3 "should NOT trigger" phrases I could name right now
```

### Step 5: Present and Continue

Share the draft with a brief note:

> “Here’s a draft `SKILL.md` for the [X] workflow we just ran.
> You can upload this via Claude.ai > Settings > Capabilities > Skills.
> Want me to refine it, or should we move on?”

Then continue with the original project task without waiting.

-----

## Part 5: End-of-Session Skill Harvest

At the end of every project session, run this review unprompted.

### Harvest Prompt (say this to yourself)

> “What did we do today that was repeatable, multi-step, or tool-dependent?
> Which of those workflows would save meaningful time if they ran automatically next time?”

### Harvest Output Format

For each candidate identified, produce:

```markdown
## Skill Candidate: [descriptive name]

**Pattern:** [Sequential / Multi-MCP / Iterative / Context-Aware / Domain Intelligence]
**Trigger:** What the user said or did that started this workflow
**Steps:** Brief numbered list of what happened
**Tools used:** List of MCPs, scripts, or APIs called
**Reuse likelihood:** High / Medium / Low
**Draft ready:** Yes / Needs input on [specific gap]
```

Then ask: “Want me to turn any of these into full `SKILL.md` files?”

-----

## Part 6: Layered Context Reference

Use this to decide how much of the full Skills guide to load at any moment.

|Situation                             |What to load                                      |
|--------------------------------------|--------------------------------------------------|
|Normal project work                   |This document only                                |
|Drafting a new SKILL.md               |Part 2 + Part 3 of this document                  |
|Description isn’t triggering correctly|Troubleshooting: under-triggering (see below)     |
|Skill loads for wrong tasks           |Troubleshooting: over-triggering (see below)      |
|MCP calls failing inside a skill      |Troubleshooting: MCP connection issues (see below)|
|Building for distribution/team use    |Load full guide, Chapter 4                        |

-----

## Part 7: Quick Troubleshooting

### Skill won’t upload

- `SKILL.md` must be spelled exactly — case-sensitive
- YAML must have `---` delimiters above and below frontmatter
- No XML characters (`<`, `>`) anywhere in the file
- Name must be kebab-case with no capitals or spaces

### Skill never triggers automatically

Rewrite the description. Ask yourself:

- Does it include phrases users actually say?
- Is it specific to a task (not just a domain)?
- Does it mention file types if relevant?

Debug by asking Claude: *“When would you use the [skill name] skill?”*
It will quote the description back. Adjust based on what’s missing.

### Skill triggers too often

Add explicit negative triggers to the description:

```yaml
description: ... Do NOT use for [adjacent thing] — use [other skill] instead.
```

### Instructions not being followed

- Move critical rules to the top of SKILL.md
- Use `**CRITICAL:**` headers for must-follow rules
- Keep instructions concise — move reference detail to `references/` subfolder
- Consider a validation script in `scripts/` for deterministic checks

### Skill feels slow or degrades responses

- Keep SKILL.md under 5,000 words
- Move detailed docs to `references/` and link to them
- Avoid enabling more than 20–50 skills simultaneously

-----

## Part 8: SKILL.md Quick-Build Template

Copy this when drafting a new skill from scratch.

```markdown
---
name: [skill-name-in-kebab-case]
description: [What it does]. Use when user [trigger phrases — be specific].
metadata:
  author: [your name or team]
  version: 1.0.0
---

# [Skill Display Name]

## When to Use This Skill
[1-2 sentences on the ideal use case and who it's for]

## Instructions

### Step 1: [Name]
[Specific action. What tool to call, what to check, what output to expect.]

### Step 2: [Name]
[Continue...]

### Step 3: [Name]
[Continue...]

## Examples

### Example 1: [Common scenario title]
**User says:** "[example prompt]"
**Actions:**
1. [Step taken]
2. [Step taken]
**Result:** [What the user gets]

## Error Handling

**Error:** [Common failure]
**Cause:** [Why it happens]
**Solution:** [How to fix it]

## Quality Checklist
Before delivering output, verify:
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]
```

-----

*This document is a standing agent context file. It does not need to be re-explained each session —
load it at the start and operate from it throughout. Update it as new patterns emerge.*