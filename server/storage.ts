import { 
  users, events, questions, polls, pollResponses, questionVotes, participants,
  type User, type InsertUser, type Event, type InsertEvent, 
  type Question, type InsertQuestion, type Poll, type InsertPoll,
  type PollResponse, type InsertPollResponse, type QuestionVote, type InsertQuestionVote,
  type Participant, type InsertParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ne } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Events
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  getEventsByOrganizer(organizerId: number): Promise<Event[]>;
  getActiveEvents(): Promise<Event[]>;

  // Questions
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByEvent(eventId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined>;
  voteQuestion(vote: InsertQuestionVote): Promise<void>;
  removeQuestionVote(questionId: number, participantId: number): Promise<void>;

  // Polls
  getPoll(id: number): Promise<Poll | undefined>;
  getPollsByEvent(eventId: number): Promise<Poll[]>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: number, updates: Partial<Poll>): Promise<Poll | undefined>;
  getActivePollByEvent(eventId: number): Promise<Poll | undefined>;

  // Poll Responses
  createPollResponse(response: InsertPollResponse): Promise<PollResponse>;
  getPollResults(pollId: number): Promise<any>;

  // Participants
  getParticipant(id: number): Promise<Participant | undefined>;
  getEventParticipants(eventId: number): Promise<Participant[]>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipantActivity(id: number): Promise<void>;

  // Analytics
  getEventStats(eventId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async getEventsByOrganizer(organizerId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.organizerId, organizerId)).orderBy(desc(events.createdAt));
  }

  async getActiveEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isActive, true)).orderBy(desc(events.createdAt));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getQuestionsByEvent(eventId: number): Promise<Question[]> {
    return await db.select().from(questions)
      .where(and(eq(questions.eventId, eventId), eq(questions.isHidden, false)))
      .orderBy(desc(questions.isPinned), desc(questions.upvotes), desc(questions.createdAt));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined> {
    if (updates.isDisplayedInPresenter === true) {
      await db.update(questions)
        .set({ isDisplayedInPresenter: false })
        .where(and(eq(questions.eventId, (await this.getQuestion(id))!.eventId), ne(questions.id, id)));
    }
    const [question] = await db.update(questions).set(updates).where(eq(questions.id, id)).returning();
    return question || undefined;
  }

  async voteQuestion(vote: InsertQuestionVote): Promise<void> {
    // Remove existing vote if any
    await db.delete(questionVotes).where(
      and(eq(questionVotes.questionId, vote.questionId), eq(questionVotes.participantId, vote.participantId!))
    );

    // Add new vote
    await db.insert(questionVotes).values(vote);

    // Update question vote counts
    const upvoteCount = await db.select({ count: sql<number>`count(*)` })
      .from(questionVotes)
      .where(and(eq(questionVotes.questionId, vote.questionId), eq(questionVotes.voteType, 'upvote')));

    const downvoteCount = await db.select({ count: sql<number>`count(*)` })
      .from(questionVotes)
      .where(and(eq(questionVotes.questionId, vote.questionId), eq(questionVotes.voteType, 'downvote')));

    await db.update(questions).set({
      upvotes: upvoteCount[0]?.count || 0,
      downvotes: downvoteCount[0]?.count || 0,
    }).where(eq(questions.id, vote.questionId));
  }

  async removeQuestionVote(questionId: number, participantId: number): Promise<void> {
    await db.delete(questionVotes).where(
      and(eq(questionVotes.questionId, questionId), eq(questionVotes.participantId, participantId))
    );
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || undefined;
  }

  async getPollsByEvent(eventId: number): Promise<Poll[]> {
    return await db.select().from(polls).where(eq(polls.eventId, eventId)).orderBy(desc(polls.createdAt));
  }

  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const [poll] = await db.insert(polls).values(insertPoll).returning();
    return poll;
  }

  async updatePoll(id: number, updates: Partial<Poll>): Promise<Poll | undefined> {
    const [poll] = await db.update(polls).set(updates).where(eq(polls.id, id)).returning();
    return poll || undefined;
  }

  async getActivePollByEvent(eventId: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls)
      .where(and(eq(polls.eventId, eventId), eq(polls.isActive, true)))
      .orderBy(desc(polls.createdAt));
    return poll || undefined;
  }

  async createPollResponse(insertResponse: InsertPollResponse): Promise<PollResponse> {
    const [response] = await db.insert(pollResponses).values(insertResponse).returning();
    return response;
  }

  async getPollResults(pollId: number): Promise<any> {
    const responses = await db.select().from(pollResponses).where(eq(pollResponses.pollId, pollId));
    const poll = await this.getPoll(pollId);

    if (!poll) return null;

    const totalResponses = responses.length;
    const results: any = {
      pollId,
      question: poll.question,
      type: poll.type,
      totalResponses,
      results: {}
    };

    if (poll.type === 'multiple-choice') {
      const options = poll.options as string[];
      results.results = options.map(option => {
        const count = responses.filter(r => (r.response as any).option === option).length;
        return {
          option,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
        };
      });
    }

    return results;
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant || undefined;
  }

  async getEventParticipants(eventId: number): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.eventId, eventId)).orderBy(desc(participants.joinedAt));
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const [participant] = await db.insert(participants).values(insertParticipant).returning();
    return participant;
  }

  async updateParticipantActivity(id: number): Promise<void> {
    await db.update(participants).set({ lastActiveAt: new Date() }).where(eq(participants.id, id));
  }

  async getEventStats(eventId: number): Promise<any> {
    const participantCount = await db.select({ count: sql<number>`count(*)` })
      .from(participants)
      .where(eq(participants.eventId, eventId));

    const questionCount = await db.select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.eventId, eventId));

    const pollCount = await db.select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(eq(polls.eventId, eventId));

    return {
      participants: participantCount[0]?.count || 0,
      questions: questionCount[0]?.count || 0,
      polls: pollCount[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();