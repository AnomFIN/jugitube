# AnomTube v2.2.0 MVP - Manual Testing Guide

This guide provides step-by-step instructions for manually testing all features of AnomTube v2.2.0 MVP bundle.

## Prerequisites

- Chrome or Edge browser (Chromium-based)
- Internet connection
- For download feature: Backend server running (optional)

## Test Environment Setup

1. **Load the Extension**
   ```
   1. Open chrome://extensions/
   2. Enable "Developer mode"
   3. Click "Load unpacked"
   4. Select the anomtube directory
   5. Verify extension appears in toolbar
   ```

2. **Navigate to YouTube**
   ```
   - Go to https://www.youtube.com/watch?v=dQw4w9WgXcQ (or any video)
   - Ensure video loads properly
   ```

## Feature Tests

### 1. Window State Persistence

**Test 1.1: Initial Position**
- [ ] Click extension icon to open popup
- [ ] Navigate to a YouTube video
- [ ] Verify lyrics console appears in default position (bottom-right)

**Test 1.2: Save Position**
- [ ] Drag lyrics console to a different position (e.g., top-left)
- [ ] Refresh the page
- [ ] Verify console reappears in the saved position

**Test 1.3: Save Size**
- [ ] Resize browser window
- [ ] Observe lyrics console adjusts size appropriately
- [ ] Refresh page and verify console maintains appropriate size

**Expected Results:**
✅ Console remembers position across page reloads  
✅ Console maintains appropriate size based on viewport  
✅ Console doesn't appear off-screen

### 2. Responsive UI

**Test 2.1: Desktop View (>1024px)**
- [ ] Resize browser to 1280x800
- [ ] Verify sidebar is visible
- [ ] Verify lyrics console shows full width (~380px)
- [ ] Verify all UI elements are clearly visible

**Test 2.2: Tablet View (768px-1023px)**
- [ ] Resize browser to 900x600
- [ ] Verify sidebar is still visible but narrower
- [ ] Verify lyrics console adjusts width appropriately
- [ ] Verify no horizontal scrolling

**Test 2.3: Mobile View (<768px)**
- [ ] Resize browser to 480x800
- [ ] Verify sidebar collapses/hides
- [ ] Verify lyrics console takes most of screen width
- [ ] Verify hamburger menu appears (if implemented)
- [ ] Verify touch-friendly UI elements

**Expected Results:**
✅ UI adapts smoothly to different screen sizes  
✅ No horizontal scrolling at any viewport size  
✅ Text remains readable at all sizes  
✅ Buttons and controls remain accessible

### 3. Hotkeys

**Test 3.1: Play/Pause**
- [ ] Navigate to YouTube video
- [ ] Press `Space` key
- [ ] Verify video pauses
- [ ] Press `Space` again
- [ ] Verify video plays

**Test 3.2: Seeking**
- [ ] Start video playback
- [ ] Press `Left Arrow` (←)
- [ ] Verify video seeks backward 5 seconds
- [ ] Press `Right Arrow` (→)
- [ ] Verify video seeks forward 5 seconds

**Test 3.3: Volume Control**
- [ ] Press `Up Arrow` (↑)
- [ ] Verify volume increases (check volume indicator)
- [ ] Press `Down Arrow` (↓)
- [ ] Verify volume decreases

**Test 3.4: Theme Toggle**
- [ ] Note current theme (dark/light)
- [ ] Press `T` key
- [ ] Verify theme toggles to opposite
- [ ] Press `T` again
- [ ] Verify theme toggles back

**Test 3.5: PiP Toggle**
- [ ] Press `P` key
- [ ] Verify video enters Picture-in-Picture mode
- [ ] Verify small floating video window appears
- [ ] Press `P` again (or close PiP window)
- [ ] Verify video returns to normal

**Test 3.6: Download Dialog**
- [ ] Press `D` key
- [ ] Verify download dialog appears
- [ ] Verify dialog shows video title
- [ ] Verify format and quality options are available
- [ ] Close dialog with Escape or Cancel button

