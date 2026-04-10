# EcoTrace API Documentation

Complete API reference for EcoTrace endpoints.

## Base URL

```
http://localhost:3000/api
```

## Public Endpoints

### Get All Questions

```http
GET /api/questions
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "id": "e1",
    "category": "energy",
    "icon": "⚡",
    "order": 1,
    "formula": "kWh × 0.82",
    "question": "Monthly electricity consumption (kWh)",
    "options": [
      {
        "emoji": "🔌",
        "label": "0–50 kWh",
        "weight": 41
      }
    ]
  }
]
```

---

### Save User Response

```http
POST /api/responses
Content-Type: application/json

{
  "userId": "user123",
  "userName": "John Doe",
  "empId": "EMP001",
  "dept": "Engineering",
  "answers": {
    "e1": 2,
    "e2": 1,
    ...
  },
  "answerLabels": {
    "e1": "100–200 kWh",
    "e2": "Sometimes",
    ...
  },
  "answerWeights": {
    "e1": 164,
    "e2": 15,
    ...
  },
  "earths": 2.8,
  "totalCO2": 392,
  "catData": {
    "energy": { "co2": 159, "pct": 41 },
    "transport": { "co2": 103, "pct": 26 },
    "food": { "co2": 90, "pct": 23 },
    "waste": { "co2": 40, "pct": 10 }
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Response saved successfully",
  "responseId": "507f1f77bcf86cd799439012",
  "response": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "user123",
    "userName": "John Doe",
    ...
  }
}
```

---

### Generate AI Report

```http
POST /api/ai/report
Content-Type: application/json
Authorization: Bearer <optional>

{
  "score": 2.8,
  "totalCO2": 392,
  "categories": {
    "energy": { "co2": 159, "pct": 41 },
    "transport": { "co2": 103, "pct": 26 },
    "food": { "co2": 90, "pct": 23 },
    "waste": { "co2": 40, "pct": 10 }
  },
  "answers": {
    "e1": "100–200 kWh",
    "e2": "Sometimes",
    ...
  }
}
```

**Response:**
```json
{
  "report": "Root Cause & Environmental Impact Analysis:\n\n-> Area: Energy\n   Root Cause: High electricity consumption without renewable sources...\n   Systemic Impact: Increased fossil fuel dependency and grid strain..."
}
```

---

## Admin Endpoints

**All admin endpoints require JWT token in Authorization header:**
```
Authorization: Bearer <your_jwt_token>
```

