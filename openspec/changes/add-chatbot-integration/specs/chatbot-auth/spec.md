# Chatbot Authentication

## ADDED Requirements

### Requirement: Verification Code Generation

The system SHALL generate a secure, random verification code when a logged-in user accesses the chatbot login page.

**Technical Specification:**
- Code format: 9-character alphanumeric (uppercase)
- Character set: A-Z, 2-9 (excludes 0, O, 1, I, L to avoid confusion)
- Generation: Use cryptographically secure random number generator (crypto.randomBytes)
- Storage: SHA-256 hash stored in Firestore at `users/{userId}/chatbotVerificationCodes/{codeId}`
- Expiration: 5 minutes from creation
- Single-use: Code must be deleted after successful validation
- Rate limiting: Maximum 5 codes per user per hour

#### Scenario: User generates verification code successfully

- **GIVEN** a user is logged in via Firebase Authentication
- **WHEN** the user navigates to `/chatbot-login`
- **THEN** the system generates a 9-character verification code
- **AND** displays it to the user with instructions to paste in Telegram
- **AND** stores a SHA-256 hash of the code in Firestore with 5-minute expiration

#### Scenario: Verification code generation rate limit exceeded

- **GIVEN** a user has generated 5 verification codes in the past hour
- **WHEN** the user attempts to generate another code
- **THEN** the system returns an error message
- **AND** displays "Too many verification codes generated. Please try again in X minutes."

#### Scenario: Verification code expires after 5 minutes

- **GIVEN** a verification code was generated 6 minutes ago
- **WHEN** the Telegram bot attempts to validate the code
- **THEN** the system rejects the code
- **AND** returns error "Verification code expired. Please generate a new code."

### Requirement: Session Token Generation

The system SHALL generate a 30-day JWT session token upon successful verification code validation.

**Technical Specification:**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: Stored in environment variable `JWT_SECRET` (minimum 256 bits)
- Expiration: 30 days from creation
- Payload includes: userId, type, platform, telegramUserId, createdAt, expiresAt, sessionId
- Session metadata stored in Firestore at `users/{userId}/chatbotSessions/{sessionId}`

#### Scenario: Valid verification code exchange for session token

- **GIVEN** a valid verification code that has not expired
- **WHEN** the Telegram bot sends the code to `POST /api/chatbot/auth/verify`
- **THEN** the system validates the code hash
- **AND** generates a JWT session token with 30-day expiration
- **AND** stores session metadata in Firestore
- **AND** deletes the verification code
- **AND** returns the session token and expiration timestamp

#### Scenario: Invalid verification code

- **GIVEN** an invalid or non-existent verification code
- **WHEN** the Telegram bot sends the code to `POST /api/chatbot/auth/verify`
- **THEN** the system returns 401 Unauthorized
- **AND** returns error "Invalid verification code"
- **AND** logs the failed authentication attempt

#### Scenario: Session token includes required claims

- **GIVEN** a valid verification code
- **WHEN** a session token is generated
- **THEN** the JWT payload includes userId
- **AND** includes sessionId for revocation support
- **AND** includes createdAt and expiresAt timestamps
- **AND** includes telegramUserId for audit trail
- **AND** includes type: "chatbot" to distinguish from other token types

### Requirement: Session Token Validation

The system SHALL validate session tokens on every API request to chatbot endpoints.

**Technical Specification:**
- Validation steps:
  1. Verify JWT signature using JWT_SECRET
  2. Check token expiration timestamp
  3. Verify session exists in Firestore and isActive: true
  4. Update lastUsedAt timestamp asynchronously
- Cache session validation for 5 minutes to reduce Firestore reads
- Return 401 Unauthorized if any validation step fails

#### Scenario: Valid session token allows API access

- **GIVEN** a valid session token in the Authorization header
- **WHEN** the Telegram bot makes a request to any `/api/chatbot/*` endpoint
- **THEN** the system validates the JWT signature
- **AND** verifies the session exists and is active in Firestore
- **AND** extracts the userId from the token
- **AND** proceeds with the API request
- **AND** updates the session's lastUsedAt timestamp

#### Scenario: Expired session token is rejected

- **GIVEN** a session token that expired 1 day ago
- **WHEN** the Telegram bot makes a request with the expired token
- **THEN** the system returns 401 Unauthorized
- **AND** returns error "Session token expired. Please re-authenticate."
- **AND** logs the authentication failure

#### Scenario: Revoked session token is rejected

- **GIVEN** a valid JWT token but the session was revoked (isActive: false)
- **WHEN** the Telegram bot makes a request with the token
- **THEN** the system returns 401 Unauthorized
- **AND** returns error "Session has been revoked. Please re-authenticate."

#### Scenario: Missing Authorization header

- **GIVEN** no Authorization header is provided
- **WHEN** the Telegram bot makes a request to `/api/chatbot/*`
- **THEN** the system returns 401 Unauthorized
- **AND** returns error "Authorization header missing"

### Requirement: Session Token Revocation

The system SHALL allow users to revoke chatbot session tokens from the web application.

**Technical Specification:**
- Endpoint: `DELETE /api/chatbot/auth/revoke`
- Supports revoking a specific session or all sessions
- Sets isActive: false in Firestore (soft delete)
- Immediate effect: next API request with revoked token will fail

#### Scenario: User revokes a specific session

- **GIVEN** a user is logged into the web application
- **WHEN** the user revokes a specific chatbot session from settings
- **THEN** the system sets isActive: false for that session in Firestore
- **AND** returns success message
- **AND** subsequent API requests with that token return 401 Unauthorized

#### Scenario: User revokes all chatbot sessions

- **GIVEN** a user has 3 active chatbot sessions
- **WHEN** the user chooses "Revoke all chatbot access" in settings
- **THEN** the system sets isActive: false for all sessions
- **AND** all Telegram bots using those tokens receive 401 on next request

#### Scenario: Revoked session requires re-authentication

- **GIVEN** a user's session was revoked
- **WHEN** the Telegram bot attempts to use the revoked token
- **THEN** the system returns 401 Unauthorized
- **AND** the bot prompts the user to re-authenticate via `/login`

### Requirement: Authentication Security

The system SHALL implement security measures to protect authentication endpoints from abuse.

**Technical Specification:**
- Rate limiting: 10 authentication attempts per hour per user
- Logging: All auth attempts (success and failure) with userId and Telegram user ID
- Never log verification codes or full tokens (last 4 characters only)
- HTTPS enforcement in production

#### Scenario: Authentication rate limit prevents brute force

- **GIVEN** a malicious actor attempts to validate codes
- **WHEN** 10 failed validation attempts occur within an hour
- **THEN** the system blocks further attempts
- **AND** returns 429 Too Many Requests
- **AND** includes Retry-After header with seconds until reset

#### Scenario: Successful authentication is logged

- **GIVEN** a verification code is successfully validated
- **WHEN** a session token is generated
- **THEN** the system logs userId, Telegram user ID, timestamp
- **AND** logs the session ID (not the full token)
- **AND** logs the event type "CHATBOT_AUTH_SUCCESS"

#### Scenario: Failed authentication is logged

- **GIVEN** an invalid verification code is submitted
- **WHEN** the validation fails
- **THEN** the system logs the attempt with timestamp
- **AND** logs the provided code (hashed)
- **AND** logs the event type "CHATBOT_AUTH_FAILURE"
- **AND** does not expose whether the code exists or is just expired
