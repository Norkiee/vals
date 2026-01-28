# Option 3: Hybrid Email + Admin Link Tracking Spec

## Overview
No required authentication. Creators optionally provide email for notifications, but always get a unique admin link to track responses. Recipients can respond without any account or email.

---

## Database Schema

### valentines table (Updated)
```sql
CREATE TABLE valentines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  admin_token VARCHAR(255) UNIQUE NOT NULL, -- Auto-generated, for tracking
  creator_email VARCHAR(255), -- Optional
  creator_name VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  message TEXT,
  spotify_link VARCHAR(500),
  spotify_rotation INT DEFAULT 0,
  theme VARCHAR(50) DEFAULT 'pink',
  photo_style VARCHAR(50) DEFAULT 'polaroid',
  font_family VARCHAR(255) DEFAULT 'default',
  canvas_layout JSON, -- Stores canvas element positions/rotations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### valentine_responses table (Unchanged)
```sql
CREATE TABLE valentine_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valentine_id UUID NOT NULL REFERENCES valentines(id) ON DELETE CASCADE,
  response BOOLEAN, -- true for yes, false for no
  responded_at TIMESTAMP DEFAULT NOW()
);
```

### No separate photos table needed for now, store in canvas_layout JSON

---

## Form Updates

### Create Page (`/create`)

**Add to form (after message section):**

```
Optional: Get notified
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email (optional)
[text input - email@example.com]

☑ Notify me when they respond

Tip: We'll send you one email when 
they respond. We won't spam you.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Field specifications:**
- Email input: Optional, email validation
- Checkbox: "Notify me when they respond" (checked by default if email filled)
- Help text: Brief explanation
- No password field needed

---

## Success Screen (After Creation)

**Route:** `/created/[admin_token]`

```
╔═══════════════════════════════════╗
║  ✅ Your valentine is live!       ║
╚═══════════════════════════════════╝

📤 Share this link:
┌─────────────────────────────────┐
│ sarah.admire.com                │ [Copy]
└─────────────────────────────────┘
[Facebook] [Twitter] [WhatsApp] [Copy]

📊 Track responses:
┌─────────────────────────────────┐
│ admire.com/admin/xyz123...      │ [Copy]
│                                 │
│ 🔒 Keep this private & safe!    │
└─────────────────────────────────┘

✉️ Notification status:
  [✓] Notified to: user@example.com
  
  Uncheck to stop receiving emails:
  [☑ Send me email notifications]

[← Back to Home] [Create Another]
```

**Elements:**
- Headline: Confirmation
- Shareable link (big, easy to copy)
- Social share buttons (pre-filled captions)
- Admin link (unique token, tell them to save it)
- Email notification toggle (can disable)
- Actions: Create another, back home

---

## Admin Link Flow

### Admin Page (`/admin/[admin_token]`)

**No login required** - Just visit the link

**Desktop View:**
```
╔════════════════════════════════════════╗
║  admire.com/admin/abc123xyz456        ║
╚════════════════════════════════════════╝

Your Valentine to Sarah
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: Feb 10, 2025
Shared: Feb 10, 2025 at 2:34pm
Status: Awaiting response...

Responses: (0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Analytics:
  Views: 5
  Clicked: 2
  Responded: 0
  Response rate: 0%

Share links:
  [sarah.admire.com] [Copy] [Share]

Settings:
  Email: user@example.com [Edit]
  [☑ Notify on response]
  
[🔄 Refresh] [📧 Resend link] [🗑 Delete]
```

**After Response:**
```
Your Valentine to Sarah
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: Feb 10, 2025
Status: ✅ Sarah said YES! 🎉

Responses: (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💕 Sarah said YES on Feb 14 at 10:52am

[🎉 Share the good news]
[❤️ Create a follow-up valentine]
```

---

## API Endpoints

### 1. Create Valentine
**POST** `/api/create-valentine`

