# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Chatbot Integration Setup

The project includes a chatbot integration feature with the following setup requirements:

1. Install the required dependencies:
   ```bash
   npm install jsonwebtoken @types/jsonwebtoken
   ```

2. Add the following environment variables to your `.env.local` file:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   CHATBOT_LOGIN_URL=http://localhost:3000/chatbot-login
   ```

3. The chatbot integration provides:
   - A login page at `/chatbot-login` for users to generate verification codes
   - API endpoints for authentication and task management
   - JWT-based authentication with 24-hour tokens
   - Rate limiting (100 requests per hour per user)

4. For more details on the API endpoints and integration process, see the [API Documentation](/src/features/chatbot-integration/docs/api-documentation.md).