### Admin Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin"
}
```

**Usage:** Store token in localStorage, include in subsequent admin requests.

---

### Get All Responses (Admin Only)

```http
GET /api/admin/responses
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userName": "John Doe",
    "empId": "EMP001",
    "dept": "Engineering",
    "earths": 2.8,
    "totalCO2": 392,
    "catData": {...},
    "aiReport": "...",
    "createdAt": "2024-04-07T10:30:00Z",
    "updatedAt": "2024-04-07T10:30:00Z"
  }
]
```

---

### Delete Response (Admin Only)

```http
DELETE /api/admin/responses
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "id": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "message": "Response deleted"
}
```

---

### Create/Update Question (Admin Only)

```http
POST /api/admin/questions
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "id": "w16",
  "category": "waste",
  "icon": "🌱",
  "order": 28,
  "formula": "Custom waste factor",
  "question": "Your new question here?",
  "options": [
    {
      "emoji": "✅",
      "label": "Option 1",
      "weight": 5
    },
    {
      "emoji": "❌",
      "label": "Option 2",
      "weight": 15
    }
  ]
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "id": "w16",
  "category": "waste",
  ...
}
```

---

### Update Question

```http
PUT /api/admin/questions
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "id": "e1",
  "question": "Updated question text",
  "options": [...]
}
```

---

### Delete Question

```http
DELETE /api/admin/questions
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "id": "w16"
}
```

**Response:**
```json
{
  "message": "Question deleted"
}
```

---

### Get Settings (Admin Only)

```http
GET /api/admin/settings
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "formula": {
    "electricity": 0.82,
    "transport": 0.15,
    "food": 5,
    "threshold": 142
  },
  "llm_api_key": "sk_...",
  "llm_prompt": "You are an expert..."
}
```

---

### Update Settings (Admin Only)

```http
POST /api/admin/settings
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "key": "formula",
  "value": {
    "electricity": 0.82,
    "transport": 0.15,
    "food": 5,
    "threshold": 142
  },
  "updatedBy": "admin"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "key": "formula",
  "value": {...},
  "updatedBy": "admin",
  "createdAt": "2024-04-07T10:30:00Z",
  "updatedAt": "2024-04-07T10:30:00Z"
}
```

---

### Seed Database (One-Time Setup)

```http
POST /api/seed
```

**Response:**
```json
{
  "message": "Database seeded successfully",
  "questionsCount": 27,
  "adminCreated": true
}
```

**Note:** Only works if database is empty. Returns error if already seeded.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 405 Method Not Allowed
```json
{
  "error": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Authentication

### JWT Token Usage

1. **Login as Admin**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

2. **Save Token**
   - Store in localStorage
   - Include in subsequent requests

3. **Use Token in Requests**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/admin/responses
   ```

### Token Expiration
- Default: 7 days
- After expiration, login again to get new token

---

## Rate Limiting

Currently no rate limiting configured. For production:

```javascript
// Add to next request
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Data Models

### Question
```typescript
{
  id: string;              // e.g., "e1", "t1", "f1", "w1"
  category: "energy" | "transport" | "food" | "waste" | "custom";
  icon: string;            // Emoji icon
  order: number;           // Question sequence
  formula: string;         // Description of calculation
  question: string;        // Question text
  options: IOption[];      // Answer choices
  createdAt: Date;
  updatedAt: Date;
}
```

### Response
```typescript
{
  userId: string;
  userName: string;
  empId: string;
  dept: string;
  answers: Map<string, number>;        // Q ID -> option index
  answerLabels: Map<string, string>;   // Q ID -> selected text
  answerWeights: Map<string, number>;  // Q ID -> CO₂ weight
  earths: number;                      // Earth multiplier
  totalCO2: number;                    // Total kg CO₂/month
  catData: {
    energy: { co2: number; pct: number };
    transport: { co2: number; pct: number };
    food: { co2: number; pct: number };
    waste: { co2: number; pct: number };
  };
  aiReport?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Settings
```typescript
{
  key: string;             // "formula", "llm_api_key", "llm_prompt"
  value: any;              // Settings value
  updatedBy: string;       // User who updated
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Example Workflows

### Complete Assessment Flow

1. **Get Questions**
   ```bash
   GET /api/questions
   ```

2. **User Completes Quiz**
   - Collect answers from UI

3. **Save Response**
   ```bash
   POST /api/responses
   ```

4. **Generate AI Report** (Optional)
   ```bash
   POST /api/ai/report
   ```

5. **Download PDF**
   - Client-side using jsPDF

### Admin Dashboard Flow

1. **Login**
   ```bash
   POST /api/auth/login
   ```

2. **Get All Responses**
   ```bash
   GET /api/admin/responses
   (with JWT token)
   ```

3. **Delete Response** (Optional)
   ```bash
   DELETE /api/admin/responses
   ```

4. **Update Settings**
   ```bash
   POST /api/admin/settings
   ```

5. **Manage Questions**
   ```bash
   POST /api/admin/questions   # Create
   PUT /api/admin/questions    # Update
   DELETE /api/admin/questions # Delete
   ```

---

## Testing with cURL

### Test Public Endpoint
```bash
curl http://localhost:3000/api/questions
```

### Test Admin Endpoint
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/responses
```

---

## Webhook Integration (Future)

To add webhook support for external systems:

```javascript
// Example: Notify external system on response save
if (webhookUrl) {
  fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(response)
  });
}
```

---

## Pagination (Future Enhancement)

Add query parameters for large datasets:

```http
GET /api/admin/responses?page=1&limit=20&sort=-createdAt
```

---

## API Rate Limits (Recommended for Production)

```bash
# Per IP, per 15 minutes
GET/POST: 100 requests
DELETE: 50 requests
```

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** Production Ready