**Request:**
```json
{
  "creator_name": "Alex",
  "recipient_name": "Sarah",
  "creator_email": "alex@example.com", // optional
  "message": "You make every day...",
  "spotify_link": "https://open.spotify.com/track/xyz",
  "theme": "pink",
  "photo_style": "polaroid",
  "font_family": "default",
  "canvas_layout": { /* elements positions */ },
  "photo_urls": ["url1", "url2"] // Already uploaded
}
```

**Response:**
```json
{
  "success": true,
  "valentine_id": "uuid",
  "subdomain": "sarah",
  "share_url": "https://sarah.admire.com",
  "admin_token": "abc123xyz456",
  "admin_url": "https://admire.com/admin/abc123xyz456"
}
```

**Logic:**
- Generate unique subdomain from recipient_name
- Generate unique 32-char admin token
- Store all data in DB
- Upload photos to Supabase storage
- If creator_email provided → mark for notifications
- Return both URLs

---

### 2. Get Admin Data
**GET** `/api/admin/[admin_token]`

**Response:**
```json
{
  "success": true,
  "valentine": {
    "id": "uuid",
    "subdomain": "sarah",
    "creator_name": "Alex",
    "recipient_name": "Sarah",
    "creator_email": "alex@example.com",
    "created_at": "2025-02-10T14:30:00Z",
    "share_url": "https://sarah.admire.com",
    "status": "awaiting" // or "responded"
  },
  "responses": [
    {
      "id": "uuid",
      "response": true, // or false
      "responded_at": "2025-02-14T10:52:00Z"
    }
  ],
  "analytics": {
    "views": 5,
    "responses": 1
  }
}
```

**Logic:**
- No auth needed (token in URL)
- Token is random/secure, hard to guess
- Return valentine data + all responses

---

### 3. Submit Response
**POST** `/api/submit-response`

**Request:**
```json
{
  "valentine_id": "uuid",
  "response": true // or false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response recorded!"
}
```

**Logic:**
- Check if valentine_id exists
- Check if already responded (prevent duplicates)
- Record response
- **Trigger email notification** if creator_email exists
- Return success

---

### 4. Update Notification Email
**POST** `/api/admin/[admin_token]/update-email`

**Request:**
```json
{
  "creator_email": "newemail@example.com",
  "notify": true // true/false for toggle
}
```

**Response:**
```json
{
  "success": true,
  "creator_email": "newemail@example.com",
  "notify": true
}
```

---

### 5. Delete Valentine (Optional)
**DELETE** `/api/admin/[admin_token]/delete`

**Response:**
```json
{
  "success": true,
  "message": "Valentine deleted"
}
```

**Logic:**
- Delete valentine record
- Delete associated photos
- Delete responses
- Done

---

## Email Notifications

### Template: Response Notification

**Subject:** 🎉 Sarah responded to your valentine!

**Body:**
```
Hey Alex! 💕

Great news! Sarah just responded to your valentine.

[Her Response Button]
  Sarah said: YES! ✅

View more details:
admire.com/admin/abc123xyz456

You can also:
• Create a follow-up valentine
• Share her response with friends
• Save this moment

— The Admire Team
```

**Trigger:** When `response = true` and creator has email notification enabled

---

### Template: First Email (Optional Confirmation)

**Subject:** Your valentine is live! 🎉

**Body:**
```
Your valentine to Sarah is ready to share!

Share link: sarah.admire.com
Track responses: admire.com/admin/abc123xyz456

We'll email you when Sarah responds.
Unsubscribe anytime from your admin link.

— The Admire Team
```

**Trigger:** On valentine creation if email provided

---

## UI/UX Flow

### Step 1: Create Form
```
[Form fills out valentine]
↓
[Optional email input]
↓
[Submit "Create Valentine"]
```

### Step 2: Success Screen
```
[Show both links]
[Copy buttons for each]
[Social share buttons]
[Can toggle email notification]
↓
[User either shares or goes back]
```

