# Ask Cuter - Valentine Site
Product Specification & Development Guide

---

## Overview
A web application that lets users create beautiful, shareable valentine cards with subdomain URLs. Users upload photos, write messages, add Spotify links, and customize the design. Recipients receive a personalized valentine page.

---

## Tech Stack
- **Frontend:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (for images)
- **Hosting:** Vercel
- **DNS:** Wildcard subdomain setup (`*.yourdomain.com` → your Vercel deployment)
- **Fonts:** Custom fonts stored in `/public/fonts/`

---

## Core Features

### 1. Landing Page
**Route:** `/`

**Design:**
- Clean, centered layout with cream/light background
- Headline: "Ask Cuter" (large, bold, playful font from public/fonts)
- Visual: Spread of 3 polaroid photos (BW/grayscale) arranged at angles
- Center element: Song card with "Forever With You - A Love Song" text
- CTA Button: Red/crimson rounded button labeled "Create your valentine"
- Bottom corner: Small decorative heart outline

**Interactive:**
- Button click → navigate to `/create`
- Optional: Auto-cycle through sample valentines on the page (fade in/out)

---

### 2. Create Valentine Page
**Route:** `/create`

**Layout:** Two-column (desktop), stacked (mobile)
- **Left Column (Form):** 70% width on desktop
- **Right Column (Preview):** 30% width on desktop (sticky, shows mobile mockup)

#### Left Column: Form

**Header Section**
- Title: "CREATE YOUR VALENTINE" (playful font)
- Font selector dropdown: "Font name ▼" (select from fonts in /public/fonts)
- Theme color indicator (small circle, clickable)
- Desktop/Mobile toggle icons (for preview switching)

**Form Sections:**

**1. Photos Section**
```
Photos
[+ Upload area - drag & drop or click]

[Thumbnail grid - drag to reorder, hover shows delete]

Photo Style: [Polaroid] [Hearts]
```

**2. Their Name Section**
```
Their name
[Text input]

Domain preview: their-name.yourdomain.com ✓
```

**3. Message Section**
```
Message
[Text area - optional]
```

**4. Spotify Section**
```
Spotify link
[Text input - paste link]
```

**Color Theme Selector**
- Click the color circle → expands horizontally to show color options
- Options: Pink, Red, Purple, Sunset (each shows a small circle)
- Click to select, collapse after selection
- Updates preview in real-time

**Submit Button**
- Red, full width, rounded
- Text: "Create valentine"
- Disabled until names filled

#### Right Column: Preview
- **Desktop view:** Full desktop mockup of valentine page
- **Mobile view:** iPhone mockup with rounded corners, notch, and full screen scroll preview
- Sticky positioning
- Updates in real-time as form changes

---

### 3. Valentine Page (Recipient View)
**Route:** `/[subdomain]` (e.g., `/sarah`, `/alex`)

**Layout:** Full mobile-optimized

**Design:**
- Header section with gradient (theme color)
  - "💕 A Valentine from 💕"
  - Sender's name
  - Domain: `sarah.yourdomain.com`
- Photos section (with selected style: polaroid or hearts)
- Message section
- Spotify player section
- **New:** Yes/No buttons at bottom
  - "Will you officially be mine?"
  - Yes button (filled, theme color)
  - No button (outline)

**Photo Styles:**

**Polaroid:**
- White border (25% of height)
- Slight rotation (-2° to +2°)
- Drop shadow
- Optional caption area (white space below)

**Hearts:**
- SVG border with hearts in corners (♥)
- Wavy dashed border
- Squiggles on sides
- Border color matches theme
- Clean white padding

**Spotify Integration:**
- Display album art (if available)
- Show "Music title" and "Artist name"
- Clickable "Play me" button that opens in Spotify or embeds player
- Spotify logo indicator

---

## Database Schema

