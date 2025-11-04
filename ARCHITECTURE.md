# JugiTube Extension - Architecture Overview

## Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐         ┌──────────────────────┐   │
│  │   Options Page     │         │    Popup (existing)  │   │
│  │                    │         │                      │   │
│  │  - options.html    │         │    - popup.html      │   │
│  │  - options.js      │         │    - popup.js        │   │
│  │                    │         │                      │   │
│  │  [Save to          │         │  [Extension toggle]  │   │
│  │   localStorage]    │         │  [Ad preferences]    │   │
│  └────────┬───────────┘         └──────────────────────┘   │
│           │                                                  │
│           │ writes to                                        │
│           ▼                                                  │
│  ┌─────────────────────────────────┐                        │
│  │  localStorage                   │                        │
│  │  'jugitube_settings_v1'         │                        │
│  │                                 │                        │
│  │  {                              │                        │
│  │    expandToolbar: true,         │                        │
│  │    hideLyricPopup: false,       │                        │
│  │    allowVideoKeepAdSettings:... │                        │
│  │    autoClickSkips: true         │                        │
│  │  }                              │                        │
│  └─────────────┬───────────────────┘                        │
│                │ reads from                                  │
│                ▼                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Content Scripts (YouTube page)            │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  1. settings-apply.js (loads first)          │  │   │
│  │  │     - Reads localStorage                     │  │   │
│  │  │     - Sets window.jugitubeSettings           │  │   │
│  │  │     - Applies CSS variables                  │  │   │
│  │  │     - Dispatches 'jugitube-settings-loaded'  │  │   │
│  │  └──────────────┬───────────────────────────────┘  │   │
│  │                 │ provides settings to              │   │
│  │                 ▼                                    │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  2. adSkipper.js                             │  │   │
│  │  │     - Listens for settings-loaded event      │  │   │
│  │  │     - Checks autoClickSkips setting          │  │   │
│  │  │     - MutationObserver on DOM                │  │   │
│  │  │     - Rate limiting (3/element, 1s global)   │  │   │
│  │  │     - Safe click with fallback               │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  3. lyricHandler.js                          │  │   │
│  │  │     - Listens for settings-loaded event      │  │   │
│  │  │     - Checks hideLyricPopup setting          │  │   │
│  │  │     - MutationObserver on DOM                │  │   │
│  │  │     - Removes/hides lyric popups             │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  4. main.js                                  │  │   │
│  │  │     - Coordinates module initialization      │  │   │
│  │  │     - Checks allowVideoKeepAdSettings        │  │   │
│  │  │     - Dispatches 'jugitube-main-initialized' │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  5. content.js (existing AnomTube)           │  │   │
│  │  │     - Main extension logic                   │  │   │
│  │  │     - Checks allowVideoKeepAdSettings        │  │   │
│  │  │     - Conditional video blocking             │  │   │
│  │  │     - Lyrics system                          │  │   │
│  │  │     - Ad controls                            │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           CSS (applied to YouTube page)             │   │
│  │                                                      │   │
│  │  1. toolbar.css (new)                               │   │
│  │     - --jugitube-toolbar-width variable             │   │
│  │     - Responsive media queries                      │   │
│  │                                                      │   │
│  │  2. content.css (existing)                          │   │
│  │     - AnomTube styling                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### Settings Update Flow
```
User toggles setting in options.html
  ↓
options.js saves to localStorage
  ↓
settings-apply.js detects change via storage event
  ↓
Updates window.jugitubeSettings object
  ↓
Dispatches 'jugitube-settings-changed' event
  ↓
All modules listen and react to change
  ↓
UI updates without page reload
```

### Ad Skip Flow
```
YouTube loads ad
  ↓
MutationObserver in adSkipper.js detects new DOM nodes
  ↓
Checks if node matches skip button selectors
  ↓
Checks visibility (offsetParent, display, etc.)
  ↓
Checks rate limits (per-element and global)
  ↓
Performs safe click (native click() or MouseEvent)
  ↓
Records click attempt with timestamp
  ↓
Ad is skipped
```

