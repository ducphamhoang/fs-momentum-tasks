# External Authentication Specification

## ADDED Requirements

### Requirement: OAuth 2.0 Authentication Flow
The system SHALL implement OAuth 2.0 authentication to securely access users' Google Tasks accounts.

#### Scenario: Initiate OAuth flow
- **WHEN** a user clicks "Connect Google Tasks"
- **THEN** the system SHALL redirect the user to Google's OAuth consent screen
- **AND** SHALL request the necessary scopes (tasks.readonly, tasks)
- **AND** SHALL include a state parameter to prevent CSRF attacks

#### Scenario: Handle OAuth callback
- **WHEN** Google redirects back to the application with an authorization code
- **THEN** the system SHALL validate the state parameter matches the original request
- **AND** SHALL exchange the authorization code for access and refresh tokens
- **AND** SHALL store the tokens securely in Firestore

#### Scenario: OAuth flow failure
- **WHEN** the user denies permission or the OAuth flow fails
- **THEN** the system SHALL redirect to the settings page
- **AND** SHALL display an error message explaining the failure
- **AND** SHALL not store any tokens

### Requirement: Secure Token Storage
The system SHALL securely store OAuth tokens to protect user credentials and enable long-term synchronization.

#### Scenario: Store tokens in Firestore
- **WHEN** OAuth tokens are obtained
- **THEN** the system SHALL create a document in the `user_tokens` collection
- **AND** SHALL store userId, provider ('google-tasks'), accessToken, refreshToken, expiresAt, scopes, and timestamps
- **AND** SHALL rely on Firestore's built-in encryption at rest

#### Scenario: Tokens are not exposed to client
- **WHEN** client-side code requests task data
- **THEN** the system SHALL not send OAuth tokens to the browser
- **AND** SHALL use server-side functions to make authenticated API calls

### Requirement: Access Token Refresh
The system SHALL automatically refresh expired access tokens using refresh tokens to maintain uninterrupted synchronization.

#### Scenario: Detect expired token
- **WHEN** an API call to Google Tasks returns a 401 Unauthorized error
- **THEN** the system SHALL check if the access token has expired
- **AND** SHALL attempt to refresh the token using the stored refresh token

#### Scenario: Refresh access token
- **WHEN** refreshing an expired access token
- **THEN** the system SHALL call Google's token endpoint with the refresh token
- **AND** SHALL update the user_tokens document with the new access token and expiry time
- **AND** SHALL retry the original API request with the new token

#### Scenario: Refresh token invalid or revoked
- **WHEN** the refresh token is invalid or revoked
- **THEN** the system SHALL mark the Google Tasks connection as disconnected
- **AND** SHALL notify the user via email or in-app notification
- **AND** SHALL prompt the user to re-authenticate

### Requirement: Token Revocation
The system SHALL allow users to disconnect their Google account and revoke access tokens.

#### Scenario: User disconnects Google account
- **WHEN** a user clicks "Disconnect Google Tasks" in settings
- **THEN** the system SHALL revoke the access token via Google's revocation endpoint
- **AND** SHALL delete the user_tokens document for that provider
- **AND** SHALL display a confirmation message

#### Scenario: Tasks remain after disconnection
- **WHEN** a user disconnects their Google account
- **THEN** the system SHALL retain the synced tasks in Firestore
- **AND** SHALL update the task source to 'local' to prevent future sync attempts
- **AND** SHALL inform the user that existing tasks are now local-only

### Requirement: OAuth Scope Management
The system SHALL request only the minimum necessary OAuth scopes required for task synchronization.

#### Scenario: Request appropriate scopes
- **WHEN** initiating the OAuth flow
- **THEN** the system SHALL request the `https://www.googleapis.com/auth/tasks` scope for full task access
- **AND** SHALL not request additional unnecessary scopes

#### Scenario: Handle insufficient scopes
- **WHEN** the user grants only partial scopes (e.g., read-only)
- **THEN** the system SHALL detect the granted scopes
- **AND** SHALL disable write operations (create, update, delete tasks)
- **AND** SHALL inform the user that only read synchronization is available

### Requirement: Multi-User Token Isolation
The system SHALL ensure that OAuth tokens are isolated per user and cannot be accessed by other users.

#### Scenario: Token access is user-specific
- **WHEN** fetching tokens for sync operations
- **THEN** the system SHALL query user_tokens where userId matches the authenticated user
- **AND** SHALL enforce Firestore security rules to prevent cross-user token access

#### Scenario: Admin cannot access user tokens
- **WHEN** even an admin user attempts to read another user's tokens
- **THEN** Firestore security rules SHALL deny the request
- **AND** SHALL log the unauthorized access attempt

### Requirement: OAuth Connection Status
The system SHALL display the current OAuth connection status to users in the settings interface.

#### Scenario: Display connected status
- **WHEN** a user has an active Google Tasks connection
- **THEN** the settings page SHALL show "Connected" status with the last sync timestamp
- **AND** SHALL display a "Disconnect" button

#### Scenario: Display disconnected status
- **WHEN** a user has not connected Google Tasks or has disconnected
- **THEN** the settings page SHALL show "Not Connected" status
- **AND** SHALL display a "Connect Google Tasks" button

#### Scenario: Display error status
- **WHEN** the OAuth tokens are invalid or expired and refresh failed
- **THEN** the settings page SHALL show "Connection Error" status
- **AND** SHALL display a "Reconnect" button with an error explanation

### Requirement: OAuth Security Best Practices
The system SHALL follow OAuth 2.0 security best practices to protect against common vulnerabilities.

#### Scenario: Use PKCE for authorization
- **WHEN** initiating the OAuth flow
- **THEN** the system SHALL generate a code verifier and code challenge (PKCE)
- **AND** SHALL include the code challenge in the authorization request
- **AND** SHALL validate the code verifier during token exchange

#### Scenario: Validate redirect URI
- **WHEN** handling the OAuth callback
- **THEN** the system SHALL verify that the redirect URI matches the registered callback URL
- **AND** SHALL reject requests with mismatched redirect URIs

#### Scenario: Short-lived state tokens
- **WHEN** generating the OAuth state parameter
- **THEN** the system SHALL create a unique, cryptographically random state value
- **AND** SHALL store the state with a short TTL (5 minutes)
- **AND** SHALL validate and consume the state parameter once used
