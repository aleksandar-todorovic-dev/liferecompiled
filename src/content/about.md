# LifeRecompiled — About

**Growth requires structure — and structure requires discipline.**

LifeRecompiled is a portfolio-grade full-stack web app that started as a simple blog app and evolved into a small community-style platform for writing, discussion, feedback, and moderation.

It focuses on real product problems: reliable data integrity, permissions, UX polish, and deploy-ready infrastructure — not just “CRUD screens”.

It is not trying to compete with large social platforms.
It is a small, practical product — built step by step — and a proof of work.

---

## What you can do in the app

### Public browsing

Guests can explore the app without creating an account.

* Browse the feed with cursor pagination and stable ordering
* Sort posts by Newest, Oldest, or Trending
* Filter posts by category
* Open any post and read comments and reactions
* View public profiles and author information

Actions like commenting, saving, reacting, and reporting are gated with clear UX prompts.

### Auth and onboarding

The app includes a complete email/password auth flow.

* Register
* Login
* Forgot password
* Email verification before the app treats the user as fully active
* Protected dashboard routes for logged-in users

### Posts

Users can create and manage their own posts.

* Create posts with title, optional description, content, category, and tags
* Edit posts within a time-limited edit window
* Archive posts into read-only mode
* Soft delete posts to Trash with a restore window
* Permanently delete posts with cascade behavior when allowed

### Comments

The comment system is designed for real discussion, not just flat messages.

* Threaded comments with multi-level replies
* Comment likes
* “People who liked this” modal
* Author and admin delete permissions
* Mobile-first comments sheet on smaller screens

### Reactions and badges

Reactions are not just visual buttons. They are connected to backend-owned counts and badge rules.

* Idea
* Hot
* Powerup

Post badges, such as Trending, and user badges, such as Top Contributor, are driven by backend rules instead of client-side assumptions.

### Saved posts

Saved posts include extra UX and data-safety handling.

* Save and unsave posts
* Undo support when removing saved posts
* Ghost saved-post handling if the original post disappears
* Snapshot metadata such as “Updated since saved”

### Dashboard

The dashboard is the main private area for managing content and activity.

* My Posts: Active, Archived, and All filters
* Title search
* Pagination
* Saved posts with sorting, pagination, ghost handling, and Undo
* Stats with monthly posting activity and restore/delete ratio
* Trash with restore and permanent delete actions
* Admin moderation for reports and target navigation

### Profile and settings

Profiles are public-facing and connected to real app activity.

* Public profile page
* Highlights and top posts
* Name and bio editing
* Profile picture upload
* Cloudinary image handling

### Support and feedback

Logged-in users can access a structured Support & Feedback page from the avatar menu.

It supports bug reports, UX issues, feature requests, and other feedback, while also including useful debug context so reports are easier to understand and act on.

---

## Behind the scenes

LifeRecompiled is built around correctness, predictable UX, and deploy-ready engineering decisions.

### Data model

The main Firestore collections include:

* `posts` — content, category, tags, archived/deleted flags, reaction counts, badges
* `comments` — threaded discussion via `parentId` and `postId`
* `reactions` — deterministic per-user reaction documents
* `userStats` — authoritative server-managed aggregates
* `users` — profiles, roles, and public badge state
* `reports` — moderation targets

### Backend architecture

Reactions and badges are backend-owned and retry-safe through Cloud Functions v2.

The system uses:

* Idempotency markers based on event IDs
* Stale guards for create/delete race conditions
* Ledger pairing to prevent counter drift
* Scheduled expiry for time-based Trending behavior

Trending can be earned through reaction thresholds, but it can also expire over time.

Admin access is derived from `users/{uid}.role` and exposed to the UI through AuthContext.

`userStats` is treated as a server-owned source of truth. The client reads aggregate data, but does not write it directly.

### Environments and deployment

The project follows a clear environment and deployment discipline.

* Separate staging and production Firebase projects
* Firebase project aliases
* Separate frontend environment configs
* Environment files excluded from the repository
* Secrets managed outside the client
* Cloudinary used for image storage and cleanup flows
* Node 20 for the app
* Node 18 for Cloud Functions runtime

---

## Source

* [GitHub repository](https://github.com/cole92/liferecompiled)

---

## Roadmap

Next planned improvements include:

* Social login with Google or GitHub
* Stronger moderation workflows
* Review queue and moderation action log
* Tests and CI expansion
* More production-readiness polish