### Lyric Popup Block Flow
```
YouTube displays lyric popup
  ↓
MutationObserver in lyricHandler.js detects new DOM nodes
  ↓
Checks if node matches lyric popup selectors
  ↓
Checks hideLyricPopup setting
  ↓
If enabled: removes element from DOM or hides it
  ↓
Lyric popup is blocked
```

### Video Block Decision Flow
```
AnomTube extension activates
  ↓
content.js activate() method called
  ↓
Reads window.jugitubeSettings.allowVideoKeepAdSettings
  ↓
If false (default):
  └─> ensureVideoMonitoring() → video is hidden
      └─> Audio-only placeholder displayed
If true:
  └─> Skip video monitoring
      └─> Video remains visible
      └─> Ad controls still work (adSkipper active)
```

## Event System

### Custom Events

1. **jugitube-settings-loaded**
   - Dispatched by: settings-apply.js
   - Listened by: adSkipper.js, lyricHandler.js, main.js
   - Payload: settings object
   - Purpose: Notify modules that settings are ready

2. **jugitube-settings-changed**
   - Dispatched by: settings-apply.js, options.js
   - Listened by: content.js, adSkipper.js, lyricHandler.js
   - Payload: updated settings object
   - Purpose: Notify modules of settings changes

3. **jugitube-main-initialized**
   - Dispatched by: main.js
   - Listened by: (optional future listeners)
   - Payload: { videoBlockDisabled: boolean }
   - Purpose: Signal that initialization is complete

## Module Dependencies

```
settings-apply.js (no dependencies)
  ↓ provides window.jugitubeSettings
  ├─> adSkipper.js (depends on settings)
  ├─> lyricHandler.js (depends on settings)
  ├─> main.js (depends on settings)
  └─> content.js (depends on settings)
```

## Rate Limiting Strategy

### Ad Skipper Rate Limits

```
Global Rate Limit:
  MIN_INTERVAL_MS = 1000ms
  └─> Minimum time between ANY clicks

Per-Element Rate Limit:
  PER_ELEMENT_LIMIT = 3
  └─> Maximum clicks per specific element
      Uses WeakMap to track elements
      
Decision Tree:
  Click requested
    ↓
  Check: Time since last click > 1000ms?
    ↓ No → Skip
    ↓ Yes
  Check: Element clicked < 3 times?
    ↓ No → Skip
    ↓ Yes
  Perform click
  Record timestamp
  Increment element counter
```

## Security Considerations

### Input Validation
- localStorage data validated before use
- Default values provided for missing/corrupt settings
- try-catch blocks around JSON parsing

### XSS Prevention
- No innerHTML with user input
- Settings are boolean/primitives only
- No eval() or Function() constructor

### DOM Manipulation Safety
- Visibility checks before element interaction
- WeakMap for element tracking (automatic cleanup)
- Rate limiting prevents abuse

### Permissions
- Only required permissions in manifest
- Content scripts only on YouTube domains
- No external API calls from content scripts

## Performance Optimizations

### MutationObserver
- Observe specific subtrees where possible
- Check for relevant changes before processing
- Use rate limiting to prevent excessive callbacks

### Memory Management
- WeakMap for element tracking (auto garbage collection)
- Clean up event listeners on deactivation
- Periodic cleanup intervals

### CSS Variables
- Efficient toolbar width updates
- No JavaScript-triggered reflows
- Hardware-accelerated where possible

### Caching
- Settings cached in window.jugitubeSettings
- No repeated localStorage reads
- Event-driven updates only when needed

## Browser Compatibility

### Manifest V3
- Chrome 88+
- Edge 88+
- Opera 74+

### APIs Used
- chrome.storage (localStorage fallback)
- MutationObserver
- Custom Events
- WeakMap
- CSS Variables
- Pointer Events (for drag)

## Testing Points

### Unit Test Points
- Settings load/save
- Rate limiting logic
- Visibility checks
- Safe click implementation
- Event dispatching

### Integration Test Points
- Module coordination
- Settings propagation
- Video block decision
- Ad skip flow
- Lyric block flow

### E2E Test Points
- Full user journey
- Settings persistence
- Cross-tab communication
- Performance under load

---

Made by: **Jugi @ AnomFIN · AnomTools**
