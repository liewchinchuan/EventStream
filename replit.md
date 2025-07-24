# Audience Engagement Platform

## Overview

This is a real-time audience engagement platform built with React, Express, and WebSockets. The application allows organizers to create interactive events where audience members can ask questions, participate in polls, and engage with presenters in real-time. The platform features a modern web interface with comprehensive admin controls and seamless real-time communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server responsibilities:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **Build Tool**: Vite for development and production builds
- **Real-time Communication**: WebSocket client for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live event updates
- **Database Provider**: Neon Database (serverless PostgreSQL)

## Key Components

### Database Layer
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Tables**: users, events, questions, polls, poll_responses, question_votes, participants
- **Migration System**: Drizzle Kit for schema migrations

### Authentication & Authorization
- **User Roles**: Admin/Organiser, Moderator, Presenter, Audience/Attendee
- **Session Management**: Cookie-based sessions with PostgreSQL storage
- **Authorization**: Role-based access control for different features

### Real-time Communication
- **WebSocket Server**: Custom WebSocket implementation on `/ws` endpoint
- **Event Rooms**: Participants join event-specific rooms for targeted updates
- **Message Types**: question updates, poll responses, participant activities
- **Connection Management**: Automatic cleanup on disconnect

### Frontend Components
- **Dashboard**: Event management and analytics overview
- **Event Management**: Create, configure, and manage events
- **Live Q&A**: Real-time question submission, voting, and moderation
- **Polling System**: Multiple poll types (multiple-choice, open-text, word-cloud, rating)
- **Audience View**: Public-facing interface for event participation

## Data Flow

1. **Event Creation**: Organizers create events with custom settings and branding
2. **Participant Join**: Audience members join via custom event URLs (slugs)
3. **Real-time Updates**: WebSocket connections enable live question/poll updates
4. **Question Flow**: Submit → Moderate → Display → Vote → Answer
5. **Poll Flow**: Create → Launch → Collect Responses → Display Results
6. **Analytics**: Track engagement metrics and participant activity

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, TanStack Query)
- Express.js for server framework
- Drizzle ORM with PostgreSQL driver
- WebSocket (ws) for real-time communication

### UI Dependencies
- Radix UI components for accessible UI primitives
- Tailwind CSS for styling and theming
- Lucide React for icons
- React Hook Form with Zod validation

### Database Dependencies
- @neondatabase/serverless for PostgreSQL connection
- connect-pg-simple for session storage
- Drizzle Kit for database migrations

### Development Dependencies
- Vite for build tooling and development server
- TypeScript for type safety
- PostCSS with Autoprefixer for CSS processing

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **API Server**: Express server with tsx for TypeScript execution
- **Database**: Development connection to Neon Database
- **WebSocket**: Integrated with development server

### Production Build
- **Frontend Build**: Vite builds static assets to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Environment Variables**: DATABASE_URL required for production

### Configuration Management
- **Database Config**: Drizzle configuration in `drizzle.config.ts`
- **Build Scripts**: Separate build processes for client and server
- **Path Aliases**: TypeScript path mapping for clean imports
- **Environment**: NODE_ENV-based configuration switching

The architecture emphasizes real-time capabilities, type safety, and modern web development practices while maintaining a clear separation of concerns between the presentation layer, business logic, and data persistence.