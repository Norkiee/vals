# Claude Code Prompt: Interactive Canvas Editor (Preview Component)

## Overview
Build an **interactive canvas editor component** that replaces the current static mobile mockup preview. Users should be able to freely drag, rotate, and resize photos, the Spotify card, and message text anywhere on the canvas to create custom bento layouts.

---

## Component Scope
Replace the current `Preview.tsx` (static mobile phone mockup) with an interactive canvas where:
- Photos can be dragged anywhere
- Photos can be rotated by grabbing a rotation handle and turning
- Photos can be resized by dragging corners
- Spotify card is draggable, rotatable, resizable
- Message text is draggable, rotatable, resizable
- Elements can overlap with proper z-index layering
- Everything updates in real-time as user interacts

---

## Canvas Specifications

**Canvas Size:** 375px wide × 667px tall (mobile phone frame)

**Canvas Background:** Matches selected theme color (pink, red, purple, sunset)

**Canvas Frame:** Visible border/outline so it's clear where the canvas boundaries are

---

## Element Types

### 1. Photo Elements
- Each uploaded photo appears as an independent draggable card
- Displays in selected photo style:
  - **Polaroid:** White border below image, slight rotation, drop shadow
  - **Hearts:** SVG border with heart doodles, wavy border
- Can be positioned anywhere on canvas
- Can be resized from corners (maintain aspect ratio)
- Can be rotated (see rotation interaction below)

### 2. Spotify Card
- Shows album art, song title, artist name, play button
- Draggable to any position
- Resizable
- Rotatable

### 3. Message
- Text box showing the custom message
- Draggable
- Resizable (width/height)
- Rotatable
- Should wrap text nicely

### 4. Header (Optional)
- "💕 A Valentine from [Name] 💕"
- Can be positioned/rotated (or kept fixed)

---

## Interactions

### Drag to Move
- Click + drag any element → moves smoothly to new position
- Element follows cursor in real-time
- Works with mouse and touch

### Rotate by Dragging
- **Rotation Handle:** Small circular icon appears on element hover (top-right or center)
- User grabs rotation handle
- Drag in **circular motion** around element center
- Element rotates based on angle of drag (like turning a dial)
- Visual feedback: Show rotation angle (e.g., "45°") while dragging
- Rotation range: -180° to +180°

