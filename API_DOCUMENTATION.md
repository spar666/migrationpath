# MigrationPath - API Documentation

## Base URL

- Development: `http://localhost:3000/api/v1`
- Staging: `https://staging-api.example.com/api/v1`
- Production: `https://api.migrationpath.com/api/v1`

## Authentication

All API requests require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <token>
```

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "personaType": "skilled"
  }
}
```

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "personaType": "skilled"
}
```

#### POST /auth/password-reset/request
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/password-reset/confirm
Confirm password reset with token.

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "newpassword123"
}
```

### Occupations

#### GET /occupations/search
Search occupations.

**Query Parameters:**
- `query` (string, required): Search term
- `limit` (number, optional): Result limit (default: 20)
- `offset` (number, optional): Result offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "occ-1",
      "name": "Software Engineer",
      "anzsco_code": "261311",
      "points": 95,
      "visa_eligible": true,
      "state_nominated": ["NSW", "VIC"],
      "demand_level": "high",
      "processing_time_weeks": 12
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

#### GET /occupations/:id
Get occupation details.

**Response:**
```json
{
  "id": "occ-1",
  "name": "Software Engineer",
  "anzsco_code": "261311",
  "points": 95,
  "visa_eligible": true,
  "state_nominated": ["NSW", "VIC"],
  "demand_level": "high",
  "processing_time_weeks": 12
}
```

#### GET /occupations/state/:state
Get occupations by state.

**Response:**
```json
{
  "data": [
    // Occupation objects
  ],
  "total": 50
}
```

#### GET /occupations/demand/:level
Get occupations by demand level.

**Response:**
```json
{
  "data": [
    // Occupation objects
  ],
  "total": 45
}
```

## Rate Limiting

- Rate limit: 1000 requests per hour per user
- Rate limit header: `X-RateLimit-Remaining`
- When limit exceeded: `429 Too Many Requests`

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | User is not authenticated |
| FORBIDDEN | 403 | User does not have permission |
| SESSION_EXPIRED | 401 | Auth session has expired |
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| API_ERROR | 500 | Generic API error |
| NETWORK_ERROR | 0 | Network connectivity issue |
| RATE_LIMIT | 429 | Rate limit exceeded |

## Timeouts

- Default request timeout: 30 seconds
- Can be configured via `VITE_REQUEST_TIMEOUT` environment variable

## Retry Logic

- Failed requests (5xx errors and timeouts) are retried automatically
- Exponential backoff with max 3 retries (configurable via `VITE_MAX_RETRIES`)
- Rate limit (429) responses are retried with backoff
