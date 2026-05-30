
## Product Vision
The easiest way for agencies, freelancers, and creative teams to deliver files, collect feedback, manage revisions, and know exactly what clients did

Build a modern collaborative file workspace focused on:

- file delivery
- sharing
- versioning
- collaboration
- tracking

> NOT generic project management.

The product should feel:

- lightweight
- fast
- calm
- professional
- frictionless

## Core positioning

> “Organize, share, track, and collaborate on files beautifully.”

---

## Product Category

Position between:

- [WeTransfer](https://wetransfer.com?utm_source=chatgpt.com)
- [Dropbox](https://www.dropbox.com?utm_source=chatgpt.com)
- [DocSend](https://www.docsend.com?utm_source=chatgpt.com)
- [Frame.io](https://frame.io?utm_source=chatgpt.com)

But:

- simpler
- lighter
- more collaboration-focused
- less enterprise-heavy

---

## Core Product Principles

1. File-Centric

Everything revolves around files and shares.

NOT tasks/docs/kanban.

---

2. Fast UX

Upload → Share → Collaborate within seconds.

---

3. Minimal Cognitive Load

Very shallow hierarchy.

Avoid complexity.

---

4. Trust & Reliability

Critical for file products.

Users must trust:

- uploads
- storage
- billing
- downloads

---

5. Calm Professional UI

Modern utility SaaS aesthetic.

---

## Product Hierarchy

### Account

Identity/authentication layer.

Contains:

- owned workspaces
- invited workspaces
- personal settings

### Workspace

Collaborative + billing container.

Contains:

- members
- shares
- storage quota
- billing
- branding

Examples:

- Personal
- Acme Agency
- Nike Team

### Share (CORE OBJECT)

Primary workflow entity.

A Share contains:

- files
- versions
- public/private links
- analytics
- collaboration activity

Examples:

- “Homepage Assets”
- “Campaign Deliverables”
- “Logo Package”

### Files

Actual uploaded assets.

Capabilities:

- preview
- versioning
- metadata
- replacement

## Core User Flows

### Upload Flow

Workspace → Create Share → Upload Files → Generate Link → Share

Must feel:

- instant
- polished
- reliable

### Collaboration Flow

Invite members → Upload revisions → Track versions → Maintain same share link

### External Client Flow

Open share link → Preview/download → optionally upload reply files later

## Target Audience

### Primary

- freelancers
- agencies
- designers
- creators
- marketing teams

### Secondary

- startups
- internal teams
- lightweight asset collaboration

## MVP Scope

### Authentication

Features:

- email login
- magic link/OTP
- Google OAuth later

### Workspace System

Features:

- create workspace
- workspace switcher
- invite members
- member roles

Roles:

- owner
- admin
- member
- viewer

### Shares (MOST IMPORTANT)

Features:

- create share
- upload files
- generate share links
- public/private mode
- expiry settings
- password protection
- download toggle

### File Management

Features:

- drag/drop uploads
- previews
- rename/delete
- replace file
- file versions

### Versioning

Critical Feature

Users constantly resend:

- final_v2
- final_final
- updated_latest

Solve elegantly.

Features:

- upload replacement
- preserve same link
- version history
- rollback later maybe

### Analytics

Track:

- views
- downloads
- timestamps
- geography
- devices later

Premium value feature.

---

### Notifications

Events:

- file viewed
- file downloaded
- upload completed
- share expired
- version uploaded

---

### Billing & Plans

Billing Philosophy

Plans unlock:

- workflows
- collaboration
- premium features

Storage add-ons unlock:

- capacity

---

### Workspace-Based Billing

Subscription attached to workspace.

NOT user.

---

### Pricing Structure

#### Free

- 1 workspace
- 2 GB
- temporary shares
- limited uploads

#### Pro (~$12/mo)

- 100 GB included
- 3 members
- unlimited shares
- version history
- password protection
- analytics
- permanent shares

#### Team (~$39/mo)

- 1 TB included
- more members
- branding
- advanced collaboration

---

### Storage Add-ons

Example

+100 GB

+500 GB


Add-ons attach to existing subscription.


---

Billing Logic

Provider

[Paddle](https://www.paddle.com?utm_source=chatgpt.com)


---

Workspace Subscription States

free

active

past_due

restricted

canceled



---

Failed Payment Flow

Grace Period

7 days recommended.

During grace:

downloads continue

uploads maybe restricted



---

Restricted

uploads blocked

no new shares


Never instantly delete files.


---

Storage Strategy

Provider

[Cloudflare R2](https://developers.cloudflare.com/r2/?utm_source=chatgpt.com)

Reason:

zero egress fees

scalable

ideal for file products



---

Storage Protection Rules

Prevent Abuse

upload limits

bandwidth limits

rate limiting

signed URLs

expiry defaults



---

Suggested Limits

Free

2 GB

7-day expiry

limited bandwidth



---

Pro

100 GB

generous bandwidth



---

Technical Architecture

Frontend

Stack

React + Vite


Reason:

faster iteration

simpler architecture

dashboard-focused product



---

UI Stack

Tailwind CSS

shadcn/ui

TanStack Query

Zustand minimal state



---

Backend

Stack

NestJS


Reason:

scalable architecture

modular

good for queues/events/workspaces



---

Database

PostgreSQL

Reason:

relational collaboration model

strong consistency

scalable



---

Queue System

RabbitMQ

Use for:

thumbnail generation

analytics processing

notifications

cleanup jobs

version processing



---

File Processing

Workers handle:

image optimization

previews

metadata extraction

cleanup



---

Object Storage

Cloudflare R2

Use:

signed URLs

presigned uploads

direct upload flows



---

Infrastructure

Initial Deployment

frontend → Cloudflare Pages/Vercel

backend → VPS/Fly.io/Render

PostgreSQL managed

RabbitMQ managed/self-hosted



---

Recommended Architecture Principles

Async First

Heavy operations should never block API.


---

Event Driven

Uploads/analytics/notifications async.


---

Minimal Initial Complexity

Avoid:

microservices

Kubernetes

event sourcing insanity


Monolith + workers is enough.


---

Database High-Level Structure

User

Identity

Workspace

Collaboration + billing

WorkspaceMember

Membership + roles

Share

Core collaboration object

File

Assets

FileVersion

Version history

Subscription

Billing state

Usage

Storage/bandwidth metrics


---

Security

Critical

signed URLs

private object storage

rate limiting

upload validation

antivirus later maybe



---

UX Principles

Emotional Feel

Users should feel:

calm

fast

organized

professional



---

Visual Direction

Inspiration

[Linear](https://linear.app?utm_source=chatgpt.com)

[Dropbox](https://www.dropbox.com?utm_source=chatgpt.com)

[Raycast](https://www.raycast.com?utm_source=chatgpt.com)



---

Typography

Font

Inter


---

Color System

Primary Accent

Blue family.

Examples:

#2563EB

#3B82F6



---

Design Language

large whitespace

subtle borders

soft corners

minimal gradients

lightweight interactions



---

Features to Explicitly Avoid Initially

DO NOT BUILD:

kanban

tasks

docs/wiki

realtime editing

chat systems

complex ACLs

enterprise RBAC

AI gimmicks


Stay laser-focused.


---

Product Differentiation

NOT:

cloud storage

generic uploads


But:

collaborative file delivery workflows.

That is the strategic positioning.


---

Success Metrics

Product

repeated share creation

workspace retention

collaboration frequency

version usage



---

Business

free → pro conversion

workspace expansion

storage add-ons

team upgrades



---

MVP Success Criteria

If users:

repeatedly upload

maintain shares

collaborate through versions

return weekly


Then product has real workflow value.

That is the validation milestone.
