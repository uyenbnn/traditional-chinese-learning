## Plan: Traditional Chinese Learning MVP

Build a web platform with two roles (learner/admin) where each lesson contains vocabulary, grammar, and tests. Use a single full-stack web app (Next.js + Supabase) to ship quickly, with a template-driven admin workflow (YAML frontmatter + Markdown body) that validates uploaded files and generates lesson content. Scope is a clean, modern, mobile-first MVP for one admin and public learner access.

**Steps**
1. Finalize product specification and UX blueprint. Document lesson structure contract (every lesson must include vocab, grammar, test), Traditional-only language scope, public access policy, and required test types (multiple choice, fill blank, matching, listening).
2. Define content template contract and validation rules. Specify YAML frontmatter schema per category (vocab/grammar/test), Markdown body conventions, parsing rules, and strict validation/error messages for admin uploads.
3. Design database and authorization model. Create schema for users, roles, lessons, lesson sections/content blocks, questions, answer keys, media assets, learner progress, and submissions; define role-based access so only admin can create/update/publish lessons.
4. Design admin authoring flow. Plan admin screens for template upload/edit, parse preview, validation feedback, publish/unpublish, and lesson version handling so updates do not corrupt learner history.
5. Design learner experience flow. Plan lesson list/discovery, lesson detail with section navigation (vocab/grammar/test), responsive study components, listening question player, submission flow, and results review.
6. Define technical architecture and project setup sequence. Choose Next.js app router structure, Supabase services, storage strategy for audio/template files, API boundaries, and deployment baseline.
7. Implement in phased delivery (execution handoff):
   - Phase 1 (Foundation): project bootstrap, auth, role guardrails, core schema.
   - Phase 2 (Template engine): upload endpoint, parser, validator, content normalization.
   - Phase 3 (Admin): template/lesson management UI + preview/publish.
   - Phase 4 (Learner): lessons browsing and section rendering.
   - Phase 5 (Assessment): all four question types, scoring, attempt tracking, results.
   - Phase 6 (Polish): responsive UI refinement, accessibility, error/loading states, analytics hooks.
8. Execute verification and acceptance testing at each phase.

**Relevant files**
- Planned (to create): app router pages for learner and admin experiences (public lessons, lesson detail, test flow, admin lesson/template management).
- Planned (to create): lib/template parser and schema validators for YAML+Markdown ingestion.
- Planned (to create): database migrations/schema files for lessons, section content, questions, submissions, and progress.
- Planned (to create): API route handlers/server actions for upload, validation, publish, fetch lessons, submit tests.
- Planned (to create): shared UI components for responsive lesson sections and test widgets.

**Verification**
1. Template validation tests: reject malformed YAML, missing required fields, invalid test definitions, and broken listening media references.
2. Admin flow tests: upload valid template -> preview -> publish -> lesson appears to learners with correct section composition.
3. Learner flow tests: browse lessons, complete vocab/grammar sections, take all supported test types, view scored results, retake.
4. Access control checks: non-admin cannot access admin endpoints; public users can view published lessons; learner submissions persist correctly.
5. Responsive and accessibility checks: mobile and desktop layouts, keyboard navigation, semantic labels, and color contrast.
6. Performance checks: lesson list and lesson detail load within target thresholds on mobile networks.

**Decisions**
- Tech stack: no preference from user; recommended plan uses Next.js + Supabase for fastest MVP delivery.
- Script scope: Traditional Chinese only for MVP.
- Template format: YAML + Markdown.
- Test scope: include multiple choice, fill blank, matching pairs, and listening/audio questions in MVP.
- Access model: all lessons public at launch.
- Admin scope: one admin initially (no multi-admin conflict resolution needed in MVP).

**Further Considerations**
1. Listening source strategy should be decided before implementation start: Option A upload admin-provided audio files; Option B auto-generate TTS; Option C both with fallback.
2. Content versioning policy should be explicit: Option A immutable published snapshots (recommended); Option B in-place edits for simpler MVP but higher data consistency risk.
3. Post-MVP expansion can include Simplified support, spaced repetition, and private/paid lesson gating, but these are excluded from current MVP scope.
