import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("audience"), // admin, moderator, presenter, audience
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  allowQuestions: boolean("allow_questions").default(true).notNull(),
  allowAnonymous: boolean("allow_anonymous").default(true).notNull(),
  autoApprove: boolean("auto_approve").default(true).notNull(),
  showVoting: boolean("show_voting").default(true).notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  branding: jsonb("branding"), // { logo, primaryColor, etc. }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id),
  authorName: text("author_name"),
  text: text("text").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isAnswered: boolean("is_answered").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  isDisplayedInPresenter: boolean("is_displayed_in_presenter").default(false).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  type: text("type").notNull(), // multiple-choice, open-text, word-cloud, rating
  options: jsonb("options"), // array of poll options
  isActive: boolean("is_active").default(false).notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  showResults: boolean("show_results").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollResponses = pgTable("poll_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
  participantId: integer("participant_id").references(() => users.id),
  response: jsonb("response").notNull(), // response data based on poll type
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionVotes = pgTable("question_votes", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  participantId: integer("participant_id").references(() => users.id),
  voteType: text("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  name: text("name"),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedEvents: many(events),
  questions: many(questions),
  pollResponses: many(pollResponses),
  questionVotes: many(questionVotes),
  participations: many(participants),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  questions: many(questions),
  polls: many(polls),
  participants: many(participants),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  event: one(events, {
    fields: [questions.eventId],
    references: [events.id],
  }),
  author: one(users, {
    fields: [questions.authorId],
    references: [users.id],
  }),
  votes: many(questionVotes),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  event: one(events, {
    fields: [polls.eventId],
    references: [events.id],
  }),
  responses: many(pollResponses),
}));

export const pollResponsesRelations = relations(pollResponses, ({ one }) => ({
  poll: one(polls, {
    fields: [pollResponses.pollId],
    references: [polls.id],
  }),
  participant: one(users, {
    fields: [pollResponses.participantId],
    references: [users.id],
  }),
}));

export const questionVotesRelations = relations(questionVotes, ({ one }) => ({
  question: one(questions, {
    fields: [questionVotes.questionId],
    references: [questions.id],
  }),
  participant: one(users, {
    fields: [questionVotes.participantId],
    references: [users.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  event: one(events, {
    fields: [participants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  upvotes: true,
  downvotes: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
});

export const insertPollResponseSchema = createInsertSchema(pollResponses).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionVoteSchema = createInsertSchema(questionVotes).omit({
  id: true,
  createdAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export type InsertPollResponse = z.infer<typeof insertPollResponseSchema>;
export type PollResponse = typeof pollResponses.$inferSelect;

export type InsertQuestionVote = z.infer<typeof insertQuestionVoteSchema>;
export type QuestionVote = typeof questionVotes.$inferSelect;

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;
