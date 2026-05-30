Project
  ├── Files
  ├── Members
  ├── Activity
  └── Share Links


---


# Epic: File Versioning & Share Links

## Epic Goal

Enable users to safely update files without breaking shared links, maintain version history, restore previous versions, and share either the latest or a frozen snapshot of files.

---

# Business Value

### User Problems

Users currently:

* resend files repeatedly
* create confusing filenames

  * final.mp4
  * final_v2.mp4
  * final_final.mp4
* lose track of revisions
* accidentally share outdated assets
* need stable links for clients

### Success Outcome

Users can:

* replace files while keeping the same link
* access previous versions
* restore older versions
* create frozen delivery snapshots
* track version history

---

# Scope

## In Scope

### File Versioning

* automatic version creation
* version history
* current version tracking
* version metadata
* version comments
* restore version

### Share Links

* dynamic share links
* snapshot share links
* password protection
* expiry settings
* download permissions

### Activity Tracking

* version uploaded
* version restored
* snapshot created

---

## Out of Scope

* branching
* compare versions
* side-by-side diffing
* approval workflows
* comments on versions
* file annotations

---

# User Stories

---

## Story 1: Upload Initial File

### As a User

I want to upload a file

So that I can manage it within a project.

### Acceptance Criteria

* file is uploaded successfully
* File record created
* Version 1 automatically created
* Version 1 marked as current

---

## Story 2: Replace Existing File

### As a User

I want to replace an existing file

So that I can upload revisions without changing links.

### Acceptance Criteria

* user selects "Replace File"
* new file uploaded
* new version automatically created
* previous versions preserved
* latest version becomes current
* file share links remain unchanged

---

## Story 3: View Version History

### As a User

I want to see all previous versions

So that I can review project history.

### Acceptance Criteria

Version history displays:

* version number
* upload date
* uploaded by
* file size
* optional version note

Example:

```text
v5 (Current)
v4
v3
v2
v1
```

---

## Story 4: Add Version Notes

### As a User

I want to describe changes made in a version

So that teammates understand revisions.

### Acceptance Criteria

When replacing a file user can optionally enter:

```text
Added subtitles
Updated logo animation
Client feedback applied
```

Version note saved with version.

---

## Story 5: Download Previous Version

### As a User

I want to download an older version

So that I can recover historical assets.

### Acceptance Criteria

* any version can be downloaded
* current version unaffected

---

## Story 6: Restore Previous Version

### As a User

I want to restore an older version

So that I can revert unwanted changes.

### Acceptance Criteria

* restore action available
* restored version becomes current
* new version record created
* historical versions preserved

Example:

```text
v1
v2
v3
v4
v5

Restore v3

Result:

v1
v2
v3
v4
v5
v6 (Current)
```

---

# Dynamic Share Links

## Story 7: Create Dynamic Share Link

### As a User

I want to share project files

So that recipients always receive the latest versions.

### Acceptance Criteria

* share link created
* link references project files
* link automatically shows current versions

Example:

```text
intro.mp4 → v5
logo.ai → v3
```

After replacement:

```text
intro.mp4 → v6
logo.ai → v4
```

Same URL remains valid.

---

## Story 8: Configure Dynamic Link

### As a User

I want to control access

So that shared content is secure.

### Acceptance Criteria

Link settings:

* public/private
* password protection
* expiry date
* allow downloads
* disable downloads

---

# Snapshot Share Links

## Story 9: Create Snapshot Link

### As a User

I want to freeze a delivery

So that future updates do not affect what clients received.

### Acceptance Criteria

Snapshot captures exact versions.

Example:

```text
intro.mp4 → v3
logo.ai → v2
```

Future uploads do not modify snapshot contents.

---

## Story 10: Share Historical Version

### As a User

I want to create a share link from an older version

So that clients can access a previous revision.

### Acceptance Criteria

* user selects version
* create snapshot link
* link references selected version

---

# Activity Tracking

## Story 11: Version Upload Activity

### Acceptance Criteria

Activity feed records:

```text
John uploaded intro.mp4 v4
```

---

## Story 12: Version Restore Activity

### Acceptance Criteria

Activity feed records:

```text
Sarah restored intro.mp4 from v2
```

---

## Story 13: Snapshot Creation Activity

### Acceptance Criteria

Activity feed records:

```text
John created Final Delivery Snapshot
```

---

# Technical Requirements

## File

```text
File
- id
- projectId
- name
- currentVersionId
- createdBy
- createdAt
```

---

## File Version

```text
FileVersion
- id
- fileId
- versionNumber
- storageKey
- size
- mimeType
- note
- uploadedBy
- createdAt
```

---

## Share Link

```text
ShareLink
- id
- projectId
- type
- name
- slug
- password
- expiresAt
- allowDownload
```

Types:

```text
DYNAMIC
SNAPSHOT
```

---

## Snapshot Mapping

```text
ShareLinkVersion
- shareLinkId
- fileId
- fileVersionId
```

Only used for snapshot links.

---

# Definition of Done

* File replacement creates versions automatically
* Version history available
* Version restore available
* Dynamic share links supported
* Snapshot share links supported
* Password protection supported
* Expiry supported
* Activity tracking implemented
* Automated tests completed
* API documented