**Test 3.7: Hotkeys in Input Fields**
- [ ] Click on any input field (e.g., YouTube search)
- [ ] Press `Space` key
- [ ] Verify space character is typed (video doesn't pause)
- [ ] Verify hotkeys DON'T trigger while typing

**Expected Results:**
✅ All hotkeys work as documented  
✅ Hotkeys don't interfere with input fields  
✅ Visual feedback confirms hotkey actions  
✅ No console errors when using hotkeys

### 4. Playlists & Bookmarks

**Test 4.1: Create Playlist**
- [ ] Open extension popup
- [ ] Click "Playlists" icon/button
- [ ] Click "Create New Playlist"
- [ ] Enter name: "Test Playlist"
- [ ] Verify playlist is created and appears in list

**Test 4.2: Add Video to Playlist**
- [ ] Navigate to any YouTube video
- [ ] Right-click or use add button
- [ ] Select "Add to Playlist" → "Test Playlist"
- [ ] Verify video is added successfully
- [ ] Open playlist and verify video appears

**Test 4.3: Create Bookmark**
- [ ] Play video to timestamp 1:30
- [ ] Click bookmark button or press `B`
- [ ] Add note: "Interesting part"
- [ ] Verify bookmark is created with timestamp 1:30

**Test 4.4: Jump to Bookmark**
- [ ] Navigate to bookmarks list
- [ ] Click on the bookmark created in 4.3
- [ ] Verify video jumps to 1:30 timestamp
- [ ] Verify playback starts at correct time

**Test 4.5: Manage Collections**
- [ ] Open playlists view
- [ ] Rename "Test Playlist" to "My Favorites"
- [ ] Delete a video from the playlist
- [ ] Delete a bookmark
- [ ] Verify all CRUD operations work correctly

**Expected Results:**
✅ Playlists persist across browser sessions  
✅ Bookmarks save exact timestamps  
✅ Jump-to-bookmark works accurately  
✅ All CRUD operations complete without errors  
✅ Data is saved to chrome.storage

### 5. PiP / Mini-Player & Themes

**Test 5.1: Enter PiP Mode**
- [ ] Navigate to YouTube video
- [ ] Press `P` or click PiP button
- [ ] Verify video enters PiP mode
- [ ] Verify floating window appears
- [ ] Verify controls are available in PiP window

**Test 5.2: PiP Interaction**
- [ ] While in PiP, switch to another tab
- [ ] Verify PiP window remains visible
- [ ] Play/pause from PiP window
- [ ] Verify main page reflects changes
- [ ] Return to YouTube tab

**Test 5.3: Exit PiP Mode**
- [ ] Click close on PiP window, or
- [ ] Press `P` again, or
- [ ] Click back into PiP area
- [ ] Verify video returns to normal mode

**Test 5.4: Dark Theme (Default)**
- [ ] Verify extension uses dark theme by default
- [ ] Check lyrics console: dark background
- [ ] Check placeholder: dark gradient
- [ ] Check popup: dark theme

**Test 5.5: Light Theme**
- [ ] Press `T` or toggle theme in settings
- [ ] Verify all UI switches to light theme:
  - [ ] Lyrics console has light background
  - [ ] Placeholder has light gradient
  - [ ] Text is dark for contrast
  - [ ] All elements remain readable

**Test 5.6: Theme Persistence**
- [ ] Set theme to light
- [ ] Close and reopen browser
- [ ] Navigate to YouTube
- [ ] Verify theme is still light

**Expected Results:**
✅ PiP mode works in all browsers that support it  
✅ PiP window remains on top of other windows  
✅ Theme toggle works instantly  
✅ Both themes are readable and visually pleasing  
✅ Theme preference persists across sessions

### 6. Download Button & Backend

**Test 6.1: Backend Setup (Prerequisites)**
- [ ] Navigate to `/backend` directory
- [ ] Run `npm install`
- [ ] Verify yt-dlp is installed: `yt-dlp --version`
- [ ] Verify ffmpeg is installed: `ffmpeg -version`
- [ ] Start server: `npm start`
- [ ] Verify server starts on port 3000
- [ ] Check health endpoint: `curl http://localhost:3000/health`

**Test 6.2: Download Dialog UI**
- [ ] On YouTube, press `D` key
- [ ] Verify download dialog appears
- [ ] Verify video title is displayed correctly
- [ ] Verify format dropdown has MP3 and MP4 options
- [ ] Verify quality dropdown has Low, Medium, High options
- [ ] Check dialog is responsive and well-styled

**Test 6.3: Download MP4 (Video)**
- [ ] Press `D` to open dialog
- [ ] Select format: MP4
- [ ] Select quality: Medium
- [ ] Click "Download" button
- [ ] Verify download initiates
- [ ] Verify progress indicator appears
- [ ] Wait for download to complete
- [ ] Verify file is saved to downloads folder
- [ ] Verify filename is correct
- [ ] Open file and verify it plays

**Test 6.4: Download MP3 (Audio)**
- [ ] Press `D` to open dialog
- [ ] Select format: MP3
- [ ] Select quality: High
- [ ] Click "Download"
- [ ] Verify download initiates
- [ ] Wait for download to complete
- [ ] Verify MP3 file is saved
- [ ] Open file and verify audio plays

**Test 6.5: Error Handling**
- [ ] Stop the backend server
- [ ] Press `D` and try to download
- [ ] Verify error message appears
- [ ] Verify message mentions backend server
- [ ] Start server and retry
- [ ] Verify download now works

**Test 6.6: Rate Limiting**
- [ ] Rapidly initiate 15 downloads within 1 minute
- [ ] Verify rate limit error after 10 requests
- [ ] Wait 1 minute
- [ ] Verify downloads work again

**Test 6.7: Concurrent Downloads**
- [ ] Open 3 browser tabs with different videos
- [ ] Initiate downloads in all 3 tabs simultaneously
- [ ] Verify all 3 downloads proceed
- [ ] Open 4th tab and try downloading
- [ ] Verify 4th download is queued or shows "busy" message

**Test 6.8: Download Timeout**
- [ ] Find a very long video (2+ hours)
- [ ] Try to download it
- [ ] If it exceeds 5 minutes, verify timeout error
- [ ] Verify server doesn't hang

**Test 6.9: curl Testing**
```bash
# Test MP4 download
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp4","quality":"medium"}' \
  --output test-video.mp4

# Test MP3 download
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","format":"mp3","quality":"high"}' \
  --output test-audio.mp3

# Check file was downloaded and is valid
ls -lh test-video.mp4 test-audio.mp3
file test-video.mp4 test-audio.mp3
```

**Expected Results:**
✅ Backend starts without errors  
✅ Health endpoint returns OK status  
✅ Downloads complete successfully  
✅ Files have correct extensions  
✅ Downloaded files play correctly  
✅ Rate limiting works as configured  
✅ Error messages are clear and helpful  
✅ curl commands work as documented

### 7. Integration Tests

**Test 7.1: Full Feature Flow**
- [ ] Install extension
- [ ] Navigate to YouTube
- [ ] Enable AnomTube
- [ ] Verify audio-only mode works
- [ ] Use hotkeys to control playback
- [ ] Drag lyrics console to new position
- [ ] Create a bookmark at current timestamp
- [ ] Create a playlist and add current video
- [ ] Toggle theme to light
- [ ] Enter PiP mode
- [ ] Exit PiP mode
- [ ] Press D to download current video
- [ ] Verify download completes
- [ ] Refresh page
- [ ] Verify theme and position persisted

**Test 7.2: Cross-Tab Consistency**
- [ ] Open 2 YouTube tabs
- [ ] Enable AnomTube in both
- [ ] Change theme in tab 1
- [ ] Switch to tab 2
- [ ] Verify theme changed in tab 2 automatically
- [ ] Create playlist in tab 1
- [ ] Switch to tab 2 and open playlists
- [ ] Verify new playlist appears

**Test 7.3: Browser Restart Persistence**
- [ ] Set everything: theme, position, bookmarks, playlists
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to YouTube
- [ ] Verify all settings persisted

**Expected Results:**
✅ All features work together seamlessly  
✅ Settings sync across tabs  
✅ Data persists across browser restarts  
✅ No conflicts between features  
✅ Performance remains smooth

## Regression Tests

### Test Previous Features Still Work

**8.1: Original Features**
- [ ] Audio-only mode blocks video
- [ ] Placeholder shows correctly
- [ ] Lyrics sync with video
- [ ] Ad blocking still works
- [ ] Ad skipping still works
- [ ] Custom logo/background still works

**8.2: v2.1.0 Features**
- [ ] Hide lyrics option works
- [ ] Allow video + ad controls works
- [ ] Toolbar expansion works
- [ ] MutationObserver ad skipper works

## Performance Tests

**9.1: Memory Usage**
- [ ] Open YouTube with extension
- [ ] Use extension for 30 minutes
- [ ] Check chrome://extensions/ memory usage
- [ ] Verify no memory leaks (< 100MB)

**9.2: CPU Usage**
- [ ] Open Task Manager / Activity Monitor
- [ ] Use extension normally
- [ ] Verify CPU usage is minimal (<5% when idle)

**9.3: Page Load Time**
- [ ] Disable extension
- [ ] Note page load time
- [ ] Enable extension
- [ ] Note page load time
- [ ] Verify difference is minimal (<500ms)

## Browser Compatibility

**10.1: Chrome**
- [ ] Test on Chrome latest version
- [ ] Verify all features work

**10.2: Edge**
- [ ] Test on Edge latest version
- [ ] Verify all features work

**10.3: Brave**
- [ ] Test on Brave browser (if available)
- [ ] Verify compatibility

## Bug Reporting Template

If you find any issues during testing, report them using this template:

```
**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Browser**: [Chrome/Edge/etc, version]
**Extension Version**: 2.2.0
**Screenshots**: [If applicable]
**Console Errors**: [Any errors in developer console]
```

## Test Completion Checklist

- [ ] All 10 test sections completed
- [ ] No critical bugs found
- [ ] All expected results achieved
- [ ] Performance is acceptable
- [ ] Documentation is accurate
- [ ] Ready for release

## Notes

- Some tests require the optional backend server
- PiP feature requires browser support (most modern browsers)
- Theme toggle affects all UI elements
- Playlists and bookmarks data is stored locally
- Downloads require working internet connection

---

**Tested By**: _____________  
**Date**: _____________  
**Test Result**: ☐ PASS ☐ FAIL  
**Notes**: _____________