### Resize
- On hover, show **8 resize handles** (corners + sides)
- Drag corner handles to resize
- Maintain aspect ratio (don't squish)
- Show current dimensions while resizing (e.g., "150×150")

### Selection & Properties
- Click element → shows selection box with handles and rotation icon
- Selected element appears on top
- Optional: Show simple property values on hover (X, Y, rotation)

### Z-Index / Layering
- Elements that overlap show correctly (last added on top)
- Optional: Right-click menu or buttons to "Bring to Front" / "Send to Back"

---

## Implementation Approach

**State Management:**
- Track array of elements: `{ id, type, x, y, width, height, rotation, zIndex, content }`
- Use React hooks (useState) to store canvas state
- Update in real-time as user drags/rotates/resizes

**Drag Logic:**
```
On mouseDown on element:
  - Store initial mouse position
  - Store initial element position

On mouseMove:
  - Calculate delta (new mouse pos - initial mouse pos)
  - Update element position: x += deltaX, y += deltaY
  - Re-render

On mouseUp:
  - Stop dragging
  - Keep final position
```

**Rotate Logic:**
```
On mouseDown on rotation handle:
  - Store initial mouse position
  - Calculate center of element

On mouseMove:
  - Calculate angle from center to current mouse position: Math.atan2(deltaY, deltaX)
  - Update rotation angle
  - Apply CSS transform: rotate({angle}deg)
  - Re-render

On mouseUp:
  - Keep final rotation
```

**Resize Logic:**
```
On mouseDown on corner handle:
  - Store initial mouse position
  - Store initial width/height

On mouseMove:
  - Calculate new width/height based on handle position
  - Maintain aspect ratio if needed
  - Update element dimensions
  - Re-render

On mouseUp:
  - Keep final size
```

---

## Component Structure

```
CanvasEditor.tsx (main)
├── Canvas.tsx (the interactive canvas container)
│   ├── CanvasElement.tsx (wrapper for each element)
│   │   ├── Photo component
│   │   ├── Spotify component
│   │   ├── Message component
│   │   ├── DragHandle (invisible, covers element)
│   │   ├── ResizeHandles (8 corner/side circles)
│   │   └── RotationHandle (circular icon)
│   └── SelectionBox.tsx (visual selection outline)
└── Toolbar.tsx (simple toolbar: zoom buttons, reset, etc.)
```

**Styles:**
- Use CSS transforms for moving/rotating (high performance)
- Absolute positioning for element placement within canvas
- Box shadows for depth when selected

---

## Data Flow

**Input from Form:**
- `photos`: Array of photo objects with image URLs and style (polaroid/hearts)
- `message`: String content
- `spotifyLink`: String URL
- `theme`: Color theme name

**Canvas State:**
```javascript
canvasElements = [
  {
    id: "photo-1",
    type: "photo",
    photoIndex: 0,
    x: 50,
    y: 100,
    width: 150,
    height: 150,
    rotation: -15,
    zIndex: 1
  },
  {
    id: "spotify-1",
    type: "spotify",
    x: 100,
    y: 300,
    width: 160,
    height: 100,
    rotation: 5,
    zIndex: 2
  },
  {
    id: "message-1",
    type: "message",
    x: 20,
    y: 450,
    width: 335,
    height: 80,
    rotation: 0,
    zIndex: 0,
    text: "You make every day feel like Valentine's Day..."
  }
]
```

**Output:** `canvasState` object passed back to form/saved to DB

---

## Interactions Detail

### Select an Element
- Click element → shows selection box
- Show resize handles (8 small circles at corners/sides)
- Show rotation handle (circular icon, positioned above/at top-right)
- Highlight selected element (subtle glow or border)

### Drag Element
- Cursor changes to `grab` on hover
- On drag, cursor changes to `grabbing`
- Element moves smoothly with mouse
- Show ghost/preview of final position (optional)

### Rotate Element
- Hover element → rotation handle becomes visible
- Mouse over rotation handle → cursor changes to `alias` (rotate icon)
- Click + drag rotation handle in circular motion
- Element rotates around its center point
- Show angle value (e.g., "42°") while dragging
- Release to finalize rotation

### Resize Element
- Hover element → resize handles (8 small circles) appear
- Cursor changes to resize cursor (↔ for sides, ↗ for corners)
- Drag corner to resize (maintain aspect ratio)
- Show dimensions while resizing (e.g., "200×200")
- Release to finalize size

---

## Visual Design

**Canvas:**
- Light frame/border (2px border-radius)
- Background: theme color (transparent or light shade of theme)
- Size: 375×667px (visible boundary)

**Selection Box:**
- Thin border around selected element
- 8 small circular handles at corners and sides
- Rotation handle: Circular icon above element

**Handles:**
- Resize handles: 8px diameter circles, light color
- Rotation handle: 10px diameter circle with curved arrow icon
- Hover state: Slightly larger, more opaque

**Cursors:**
- Element: `grab` on hover
- Dragging: `grabbing`
- Rotating: `alias` (or custom rotate cursor)
- Resizing: `col-resize`, `row-resize`, `nwse-resize` (depending on handle)

---

## Nice-to-Have Features

- **Grid snap:** Optional toggle to snap elements to grid (helps with alignment)
- **Alignment guides:** Vertical/horizontal guide lines when dragging near other elements
- **Undo/Redo:** Ctrl+Z / Ctrl+Shift+Z
- **Zoom:** Zoom in/out of canvas (100%, fit screen)
- **Preview mode:** Toggle that hides handles for final preview
- **Reset canvas:** Button to return elements to default positions

---

## Requirements Checklist

✅ Smooth dragging of all element types  
✅ Rotation via circular drag motion (not just numeric input)  
✅ Resize with aspect ratio maintenance  
✅ Multi-element layering (z-index)  
✅ Real-time updates as user manipulates  
✅ Visual feedback (cursors, selection, handles)  
✅ No external drag libraries (vanilla React preferred)  
✅ Mobile-touch friendly interactions  
✅ Canvas state object for persistence  

---

## Success Criteria

When complete, user should be able to:
- [ ] Drag any photo around the canvas freely
- [ ] Rotate a photo by grabbing the rotation handle and turning
- [ ] Resize a photo by dragging corners (no distortion)
- [ ] Position Spotify card anywhere
- [ ] Position message text anywhere
- [ ] Have elements overlap correctly
- [ ] Create custom bento-style layouts
- [ ] See smooth, fluid interactions
- [ ] Experience feels like Figma/design tool (not clunky)
