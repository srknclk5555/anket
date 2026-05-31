import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


// ═══════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════

export const userRoleEnum = pgEnum("user_role", ["admin", "editor", "viewer", "user"]);
export const surveyStatusEnum = pgEnum("survey_status", ["draft", "published", "closed"]);
export const assignmentRoleEnum = pgEnum("assignment_role", ["editor", "viewer"]);
export const questionTypeEnum = pgEnum("question_type", [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "searchable_dropdown",
  "searchable_list",
  "linear_scale",
  "rating",
  "yes_no",
  "date",
  "number",
  "ranking",
  "matrix",
]);

// ═══════════════════════════════════════
// USERS
// ═══════════════════════════════════════

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: userRoleEnum("role").default("user").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
});

// ═══════════════════════════════════════
// CUSTOM LISTS (For Dropdowns/Autocomplete)
// ═══════════════════════════════════════

export const customLists = pgTable("custom_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customListItems = pgTable(
  "custom_list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => customLists.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 500 }).notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => ({
    listIdx: index("custom_list_items_list_idx").on(table.listId),
  })
);

// ═══════════════════════════════════════
// SURVEYS
// ═══════════════════════════════════════

export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: surveyStatusEnum("status").default("draft").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════
// SURVEY ASSIGNMENTS
// ═══════════════════════════════════════

export const surveyAssignments = pgTable(
  "survey_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: assignmentRoleEnum("role").notNull(),
    canEdit: boolean("can_edit").default(false).notNull(),
    canView: boolean("can_view").default(true).notNull(),
    canExport: boolean("can_export").default(false).notNull(),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueSurveyUser: uniqueIndex("unique_survey_user").on(table.surveyId, table.userId),
    surveyIdx: index("assignments_survey_idx").on(table.surveyId),
    userIdx: index("assignments_user_idx").on(table.userId),
  })
);

// ═══════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    surveyIdx: index("sections_survey_idx").on(table.surveyId),
  })
);

// ═══════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    questionType: questionTypeEnum("question_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    isRequired: boolean("is_required").default(true).notNull(),
    orderIndex: integer("order_index").notNull(),
    scaleMin: integer("scale_min"),
    scaleMax: integer("scale_max"),
    scaleMinLabel: varchar("scale_min_label", { length: 50 }),
    scaleMaxLabel: varchar("scale_max_label", { length: 50 }),
    customListId: uuid("custom_list_id").references(() => customLists.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sectionIdx: index("questions_section_idx").on(table.sectionId),
  })
);

// ═══════════════════════════════════════
// QUESTION OPTIONS
// ═══════════════════════════════════════

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 200 }).notNull(),
    orderIndex: integer("order_index").notNull(),
    isOther: boolean("is_other").default(false).notNull(),
  },
  (table) => ({
    questionIdx: index("options_question_idx").on(table.questionId),
  })
);

// ═══════════════════════════════════════
// RESPONSES (1 user = 1 response per survey)
// ═══════════════════════════════════════

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    turnstileToken: varchar("turnstile_token", { length: 500 }),
  },
  (table) => ({
    uniqueSurveyUserResponse: uniqueIndex("unique_survey_user_response").on(
      table.surveyId,
      table.userId
    ),
    surveyIdx: index("responses_survey_idx").on(table.surveyId),
    userIdx: index("responses_user_idx").on(table.userId),
  })
);

// ═══════════════════════════════════════
// ANSWER VALUES
// ═══════════════════════════════════════

export const answerValues = pgTable(
  "answer_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").references(() => questionOptions.id, { onDelete: "set null" }),
    textValue: text("text_value"),
    numberValue: integer("number_value"),
    rankValue: integer("rank_value"),
    isOtherText: boolean("is_other_text").default(false).notNull(),
  },
  (table) => ({
    responseIdx: index("answers_response_idx").on(table.responseId),
    questionIdx: index("answers_question_idx").on(table.questionId),
  })
);

// ═══════════════════════════════════════
// BETTER-AUTH: SESSION
// ═══════════════════════════════════════

export const sessions = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("session_token_idx").on(table.token),
    userIdx: index("session_user_idx").on(table.userId),
  })
);

// ═══════════════════════════════════════
// BETTER-AUTH: ACCOUNT (OAuth providers)
// ═══════════════════════════════════════

export const accounts = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: varchar("password", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountIdx: index("account_provider_account_idx").on(table.providerId, table.accountId),
    userIdx: index("account_user_idx").on(table.userId),
  })
);

// ═══════════════════════════════════════
// BETTER-AUTH: VERIFICATION
// ═══════════════════════════════════════

export const verifications = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════
// ADMIN ACTIVITY LOG
// ═══════════════════════════════════════

export const adminActivityLog = pgTable(
  "admin_activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: uuid("target_id"),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("activity_log_user_idx").on(table.userId),
    createdIdx: index("activity_log_created_idx").on(table.createdAt),
  })
);

// ═══════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
  surveys: many(surveys, { relationName: "surveys_created_by" }),
  assignments: many(surveyAssignments),
  responses: many(responses),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [surveys.createdBy],
    references: [users.id],
    relationName: "surveys_created_by",
  }),
  sections: many(sections),
  responses: many(responses),
  assignments: many(surveyAssignments),
}));

export const surveyAssignmentsRelations = relations(surveyAssignments, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyAssignments.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [surveyAssignments.userId],
    references: [users.id],
    relationName: "assignment_user",
  }),
  assignedBy: one(users, {
    fields: [surveyAssignments.assignedBy],
    references: [users.id],
    relationName: "assignment_assigned_by",
  }),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [sections.surveyId],
    references: [surveys.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  section: one(sections, {
    fields: [questions.sectionId],
    references: [sections.id],
  }),
  customList: one(customLists, {
    fields: [questions.customListId],
    references: [customLists.id],
  }),
  options: many(questionOptions),
  answers: many(answerValues),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
  answers: many(answerValues),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [responses.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [responses.userId],
    references: [users.id],
  }),
  answers: many(answerValues),
}));

export const answerValuesRelations = relations(answerValues, ({ one }) => ({
  response: one(responses, {
    fields: [answerValues.responseId],
    references: [responses.id],
  }),
  question: one(questions, {
    fields: [answerValues.questionId],
    references: [questions.id],
  }),
  option: one(questionOptions, {
    fields: [answerValues.optionId],
    references: [questionOptions.id],
  }),
}));

export const customListsRelations = relations(customLists, ({ many }) => ({
  items: many(customListItems),
  questions: many(questions),
}));

export const customListItemsRelations = relations(customListItems, ({ one }) => ({
  list: one(customLists, {
    fields: [customListItems.listId],
    references: [customLists.id],
  }),
}));


