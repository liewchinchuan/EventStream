import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertEventSchema, insertQuestionSchema, insertPollSchema, insertPollResponseSchema, insertQuestionVoteSchema, insertParticipantSchema } from "@shared/schema";
import { z } from "zod";

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  eventId?: number;
  participantId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const eventClients = new Map<number, Set<ExtendedWebSocket>>();

  wss.on('connection', (ws: ExtendedWebSocket, request) => {
    console.log('WebSocket connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_event') {
          ws.eventId = data.eventId;
          ws.userId = data.userId;
          ws.participantId = data.participantId;

          if (!eventClients.has(data.eventId)) {
            eventClients.set(data.eventId, new Set());
          }
          eventClients.get(data.eventId)?.add(ws);

          // Broadcast participant joined
          broadcastToEvent(data.eventId, {
            type: 'participant_joined',
            data: { participantId: data.participantId, userId: data.userId }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.eventId) {
        eventClients.get(ws.eventId)?.delete(ws);
        if (eventClients.get(ws.eventId)?.size === 0) {
          eventClients.delete(ws.eventId);
        }

        // Broadcast participant left
        if (ws.participantId) {
          broadcastToEvent(ws.eventId, {
            type: 'participant_left',
            data: { participantId: ws.participantId }
          });
        }
      }
    });
  });

  function broadcastToEvent(eventId: number, message: any) {
    const clients = eventClients.get(eventId);
    if (clients) {
      const messageString = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }

  // Events
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getActiveEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.get('/api/events/:identifier', async (req, res) => {
    try {
      const identifier = req.params.identifier;
      let event;
      
      // Check if identifier is numeric (ID) or string (slug)
      if (/^\d+$/.test(identifier)) {
        event = await storage.getEvent(parseInt(identifier));
      } else {
        event = await storage.getEventBySlug(identifier);
      }
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid event data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.patch('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updates = req.body;
      const event = await storage.updateEvent(eventId, updates);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      broadcastToEvent(eventId, { type: 'event_updated', data: event });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  // Questions
  app.get('/api/events/:eventId/questions', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const questions = await storage.getQuestionsByEvent(eventId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });

  app.post('/api/events/:eventId/questions', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const questionData = insertQuestionSchema.parse({ ...req.body, eventId });
      const question = await storage.createQuestion(questionData);
      
      broadcastToEvent(eventId, { type: 'new_question', data: question });
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid question data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create question' });
    }
  });

  app.patch('/api/questions/:id', async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const updates = req.body;
      const question = await storage.updateQuestion(questionId, updates);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Get the question to find eventId for broadcasting
      const fullQuestion = await storage.getQuestion(questionId);
      if (fullQuestion) {
        broadcastToEvent(fullQuestion.eventId, { type: 'question_updated', data: question });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update question' });
    }
  });

  app.post('/api/questions/:id/vote', async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const voteData = insertQuestionVoteSchema.parse({ ...req.body, questionId });
      
      await storage.voteQuestion(voteData);
      const question = await storage.getQuestion(questionId);
      
      if (question) {
        broadcastToEvent(question.eventId, { type: 'question_vote', data: question });
      }
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid vote data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to vote on question' });
    }
  });

  // Polls
  app.get('/api/events/:eventId/polls', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const polls = await storage.getPollsByEvent(eventId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch polls' });
    }
  });

  app.get('/api/events/:eventId/polls/active', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const poll = await storage.getActivePollByEvent(eventId);
      res.json(poll || null);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active poll' });
    }
  });

  app.post('/api/events/:eventId/polls', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const pollData = insertPollSchema.parse({ ...req.body, eventId });
      const poll = await storage.createPoll(pollData);
      
      broadcastToEvent(eventId, { type: 'new_poll', data: poll });
      res.json(poll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid poll data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create poll' });
    }
  });

  app.patch('/api/polls/:id', async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const updates = req.body;
      const poll = await storage.updatePoll(pollId, updates);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
      
      broadcastToEvent(poll.eventId, { type: 'poll_updated', data: poll });
      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update poll' });
    }
  });

  app.post('/api/polls/:id/responses', async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const responseData = insertPollResponseSchema.parse({ ...req.body, pollId });
      const response = await storage.createPollResponse(responseData);
      
      // Get updated poll results and broadcast
      const results = await storage.getPollResults(pollId);
      const poll = await storage.getPoll(pollId);
      
      if (poll) {
        broadcastToEvent(poll.eventId, { type: 'poll_response', data: { response, results } });
      }
      
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid response data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit poll response' });
    }
  });

  app.get('/api/polls/:id/results', async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch poll results' });
    }
  });

  // Participants
  app.get('/api/events/:eventId/participants', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const participants = await storage.getEventParticipants(eventId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch participants' });
    }
  });

  app.post('/api/events/:eventId/participants', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const participantData = insertParticipantSchema.parse({ ...req.body, eventId });
      const participant = await storage.createParticipant(participantData);
      
      broadcastToEvent(eventId, { type: 'participant_joined', data: participant });
      res.json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid participant data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to join event' });
    }
  });

  // Analytics
  app.get('/api/events/:eventId/stats', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const stats = await storage.getEventStats(eventId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event stats' });
    }
  });

  return httpServer;
}
