# Survey Data Model

<cite>
**Referenced Files in This Document**
- [survey.ts](file://packages/shared/src/types/survey.ts)
- [survey.schema.ts](file://packages/shared/src/schemas/survey.schema.ts)
- [question.ts](file://packages/shared/src/types/question.ts)
- [question.schema.ts](file://packages/shared/src/schemas/question.schema.ts)
- [response.ts](file://packages/shared/src/types/response.ts)
- [response.schema.ts](file://packages/shared/src/schemas/response.schema.ts)
- [assignment.schema.ts](file://packages/shared/src/schemas/assignment.schema.ts)
- [schema.ts](file://apps/api/src/db/schema.ts)
- [index.ts](file://apps/api/src/db/index.ts)
- [rbac.ts](file://apps/api/src/middleware/rbac.ts)
- [security.ts](file://apps/api/src/middleware/security.ts)
- [plan.md](file://plan.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive data model documentation for the survey system. It covers the Survey entity and its lifecycle, the SurveyWithDetails extension, Section and Question relationships, SurveyAssignment permissions, and the underlying database schema. It also documents validation rules, business constraints, and practical examples for creating surveys, updating statuses, and assigning permissions.

## Project Structure
The survey data model spans shared TypeScript types and Zod schemas, plus the database schema definition. The shared package defines the canonical types and validation rules, while the API database schema maps these types to PostgreSQL tables with foreign keys and indexes.

```mermaid
graph TB
subgraph "Shared Types and Schemas"
ST1["survey.ts"]
ST2["question.ts"]
ST3["response.ts"]
SS1["survey.schema.ts"]
SS2["question.schema.ts"]
SS3["response.schema.ts"]
SS4["assignment.schema.ts"]
end
subgraph "API Database Schema"
DB1["schema.ts"]
DB2["index.ts"]
end
ST1 --> DB1
ST2 --> DB1
ST3 --> DB1
SS1 --> DB1
SS2 --> DB1
SS3 --> DB1
SS4 --> DB1
DB2 --> DB1
```

**Diagram sources**
- [survey.ts:1-50](file://packages/shared/src/types/survey.ts#L1-L50)
- [question.ts:1-66](file://packages/shared/src/types/question.ts#L1-L66)
- [response.ts:1-53](file://packages/shared/src/types/response.ts#L1-L53)
- [survey.schema.ts:1-22](file://packages/shared/src/schemas/survey.schema.ts#L1-L22)
- [question.schema.ts:1-65](file://packages/shared/src/schemas/question.schema.ts#L1-L65)
- [response.schema.ts:1-24](file://packages/shared/src/schemas/response.schema.ts#L1-L24)
- [assignment.schema.ts:1-20](file://packages/shared/src/schemas/assignment.schema.ts#L1-L20)
- [schema.ts:1-247](file://apps/api/src/db/schema.ts#L1-L247)
- [index.ts:1-9](file://apps/api/src/db/index.ts#L1-L9)

**Section sources**
- [survey.ts:1-50](file://packages/shared/src/types/survey.ts#L1-L50)
- [survey.schema.ts:1-22](file://packages/shared/src/schemas/survey.schema.ts#L1-L22)
- [question.ts:1-66](file://packages/shared/src/types/question.ts#L1-L66)
- [question.schema.ts:1-65](file://packages/shared/src/schemas/question.schema.ts#L1-L65)
- [response.ts:1-53](file://packages/shared/src/types/response.ts#L1-L53)
- [response.schema.ts:1-24](file://packages/shared/src/schemas/response.schema.ts#L1-L24)
- [assignment.schema.ts:1-20](file://packages/shared/src/schemas/assignment.schema.ts#L1-L20)
- [schema.ts:1-247](file://apps/api/src/db/schema.ts#L1-L247)
- [index.ts:1-9](file://apps/api/src/db/index.ts#L1-L9)

## Core Components
This section documents the primary data structures and their relationships.

- Survey
  - Fields: id, title, description, status, createdBy, publishedAt, closesAt, createdAt, updatedAt
  - Status lifecycle: draft → published → closed
  - Validation rules: title length limits, optional description, optional closesAt datetime
  - Business constraints: status defaults to draft; publishedAt set when status becomes published; closesAt controls expiration

- SurveyWithDetails
  - Extends Survey with sections and responseCount
  - Sections: ordered collection of SectionWithQuestions
  - responseCount: computed metric for analytics

- Section and SectionWithQuestions
  - Section: id, surveyId, title, description, orderIndex, createdAt
  - SectionWithQuestions: includes questions array of QuestionWithOptions

- Question and QuestionWithOptions
  - Question: id, sectionId, questionType, title, description, isRequired, orderIndex, scaleMin/max, scaleMinLabel/maxLabel, createdAt
  - QuestionWithOptions: includes options array of QuestionOption

- Response and AnswerValue
  - Response: id, surveyId, userId, submittedAt, ipAddress, userAgent
  - AnswerValue: links responses to questions/options/text/number/rank values

- SurveyAssignment
  - Role-based permissions: editor and viewer roles with canEdit, canView, canExport flags
  - Assignment metadata: assignedBy, assignedAt, optional user name/email

**Section sources**
- [survey.ts:3-49](file://packages/shared/src/types/survey.ts#L3-L49)
- [survey.schema.ts:3-17](file://packages/shared/src/schemas/survey.schema.ts#L3-L17)
- [question.ts:30-65](file://packages/shared/src/types/question.ts#L30-L65)
- [question.schema.ts:18-48](file://packages/shared/src/schemas/question.schema.ts#L18-L48)
- [response.ts:1-23](file://packages/shared/src/types/response.ts#L1-L23)
- [response.schema.ts:3-20](file://packages/shared/src/schemas/response.schema.ts#L3-L20)
- [assignment.schema.ts:3-16](file://packages/shared/src/schemas/assignment.schema.ts#L3-L16)

## Architecture Overview
The data model follows a normalized relational design with explicit foreign keys and indexes. The shared types and schemas define the contract, while the database schema enforces referential integrity and constraints.

```mermaid
erDiagram
USERS {
uuid id PK
string googleId UK
string email UK
string name
string avatarUrl
enum role
boolean isAdmin
timestamp createdAt
timestamp lastLogin
}
SURVEYS {
uuid id PK
string title
text description
enum status
uuid createdBy FK
timestamp publishedAt
timestamp closesAt
timestamp createdAt
timestamp updatedAt
}
SURVEY_ASSIGNMENTS {
uuid id PK
uuid surveyId FK
uuid userId FK
enum role
boolean canEdit
boolean canView
boolean canExport
uuid assignedBy FK
timestamp assignedAt
}
SECTIONS {
uuid id PK
uuid surveyId FK
string title
text description
int orderIndex
timestamp createdAt
}
QUESTIONS {
uuid id PK
uuid sectionId FK
enum questionType
string title
text description
boolean isRequired
int orderIndex
int scaleMin
int scaleMax
string scaleMinLabel
string scaleMaxLabel
timestamp createdAt
}
QUESTION_OPTIONS {
uuid id PK
uuid questionId FK
string label
int orderIndex
boolean isOther
}
RESPONSES {
uuid id PK
uuid surveyId FK
uuid userId FK
timestamp submittedAt
string ipAddress
string userAgent
string turnstileToken
}
ANSWER_VALUES {
uuid id PK
uuid responseId FK
uuid questionId FK
uuid optionId FK
text textValue
int numberValue
int rankValue
boolean isOtherText
}
USERS ||--o{ SURVEY_ASSIGNMENTS : "assigns"
USERS ||--o{ RESPONSES : "submits"
SURVEYS ||--o{ SECTIONS : "contains"
SECTIONS ||--o{ QUESTIONS : "contains"
QUESTIONS ||--o{ QUESTION_OPTIONS : "has"
SURVEYS ||--o{ RESPONSES : "receives"
RESPONSES ||--o{ ANSWER_VALUES : "produces"
QUESTION_OPTIONS ||--o{ ANSWER_VALUES : "linked to"
```

**Diagram sources**
- [schema.ts:41-222](file://apps/api/src/db/schema.ts#L41-L222)
- [survey.ts:5-49](file://packages/shared/src/types/survey.ts#L5-L49)
- [question.ts:30-65](file://packages/shared/src/types/question.ts#L30-L65)
- [response.ts:1-23](file://packages/shared/src/types/response.ts#L1-L23)

## Detailed Component Analysis

### Survey Lifecycle and Status Transitions
- Draft: Initial state; survey is editable and not visible to respondents
- Published: Survey becomes visible to respondents; publishedAt timestamp is set
- Closed: Survey ends; closesAt timestamp controls expiration; no new submissions accepted

```mermaid
stateDiagram-v2
[*] --> Draft
Draft --> Published : "publish"
Published --> Closed : "close"
Closed --> [*]
```

**Diagram sources**
- [survey.ts:3-15](file://packages/shared/src/types/survey.ts#L3-L15)
- [survey.schema.ts:15-17](file://packages/shared/src/schemas/survey.schema.ts#L15-L17)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

**Section sources**
- [survey.ts:3-15](file://packages/shared/src/types/survey.ts#L3-L15)
- [survey.schema.ts:15-17](file://packages/shared/src/schemas/survey.schema.ts#L15-L17)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

### Survey Creation and Validation
- Required fields: title
- Optional fields: description, closesAt
- Validation constraints: title min/max lengths, description max length, closesAt datetime nullable

```mermaid
flowchart TD
Start(["Create Survey Request"]) --> Validate["Validate Input"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Return Validation Error"]
Valid --> |Yes| Persist["Persist to DB"]
Persist --> SetDefaults["Set Defaults<br/>status=draft, createdAt/updatedAt"]
SetDefaults --> Success(["Survey Created"])
Error --> End(["End"])
Success --> End
```

**Diagram sources**
- [survey.schema.ts:3-7](file://packages/shared/src/schemas/survey.schema.ts#L3-L7)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

**Section sources**
- [survey.schema.ts:3-7](file://packages/shared/src/schemas/survey.schema.ts#L3-L7)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

### Survey Update and Status Management
- Update title/description/closesAt with optional fields
- Status update restricted to enum values: draft, published, closed

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "API"
participant DB as "Database"
Client->>API : "PATCH /surveys/ : id"
API->>API : "Validate update payload"
API->>DB : "UPDATE surveys SET ... WHERE id= : id"
DB-->>API : "OK"
API-->>Client : "Survey Updated"
Client->>API : "PATCH /surveys/ : id/status"
API->>API : "Validate status enum"
API->>DB : "UPDATE surveys SET status='published' WHERE id= : id"
DB-->>API : "OK"
API-->>Client : "Status Updated"
```

**Diagram sources**
- [survey.schema.ts:9-17](file://packages/shared/src/schemas/survey.schema.ts#L9-L17)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

**Section sources**
- [survey.schema.ts:9-17](file://packages/shared/src/schemas/survey.schema.ts#L9-L17)
- [schema.ts:57-69](file://apps/api/src/db/schema.ts#L57-L69)

### Section and Question Relationships
- Sections belong to a Survey via surveyId and are ordered by orderIndex
- Questions belong to a Section via sectionId and are ordered by orderIndex
- Options belong to Questions and support dynamic ordering

```mermaid
classDiagram
class Survey {
+string id
+string title
+string description
+string status
+string createdBy
+Date publishedAt
+Date closesAt
+Date createdAt
+Date updatedAt
}
class Section {
+string id
+string surveyId
+string title
+string description
+number orderIndex
+Date createdAt
}
class Question {
+string id
+string sectionId
+string questionType
+string title
+string description
+boolean isRequired
+number orderIndex
+number scaleMin
+number scaleMax
+string scaleMinLabel
+string scaleMaxLabel
+Date createdAt
}
class QuestionOption {
+string id
+string questionId
+string label
+number orderIndex
+boolean isOther
}
Survey "1" o-- "N" Section : "contains"
Section "1" o-- "N" Question : "contains"
Question "1" o-- "N" QuestionOption : "has"
```

**Diagram sources**
- [survey.ts:22-33](file://packages/shared/src/types/survey.ts#L22-L33)
- [question.ts:30-65](file://packages/shared/src/types/question.ts#L30-L65)
- [schema.ts:105-167](file://apps/api/src/db/schema.ts#L105-L167)

**Section sources**
- [survey.ts:22-33](file://packages/shared/src/types/survey.ts#L22-L33)
- [question.ts:30-65](file://packages/shared/src/types/question.ts#L30-L65)
- [schema.ts:105-167](file://apps/api/src/db/schema.ts#L105-L167)

### Response Submission and Answer Values
- Responses are unique per user per survey
- AnswerValues link responses to questions and options, supporting text, number, and rank values

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "API"
participant DB as "Database"
Client->>API : "POST /surveys/ : id/responses"
API->>API : "Security checks (timing, honeypot)"
API->>API : "Validate submitResponse payload"
API->>DB : "INSERT responses"
API->>DB : "INSERT answer_values"
DB-->>API : "OK"
API-->>Client : "Response Submitted"
```

**Diagram sources**
- [response.schema.ts:12-20](file://packages/shared/src/schemas/response.schema.ts#L12-L20)
- [security.ts:7-30](file://apps/api/src/middleware/security.ts#L7-L30)
- [schema.ts:173-222](file://apps/api/src/db/schema.ts#L173-L222)

**Section sources**
- [response.ts:1-23](file://packages/shared/src/types/response.ts#L1-L23)
- [response.schema.ts:12-20](file://packages/shared/src/schemas/response.schema.ts#L12-L20)
- [security.ts:7-30](file://apps/api/src/middleware/security.ts#L7-L30)
- [schema.ts:173-222](file://apps/api/src/db/schema.ts#L173-L222)

### SurveyAssignment Permissions
- Roles: editor, viewer
- Permissions: canEdit, canView, canExport
- Unique constraint: (surveyId, userId) prevents duplicate assignments
- AssignedBy links to users who granted permissions

```mermaid
flowchart TD
Assign["Assign Permission"] --> Validate["Validate role and flags"]
Validate --> Persist["Persist to survey_assignments"]
Persist --> Indexes["Indexes: survey_idx, user_idx"]
Indexes --> Success["Permission Assigned"]
```

**Diagram sources**
- [assignment.schema.ts:3-16](file://packages/shared/src/schemas/assignment.schema.ts#L3-L16)
- [schema.ts:75-99](file://apps/api/src/db/schema.ts#L75-L99)
- [rbac.ts:38-55](file://apps/api/src/middleware/rbac.ts#L38-L55)

**Section sources**
- [survey.ts:35-49](file://packages/shared/src/types/survey.ts#L35-L49)
- [assignment.schema.ts:3-16](file://packages/shared/src/schemas/assignment.schema.ts#L3-L16)
- [schema.ts:75-99](file://apps/api/src/db/schema.ts#L75-L99)
- [rbac.ts:38-55](file://apps/api/src/middleware/rbac.ts#L38-L55)

## Dependency Analysis
The following diagram shows how shared types and schemas depend on the database schema and vice versa.

```mermaid
graph LR
SharedTypes["Shared Types (survey.ts, question.ts, response.ts)"] --> DBSchema["Database Schema (schema.ts)"]
SharedSchemas["Shared Schemas (survey.schema.ts, question.schema.ts, response.schema.ts, assignment.schema.ts)"] --> DBSchema
DBIndex["DB Index (index.ts)"] --> DBSchema
RBAC["RBAC Middleware (rbac.ts)"] --> DBSchema
Security["Security Middleware (security.ts)"] --> DBSchema
```

**Diagram sources**
- [survey.ts:1-50](file://packages/shared/src/types/survey.ts#L1-L50)
- [question.ts:1-66](file://packages/shared/src/types/question.ts#L1-L66)
- [response.ts:1-53](file://packages/shared/src/types/response.ts#L1-L53)
- [survey.schema.ts:1-22](file://packages/shared/src/schemas/survey.schema.ts#L1-L22)
- [question.schema.ts:1-65](file://packages/shared/src/schemas/question.schema.ts#L1-L65)
- [response.schema.ts:1-24](file://packages/shared/src/schemas/response.schema.ts#L1-L24)
- [assignment.schema.ts:1-20](file://packages/shared/src/schemas/assignment.schema.ts#L1-L20)
- [schema.ts:1-247](file://apps/api/src/db/schema.ts#L1-L247)
- [index.ts:1-9](file://apps/api/src/db/index.ts#L1-L9)
- [rbac.ts:1-56](file://apps/api/src/middleware/rbac.ts#L1-L56)
- [security.ts:1-73](file://apps/api/src/middleware/security.ts#L1-L73)

**Section sources**
- [survey.ts:1-50](file://packages/shared/src/types/survey.ts#L1-L50)
- [question.ts:1-66](file://packages/shared/src/types/question.ts#L1-L66)
- [response.ts:1-53](file://packages/shared/src/types/response.ts#L1-L53)
- [survey.schema.ts:1-22](file://packages/shared/src/schemas/survey.schema.ts#L1-L22)
- [question.schema.ts:1-65](file://packages/shared/src/schemas/question.schema.ts#L1-L65)
- [response.schema.ts:1-24](file://packages/shared/src/schemas/response.schema.ts#L1-L24)
- [assignment.schema.ts:1-20](file://packages/shared/src/schemas/assignment.schema.ts#L1-L20)
- [schema.ts:1-247](file://apps/api/src/db/schema.ts#L1-L247)
- [index.ts:1-9](file://apps/api/src/db/index.ts#L1-L9)
- [rbac.ts:1-56](file://apps/api/src/middleware/rbac.ts#L1-L56)
- [security.ts:1-73](file://apps/api/src/middleware/security.ts#L1-L73)

## Performance Considerations
- Indexes on foreign keys and frequently queried columns improve join performance and reduce query times.
- Unique indexes prevent duplicate entries and maintain data integrity.
- Validation at the schema level reduces downstream errors and improves reliability.
- Consider partitioning or materialized views for large-scale analytics on responses and statistics.

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors on survey creation/update: Ensure title length constraints and optional fields meet requirements.
- Status update failures: Verify status value matches allowed enum values.
- Duplicate assignments: Unique index on (surveyId, userId) prevents duplicates; handle conflict gracefully.
- Response submission rejections: Check timing and honeypot middleware configurations; ensure formOpenedAt and honeypot fields are correctly handled.
- Permission denials: Confirm user has appropriate role and flags set in survey_assignments.

**Section sources**
- [survey.schema.ts:3-17](file://packages/shared/src/schemas/survey.schema.ts#L3-L17)
- [assignment.schema.ts:3-16](file://packages/shared/src/schemas/assignment.schema.ts#L3-L16)
- [response.schema.ts:12-20](file://packages/shared/src/schemas/response.schema.ts#L12-L20)
- [security.ts:7-30](file://apps/api/src/middleware/security.ts#L7-L30)
- [schema.ts:75-99](file://apps/api/src/db/schema.ts#L75-L99)

## Conclusion
The survey system’s data model is designed around clear entities and relationships, enforced by shared types and schemas and implemented in PostgreSQL with robust foreign keys and indexes. The model supports a complete lifecycle from creation to publishing and closing, with granular permission control and validated input handling. These foundations enable reliable survey administration, secure submissions, and accurate analytics.