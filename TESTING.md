# AnomTube Testing Guide

Comprehensive testing checklist for all features in the AnomTube extension.

## Prerequisites

- Chrome or Edge browser (latest version)
- AnomTube extension loaded in developer mode
- Active YouTube page open

## Quick Start

1. Load extension in browser
2. Navigate to YouTube video
3. Enable AnomTube via extension icon
4. Follow test checklist below

---

## Test Checklist

### ✅ Core Functionality

- [ ] **Extension Loads**
  - Extension icon appears in toolbar
  - No console errors on load
  - Manifest v3 service worker active

- [ ] **Audio-Only Mode**
  - Video element hidden when enabled
  - Audio continues playing
  - Placeholder shows AnomFIN branding
  - Placeholder scales with player size

- [ ] **Lyrics Console**
  - Console appears in bottom-right
  - Shows AnomFIN branding and title
  - Lyrics sync with playback
  - Can drag to reposition
  - Position persists on reload

### ✅ Theme System

- [ ] **Dark Theme (Default)**
  - Extension starts in dark theme
  - All elements styled correctly
  - Readable text contrast

- [ ] **Light Theme**
  - Press **T** to toggle
  - All elements switch to light colors
  - Smooth transition (no flicker)
  - Extension popup reflects change

- [ ] **Theme Persistence**
  - Reload page - theme maintained
  - Close/reopen browser - theme maintained
  - Change via popup - content updates

### ✅ Keyboard Shortcuts

#### Playback Controls

- [ ] **Space / K** - Play/Pause
  - Toggles playback state
  - Works when video focused
  - Disabled in input fields

- [ ] **← / J** - Seek Backward
  - Jumps back 5 seconds
  - Smooth seek animation

- [ ] **→ / L** - Seek Forward
  - Jumps forward 5 seconds
  - Smooth seek animation

- [ ] **0-9 Number Keys**
  - Each key seeks to correct %
  - 0=start, 5=50%, 9=90%

#### Volume Controls

- [ ] **↑** - Volume Up
  - Increases by 5%
  - Shows volume indicator
  - Unmutes if at 0

- [ ] **↓** - Volume Down
  - Decreases by 5%
  - Can reach 0

- [ ] **M** - Toggle Mute
  - Mutes/unmutes audio
  - Visual feedback shown

#### Display Controls

- [ ] **F** - Fullscreen
  - Enters fullscreen mode
  - Press again to exit
  - Works in both audio/video modes

- [ ] **T** - Toggle Theme
  - Switches dark ↔ light
  - Shows notification
  - Persists selection

- [ ] **P** - Picture-in-Picture
  - Opens PiP window
  - Video plays in floating window
  - Can resize and move PiP
  - Press again to exit

#### Feature Shortcuts

- [ ] **B** - Add Bookmark
  - Creates bookmark at current time
  - Shows confirmation notification
  - Bookmark saved to storage

- [ ] **D** - Download
  - Shows notification (if backend not running)
  - Opens download if backend available

### ✅ Picture-in-Picture (PiP)

- [ ] **PiP Activation**
  - Press P or click button in popup
  - Video opens in floating window
  - Original tab remains on YouTube

- [ ] **PiP Controls**
  - Can resize window
  - Can move window
  - Always stays on top
  - Closes properly on exit

- [ ] **PiP State**
  - Notification shows "PiP On"
  - Press P again shows "PiP Off"
  - Works in audio-only mode

### ✅ Playlists & Bookmarks

#### Bookmarks

- [ ] **Create Bookmark**
  - Press B at 1:30 in video
  - Notification confirms creation
  - Check chrome.storage.local for data

- [ ] **Bookmark Data**
  - Contains video ID/URL
  - Has title and artist
  - Includes timestamp (1:30)
  - Has creation date

- [ ] **Multiple Bookmarks**
  - Create 3 bookmarks in same video
  - Each has unique timestamp
  - All stored correctly

#### Playlists (Data Layer)

- [ ] **Storage Structure**
  - Playlists array exists
  - Each playlist has ID
  - Videos array within playlist

- [ ] **CRUD Operations**
  - Can create playlist (via console)
  - Can add videos (via console)
  - Can remove videos (via console)
  - Can delete playlist (via console)

### ✅ Responsive Design

#### Desktop (1920x1080)

- [ ] **Full Layout**
  - Lyrics console 400px wide
  - All controls visible
  - No text overflow

#### Tablet (768x1024)

- [ ] **Tablet Layout**
  - Lyrics console 360px wide
  - Controls stack properly
  - Touch targets adequate

#### Mobile (375x667)

- [ ] **Mobile Layout**
  - Lyrics console 300px width
  - Buttons are 44px touch targets
  - Text remains readable
  - No horizontal scroll

#### Landscape Mobile (667x375)

- [ ] **Landscape Optimizations**
  - Lyrics console height limited
  - Controls visible
  - No viewport overflow

### ✅ Accessibility