### valentines table
```sql
CREATE TABLE valentines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  message TEXT,
  spotify_link VARCHAR(500),
  theme VARCHAR(50) DEFAULT 'pink', -- pink, red, purple, sunset
  photo_style VARCHAR(50) DEFAULT 'polaroid', -- polaroid, hearts
  font_family VARCHAR(255) DEFAULT 'default',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### valentine_photos table
```sql
CREATE TABLE valentine_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valentine_id UUID NOT NULL REFERENCES valentines(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### valentine_responses table
```sql
CREATE TABLE valentine_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valentine_id UUID NOT NULL REFERENCES valentines(id) ON DELETE CASCADE,
  response BOOLEAN, -- true for yes, false for no
  responded_at TIMESTAMP DEFAULT NOW()
);
```

---

## File Structure

```
/app
  /api
    /create-valentine
      route.ts           // POST: Create new valentine
    /upload-photo
      route.ts           // POST: Upload photos to Supabase storage
    /check-subdomain
      route.ts           // GET: Check if subdomain is available
    /submit-response
      route.ts           // POST: Save yes/no response
  /create
    page.tsx            // Create valentine form
  /[subdomain]
    page.tsx            // Valentine recipient view
  page.tsx              // Landing page
  layout.tsx

/components
  ValentineForm.tsx     // Form component
  Preview.tsx           // Live preview component
  PhotoUpload.tsx       // Photo upload/drag logic
  ColorPicker.tsx       // Expandable color selector
  PhotoStyles.tsx       // Polaroid/Hearts toggle
  LandingPage.tsx       // Landing page layout

/lib
  supabase.ts           // Supabase client
  constants.ts          // Theme colors, fonts, etc
  utils.ts              // Helper functions

/public
  /fonts
    font-name.ttf       // Custom fonts
    font-name.otf
  /icons
    spotify.svg
    heart.svg

/styles
  globals.css
  themes.css            // Theme color definitions
```

---

## Key Interactions

### 1. Photo Upload
- Drag & drop or click to upload
- Displays thumbnail in grid
- Drag thumbnails to reorder (updates display_order in DB)
- Hover to delete
- Shows upload count

### 2. Subdomain Availability
- Real-time check as user types recipient name
- Convert to lowercase, remove spaces
- Show ✓ if available, ✗ if taken
- API call to `/api/check-subdomain`

### 3. Color Theme Selection
- Click color circle → expands horizontally
- Show 4 color options inline
- Click option → selects and collapses
- Updates preview immediately
- Selected color applies to: header gradient, buttons, borders (theme-dependent)

### 4. Font Selection
- Dropdown loads fonts from `/public/fonts/`
- Font file names mapped to display names in constants
- Preview updates font-family on all text elements
- Persist selection in form state

### 5. Form Submission
- Validate: Sender name, Recipient name, at least 1 photo
- Upload photos to Supabase Storage: `/valentine-photos/{valentine_id}/{timestamp}.jpg`
- Create valentine record in DB
- Redirect to new valentine page: `/{subdomain}`

### 6. Valentine Page Response
- User clicks Yes/No
- POST to `/api/submit-response`
- Optional: Show confetti animation on Yes
- Optional: Show confirmation message

---

## Responsive Design

**Mobile (< 768px):**
- Stack form and preview vertically
- Full-width form
- Preview shows mobile mockup only
- Touch-friendly tap targets (44px min)

**Desktop (≥ 768px):**
- Side-by-side layout
- Form 70%, Preview 30%
- Preview sticky on scroll

**Valentine Page:**
- Always mobile-optimized (designed for phone screens)
- Desktop view shows phone mockup

---

## Colors & Themes

```css
/* Pink Theme */
--theme-primary: #ec4899;
--theme-light: #fbcfe8;
--theme-gradient: linear-gradient(to right, #fecdd3, #fbcfe8);

/* Red Theme */
--theme-primary: #ef4444;
--theme-light: #fecaca;
--theme-gradient: linear-gradient(to right, #fecaca, #fca5a5);

/* Purple Theme */
--theme-primary: #a855f7;
--theme-light: #e9d5ff;
--theme-gradient: linear-gradient(to right, #ddd6fe, #e9d5ff);

/* Sunset Theme */
--theme-primary: #f97316;
--theme-light: #fed7aa;
--theme-gradient: linear-gradient(to right, #fed7aa, #fbcfe8);
```

---

## Form Validation

- Sender name: Required, max 50 chars
- Recipient name: Required, max 50 chars, alphanumeric + spaces only
- Photos: At least 1 required, max 10
- Message: Optional, max 500 chars
- Spotify link: Optional, valid URL format
- Subdomain: Auto-generated from recipient name, must be unique

---

## Spotify Integration

**Input:** User pastes Spotify link (any format)
- Examples:
  - `https://open.spotify.com/track/xyz`
  - `https://open.spotify.com/playlist/xyz`
  - Spotify URI

**Processing:**
1. Extract ID from URL/URI
2. Store in DB
3. Display on valentine page with embed iframe or redirect

**Display Options:**
- Option A: Embedded player: `<iframe src="https://open.spotify.com/embed/track/{ID}"></iframe>`
- Option B: Custom player with album art + "Play" button linking to Spotify
- Option C: Display song info with link

---

## DNS Setup

```
DNS Records needed:
Type: A (or CNAME if using Vercel)
Name: *.yourdomain.com
Value: Your Vercel IP / CNAME

This allows all subdomains (sarah.yourdomain.com, alex.yourdomain.com, etc) 
to route to your app. Next.js handles routing via [subdomain] dynamic route.
```

---

## Next Steps

1. Set up Supabase project and DB schema
2. Configure DNS wildcard record
3. Create Supabase client in `/lib/supabase.ts`
4. Build landing page (`/page.tsx`)
5. Build form with photo upload (`/create/page.tsx`)
6. Build preview component (real-time sync)
7. Build valentine recipient page (`/[subdomain]/page.tsx`)
8. Test subdomain routing and storage
9. Deploy to Vercel

---

## Nice-to-Have Features (Later)

- Analytics (view count per valentine)
- Share buttons (copy link, social media)
- Confetti animation on Yes response
- Email notification when response received
- Template presets
- Custom backgrounds
- GIF/video support
- QR code to valentine
- Print option
