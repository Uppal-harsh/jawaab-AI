# INSTRUCTIONS.md

# Objective

Produce production-quality software.

Not AI-generated boilerplate.

Every output should look like it was written by a senior startup engineer.

---

# Before Writing Code

Always think through:

1. Is this required?

2. Is there a simpler solution?

3. Does this already exist?

4. Can fewer files accomplish the same result?

Only then generate code.

---

# Never Assume

Never invent:

database schemas

API endpoints

business logic

environment variables

package names

SDK functions

library APIs

If unsure,

state the assumption.

---

# No AI Slop

Avoid generating:

placeholder components

fake dashboards

random statistics

example users

demo companies

dummy analytics

marketing filler

Lorem Ipsum

unused helper functions

unused utility files

unused hooks

unused services

unused contexts

unused stores

unused abstractions

Every file should have a purpose.

---

# Keep Folder Count Low

Do not create folders because "large projects usually have them."

Every folder must have a clear reason.

---

# Keep File Count Low

Prefer

3 meaningful files

instead of

15 tiny files.

---

# Component Rules

Every component should:

have one responsibility

be reusable only when naturally appropriate

avoid unnecessary props

avoid prop drilling where simple composition works

---

# Backend Rules

Keep APIs RESTful.

Validate inputs.

Return consistent responses.

Fail gracefully.

Never swallow errors.

---

# Database Rules

Every table must justify its existence.

Every index must have a reason.

Every relationship must be useful.

Do not normalize for hypothetical scale.

---

# Performance

Avoid:

premature optimization

memoization everywhere

complex caching

Only optimize where necessary.

---

# Styling

Use Tailwind.

Avoid excessive custom CSS.

Maintain consistent spacing.

Prefer whitespace over decoration.

---

# Animations

Use Anime.js intentionally.

Animation should communicate.

Not entertain.

No bouncing.

No spinning.

No unnecessary parallax.

---

# Accessibility

Always include:

keyboard navigation

focus states

semantic HTML

ARIA where necessary

color contrast

---

# Naming

Prefer descriptive names.

Good:

BusinessSettings

IncomingCall

CallSummary

Bad:

Manager

Helper

Thing

Data

Utils2

---

# Comments

Comment WHY.

Not WHAT.

Avoid obvious comments.

---

# Refactoring

Before creating a new abstraction,

ask:

Has this logic actually been repeated?

If not,

do not abstract it.

---

# Libraries

Never introduce a dependency if native JavaScript or React can solve the problem cleanly.

---

# Error Handling

Errors should:

be logged

be understandable

never expose secrets

fail safely

---

# Final Review

Before completing any task,

review:

- unnecessary code

- duplicated logic

- unused imports

- unused variables

- dead files

- dead components

- unnecessary abstractions

- unnecessary dependencies

Remove them.

---

# Guiding Principle

Always choose:

the simplest solution that is production-ready.

Do not write code to impress.

Write code that a solo founder can maintain six months from now.