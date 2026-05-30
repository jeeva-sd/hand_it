# PHASE 1 MVP MODULES

Only build what proves the core workflow.

---

## 1. Authentication & Accounts

Features:

- Email/password auth
- Google login
- Magic link login later
- User profile
- Session management
- Workspace switching

---

## 2. Workspaces

This is your CORE object.

A workspace contains:

- members
- projects
- files
- permissions
- billing

Features:

- Create workspace
- Workspace logo
- Workspace invite system

Roles:

- Owner
- Admin
- Member
- Viewer

- Remove members
- Transfer ownership
- Workspace settings

---

## 3. Projects

Projects organize workflows inside workspaces.

Examples:

- Client A
- Marketing Assets
- App Launch
- Videos

Features:

- Create project
- Project description
- Project members
- Pin projects
- Archive projects
- Search projects

---

## 4. Files

This is the heart.

Features:

- Upload files
- Drag & drop
- Large uploads
- Multiple file upload
- File previews
- File thumbnails
- Rename file
- Tags
- File notes/comments
- Favorite/star files

---

## 5. Versions (VERY IMPORTANT)

This is one of your strongest differentiators.

Features:

- Replace existing file
- Version history
- Restore old version
- Compare timestamps
- Version comments
- “Latest version” badge

Key UX principle:

- Link should stay same across versions.

This is your killer workflow feature.

---

## 6. Share Links

Your entry-level virality feature.

Features:

- Generate public link
- Expiration
- Password protection
- Download limit
- Email restriction
- Disable downloads
- Preview-only mode
- Branded share page
- Copy link instantly

---

## 7. Analytics

VERY important for perceived value.

Features:

- Views
- Downloads
- Countries
- Devices
- Activity timeline
- Last viewed
- Viewer count
- File engagement

---

## 8. Activity Feed

Makes product feel alive.

Features:

- Uploaded file
- Replaced version
- Viewed file
- Downloaded file
- Comment added
- Member joined
- Link created

---

## 9. Notifications

Features:

- File viewed
- Downloaded
- Mentioned
- Invite received
- Version updated

Delivery:

- in-app
- email

---

## 10. Comments & Collaboration

This pushes you beyond storage tools.

Features:

- File comments
- Mention users
- Comment on versions
- Resolve comments
- Activity threads

---

## 11. Search

Very important.

Features:

- Search files
- Search projects

Filter by:

- type
- uploader
- tags
- date

- Recent files

---

## 12. Billing

Workspace-based.

Plans:

### Free

- 2 GB
- small upload limit

### Pro

- 100 GB
- advanced analytics
- password links

### Team

- larger storage
- collaboration features
- audit logs later

Addons:

- extra storage blocks

---

## 13. Storage System

Using: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/?utm_source=chatgpt.com)


---

Features

- direct upload
- multipart upload
- signed URLs
- CDN delivery
- lifecycle cleanup
- deleted file cleanup jobs


---

## 14. Background Jobs

Use: [RabbitMQ](https://www.rabbitmq.com?utm_source=chatgpt.com)


---

Jobs

- thumbnail generation
- video processing
- cleanup expired files
- analytics aggregation
- email sending
- malware scanning later


---

## 15. Share Page System

VERY important for branding.


---

Share page contains

- file preview
- download button
- branding
- uploader info
- version info
- expiration
- analytics events


---

# PHASE 2 FEATURES

Do NOT build initially.

---

Collections

- Grouped assets.

---

Approval flows

- Approve/reject files.

---

File requests

- “Upload to this link.”

---

Integrations

- Slack