### Step 3: Recipient Views
```
[recipient clicks share link]
↓
[sarah.admire.com loads]
↓
[Views valentine]
↓
[Clicks Yes/No]
↓
[Response recorded]
↓
[Creator gets notification (if email enabled)]
```

### Step 4: Creator Checks
```
[Creator visits admin link later]
OR
[Creator gets email notification]
↓
[Sees response on admin page]
↓
[Can view details, share response, etc]
```

---

## Security Considerations

**Admin Token:**
- Generate random 32+ character string
- Store securely in DB
- Cryptographically random (use `crypto.randomBytes`)
- Hard to brute force
- Not guessable from subdomain

**Email:**
- Validate format
- Don't spam (only 1 email per response max)
- Provide unsubscribe option
- Use transactional email service (SendGrid, Mailgun, Supabase)

**Duplicate Responses:**
- Check if user already responded (only 1 response per valentine)
- Return same page regardless (user sees "You already responded")

**Admin Link Access:**
- No password needed
- Token itself is the auth
- Don't allow changing admin token
- Can delete valentine from admin page

---

## Database Queries

### Create Valentine
```sql
INSERT INTO valentines (
  subdomain, admin_token, creator_email, creator_name, 
  recipient_name, message, spotify_link, theme, 
  photo_style, font_family, canvas_layout
) VALUES (...)
RETURNING admin_token, subdomain;
```

### Get Admin Data
```sql
SELECT * FROM valentines WHERE admin_token = $1;
SELECT * FROM valentine_responses 
  WHERE valentine_id = (SELECT id FROM valentines WHERE admin_token = $1);
```

### Submit Response
```sql
-- Check if already responded
SELECT * FROM valentine_responses 
  WHERE valentine_id = $1 AND responded_at > NOW() - INTERVAL '1 hour';

-- Insert response
INSERT INTO valentine_responses (valentine_id, response)
VALUES ($1, $2)
RETURNING *;
```

---

## Error Handling

| Error | Response | UX |
|-------|----------|-----|
| Invalid email | Validation error | "Please enter valid email" |
| Subdomain taken | Retry with new name | "Sarah already taken, try sarah2025?" |
| Already responded | 200 OK, same message | "You already responded! Thanks 💕" |
| Token invalid | 404 | "Admin link not found. Check URL." |
| Email delivery failed | Log error, show warning | "Email may not have sent, saved copy here" |

---

## File Structure

```
/app
  /api
    /create-valentine
      route.ts          // POST: Create valentine + generate token
    /submit-response
      route.ts          // POST: Record response + notify
    /admin
      /[admin_token]
        route.ts        // GET: Admin data
    /admin
      /[admin_token]
        /update-email
          route.ts      // POST: Update email + notification toggle
        /delete
          route.ts      // DELETE: Remove valentine

  /created
    /[admin_token]
      page.tsx          // Success screen after creating

  /admin
    /[admin_token]
      page.tsx          // Admin dashboard

  /[subdomain]
    page.tsx            // Valentine recipient view (unchanged)

/components
  CreateSuccessScreen.tsx   // Success screen
  AdminDashboard.tsx        // Admin page

/lib
  email.ts              // Email sending functions
  tokens.ts             // Admin token generation
```

---

## Key Features

✅ **No auth required** - Anonymous creation  
✅ **Optional notifications** - Email when someone responds  
✅ **Admin link tracking** - Always accessible, visit anytime  
✅ **Privacy** - Token-based, hard to guess  
✅ **Simple** - One email per response, opt-out anytime  
✅ **Mobile friendly** - Works on all devices  
✅ **Secure** - Random tokens, no password management  

---

## Implementation Order

1. Update DB schema (add admin_token, creator_email)
2. Build admin token generation util
3. Update create valentine API
4. Build success screen component
5. Build admin dashboard page
6. Set up email service (SendGrid/Mailgun)
7. Build submit response logic + email trigger
8. Test full flow (create → share → respond → notification)
9. Add analytics (view count, response tracking)