- [ ] **Reduced Motion**
  - Enable in OS settings
  - Animations minimize/stop
  - Functionality intact

- [ ] **High Contrast**
  - Enable in OS settings
  - Borders more visible
  - Text meets WCAG AA

- [ ] **Keyboard Navigation**
  - Can tab through controls
  - Focus visible
  - No keyboard traps

- [ ] **Screen Reader**
  - ARIA labels present
  - Roles assigned correctly
  - Announcements clear

### ✅ Extension Popup

- [ ] **Status Display**
  - Shows "Active" when enabled
  - Shows "Disabled" when off
  - Updates in real-time

- [ ] **Theme Toggle**
  - Switch reflects current theme
  - Clicking changes theme
  - Content updates immediately

- [ ] **PiP Button**
  - Button visible
  - Click toggles PiP
  - Works as expected

- [ ] **Bookmark Button**
  - Button visible
  - Click adds bookmark
  - Confirmation shown

- [ ] **Settings Sync**
  - Changes in popup reflect in content
  - Changes in content reflect in popup
  - Real-time synchronization

### ✅ Ad Management

- [ ] **Ad Muting**
  - Enable ad muting setting
  - Ads are muted
  - Regular audio restored after ad

- [ ] **Ad Skipping**
  - Enable ad skipping
  - Skip button clicked automatically
  - Overlay ads removed

- [ ] **Ad Blocking**
  - Enable ad blocking
  - Pre-roll ads blocked
  - Video starts immediately

### ✅ Performance

- [ ] **Memory Usage**
  - Check Task Manager
  - Memory stable over time
  - No obvious leaks

- [ ] **CPU Usage**
  - CPU usage reasonable
  - No constant high usage
  - Smooth scrolling

- [ ] **Network**
  - Lyrics fetched efficiently
  - No excessive requests
  - Caching works

---

## Backend Testing (Optional)

### Prerequisites

- Node.js installed
- yt-dlp installed
- ffmpeg installed
- Backend server running

### ✅ Backend Server

- [ ] **Server Starts**
  ```bash
  cd backend
  npm install
  npm start
  ```
  - Server starts on port 3000
  - No errors in console
  - Health check responds

- [ ] **Health Endpoint**
  ```bash
  curl http://localhost:3000/health
  ```
  - Returns 200 OK
  - JSON response with status

### ✅ Download API

#### MP3 Download

- [ ] **Basic MP3**
  ```bash
  curl -X POST http://localhost:3000/api/download \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp3","quality":"medium"}' \
    --output test.mp3
  ```
  - Download completes
  - File is valid MP3
  - Plays correctly

- [ ] **Quality Variations**
  - Test low quality (128kbps)
  - Test medium quality (192kbps)
  - Test high quality (320kbps)
  - Each produces different file sizes

#### MP4 Download

- [ ] **Basic MP4**
  ```bash
  curl -X POST http://localhost:3000/api/download \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp4","quality":"medium"}' \
    --output test.mp4
  ```
  - Download completes
  - File is valid MP4
  - Plays correctly

#### Error Handling

- [ ] **Invalid URL**
  - Send invalid URL
  - Returns 400 error
  - Error message clear

- [ ] **Invalid Format**
  - Send format: "mkv"
  - Returns 400 error
  - Lists valid formats

- [ ] **Invalid Quality**
  - Send quality: "ultra"
  - Returns 400 error
  - Lists valid qualities

- [ ] **Rate Limiting**
  - Make 11 requests quickly
  - 11th request returns 429
  - Error message explains limit

- [ ] **Timeout**
  - Use very long video (>1 hour)
  - Should timeout after 10 minutes
  - Returns 504 error

---

## Browser Compatibility

### Chrome

- [ ] Tested on Chrome (latest)
- [ ] All features work
- [ ] No console errors

### Edge

- [ ] Tested on Edge (latest)
- [ ] All features work
- [ ] No console errors

### Brave (Chromium)

- [ ] Extension loads
- [ ] Core features work
- [ ] Note any issues

---

## Known Issues

Document any issues found during testing:

### Issue Template

```
**Issue**: [Description]
**Steps to Reproduce**: 
1. Step one
2. Step two

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Browser**: [Chrome/Edge version]
**Severity**: [Low/Medium/High/Critical]
```

---

## Regression Testing

After fixes, retest:

- [ ] Original issue resolved
- [ ] No new issues introduced
- [ ] Related features still work
- [ ] Performance unchanged

---

## Sign-Off

**Tester Name**: _________________  
**Date**: _________________  
**Build/Version**: _________________  
**Result**: Pass / Fail / Conditional  

**Notes**:
```


```

---

## Automated Testing (Future)

Consider adding:
- Jest unit tests for modules
- Puppeteer E2E tests
- GitHub Actions CI/CD
- Code coverage reports

---

## Resources

- [Chrome Extensions Testing](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Made by Jugi @ AnomFIN · AnomTools**
