# Visual Testing Guide - Version 2.2.0

## Testing New Features in AnomTube v2.2.0

This guide helps you test all the new features added in version 2.2.0.

### Prerequisites
1. Load the extension in Chrome/Edge
2. Navigate to any YouTube video
3. Open DevTools Console (F12) to monitor for errors

---

## 1. Keyboard Shortcuts Testing

### Test: Play/Pause (Space)
**Steps:**
1. Navigate to a YouTube video
2. Enable AnomTube extension
3. Press **Space** key
4. Video should pause/play

**Expected Result:** ✓ Video toggles play/pause state

### Test: Seek Controls (Arrows)
**Steps:**
1. While video is playing
2. Press **←** (Left Arrow)
3. Video should jump back 5 seconds
4. Press **→** (Right Arrow)
5. Video should jump forward 5 seconds

**Expected Result:** ✓ Video seeks correctly in both directions

### Test: Volume Control (Up/Down)
**Steps:**
1. Press **↑** (Up Arrow)
2. Volume indicator should appear showing increased volume
3. Press **↓** (Down Arrow)
4. Volume indicator should show decreased volume

**Expected Result:** ✓ Volume changes and indicator displays correctly

### Test: Download Toggle (D)
**Steps:**
1. Press **D** key
2. Download panel should appear in top-right corner
3. Press **D** again
4. Download panel should hide

**Expected Result:** ✓ Download panel toggles visibility

### Test: Theme Toggle (T)
**Steps:**
1. Press **T** key
2. Theme should switch (dark ↔ light)
3. Lyrics console should update colors
4. Press **T** again to verify toggle

**Expected Result:** ✓ Theme switches and persists

### Test: PiP Toggle (P)
**Steps:**
1. Press **P** key
2. Video should enter Picture-in-Picture mode
3. Press **P** again or close PiP window
4. Video returns to normal

**Expected Result:** ✓ PiP mode activates/deactivates

### Test: Hotkey Conflict Prevention
**Steps:**
1. Click on YouTube search box
2. Type "space" and other keys
3. Hotkeys should NOT trigger while typing

**Expected Result:** ✓ Hotkeys don't interfere with input fields

---

## 2. Theme System Testing

### Test: Theme Button in Popup
**Steps:**
1. Click extension icon
2. Scroll to "Ominaisuudet" section
3. Click "🌓 Vaihda" button
4. Theme should switch

**Expected Result:** ✓ Theme toggles via button

### Test: Theme Persistence
**Steps:**
1. Toggle theme to Light
2. Refresh the page
3. Theme should remain Light
4. Close and reopen browser
5. Theme should still be Light

**Expected Result:** ✓ Theme preference persists across sessions

### Test: Theme Application
**Steps:**
1. Toggle to Light theme
2. Check these elements:
   - Popup interface
   - Lyrics console (if visible)
   - Download panel
   - Playlist manager

**Expected Result:** ✓ All UI elements reflect current theme

---

## 3. Bookmarks & Playlists Testing

### Test: Open Playlist Manager
**Steps:**
1. Click extension icon
2. Click "📝 Hallinnoi" button in Ominaisuudet section
3. Playlist manager panel should appear on left side

**Expected Result:** ✓ Playlist manager opens

### Test: Add Bookmark
**Steps:**
1. Play video for 30 seconds
2. Open playlist manager
3. Click "📌 Lisää kirjanmerkki"
4. Bookmark should appear in list with timestamp

**Expected Result:** ✓ Bookmark created with current timestamp

### Test: Jump to Bookmark
**Steps:**
1. Create bookmark at 0:30
2. Seek video to 2:00
3. Click on the bookmark in the list
4. Video should jump to 0:30

**Expected Result:** ✓ Video jumps to bookmarked timestamp

### Test: Bookmark Persistence
**Steps:**
1. Create several bookmarks
2. Refresh the page
3. Open playlist manager
4. Bookmarks should still be there

**Expected Result:** ✓ Bookmarks persist across page loads

### Test: Multiple Videos
**Steps:**
1. Create bookmark on Video A
2. Navigate to Video B
3. Create bookmark on Video B
4. Return to Video A
5. Only Video A's bookmarks should show

**Expected Result:** ✓ Bookmarks are video-specific

---

## 4. Picture-in-Picture Testing

### Test: PiP via Popup Button
**Steps:**
1. Click extension icon
2. Click "📺 PiP" button in Ominaisuudet
3. Video should enter PiP mode

**Expected Result:** ✓ PiP activates

### Test: PiP via Hotkey
**Steps:**
1. Press **P** key
2. Video enters PiP
3. Press **P** again
4. Video exits PiP

**Expected Result:** ✓ PiP toggles via hotkey

### Test: PiP with Audio-Only Mode
**Steps:**
1. Enable AnomTube (video hidden)
2. Activate PiP
3. PiP window should show audio-only placeholder or work with hidden video

**Expected Result:** ✓ PiP works with audio-only mode

### Test: PiP Window Controls
**Steps:**
1. Enter PiP mode
2. Try play/pause in PiP window
3. Try closing PiP window
4. All controls should work

**Expected Result:** ✓ PiP controls function properly

---

## 5. Download Manager Testing

### Test: Open Download Panel
**Steps:**
1. Click extension icon
2. Click "⬇️ Lataa" button
3. Download panel appears top-right

**Expected Result:** ✓ Download panel opens

### Test: Download via Hotkey
**Steps:**
1. Press **D** key
2. Download panel toggles

**Expected Result:** ✓ Hotkey opens/closes panel

### Test: Format Selection
**Steps:**
1. Open download panel
2. Click "🎵 MP3" button
3. Button should highlight
4. Click "🎬 MP4" button
5. MP4 should highlight, MP3 unhighlight

**Expected Result:** ✓ Format selection works

### Test: Quality Selection
**Steps:**
1. Open download panel
2. Change quality dropdown to "High"
3. Selection should update

**Expected Result:** ✓ Quality selection updates

### Test: Settings Persistence
**Steps:**
1. Select MP4 format and High quality
2. Close panel
3. Refresh page
4. Open panel
5. Settings should be MP4 and High

**Expected Result:** ✓ Download settings persist

### Test: Download Initiation
**Steps:**
1. Open download panel
2. Select format and quality
3. Click "⬇ DOWNLOAD" button
4. Status message should appear

**Expected Result:** ✓ Download process initiates (note: actual download limited by browser)

---

## 6. Responsive Design Testing

### Test: Mobile Viewport (< 480px)
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or similar mobile device
4. Reload extension popup

**Expected Result:** 
✓ Popup scales down properly
✓ Buttons remain touch-friendly (44px min)
✓ Text remains readable

### Test: Tablet Viewport (768px)
**Steps:**
1. Select iPad or similar tablet device in DevTools
2. Check popup and all panels

**Expected Result:**
✓ UI elements scale appropriately
✓ Layouts adjust for medium screens

### Test: Lyrics Console Responsive
**Steps:**
1. Enable lyrics console
2. Resize browser window from desktop to mobile
3. Console should adjust size

**Expected Result:** ✓ Lyrics console responsive across sizes

### Test: Download Panel Responsive
**Steps:**
1. Open download panel
2. Test on mobile viewport
3. Panel should fit screen

**Expected Result:** ✓ Download panel fits mobile screens

### Test: Playlist Manager Responsive
**Steps:**
1. Open playlist manager
2. Test on mobile viewport
3. Panel should fit and be usable

**Expected Result:** ✓ Playlist manager responsive

---

## 7. Integration Testing

### Test: All Features Together
**Steps:**
1. Enable AnomTube
2. Create a bookmark
3. Toggle theme
4. Enter PiP mode
5. Use hotkeys
6. Open download panel
7. All should work without conflicts

**Expected Result:** ✓ All features coexist peacefully

### Test: Extension Enable/Disable
**Steps:**
1. Use several features
2. Disable extension via popup toggle
3. Re-enable extension
4. Features should restore properly

**Expected Result:** ✓ Enable/disable doesn't break features

### Test: Navigation Between Videos
**Steps:**
1. Test features on Video A
2. Navigate to Video B
3. Features should continue working
4. Video-specific data (bookmarks) should update

**Expected Result:** ✓ Features work across video navigation

---

## 8. Performance Testing

### Test: Memory Usage
**Steps:**
1. Open Chrome Task Manager (Shift+Esc)
2. Find extension process
3. Use all features extensively
4. Monitor memory usage

**Expected Result:** ✓ Memory usage remains reasonable (<50MB typical)

### Test: Hotkey Responsiveness
**Steps:**
1. Rapidly press hotkeys
2. Actions should be responsive
3. No lag or freeze

**Expected Result:** ✓ Hotkeys respond instantly

### Test: Panel Opening Speed
**Steps:**
1. Open/close download panel rapidly
2. Open/close playlist manager rapidly
3. Should be smooth

**Expected Result:** ✓ Panels open/close quickly

---

## 9. Error Handling Testing

### Test: Missing Video Element
**Steps:**
1. Navigate to YouTube homepage (no video)
2. Try using hotkeys
3. No errors in console

**Expected Result:** ✓ Graceful handling without video

### Test: Storage Errors
**Steps:**
1. Check browser console for storage errors
2. Try to use features

**Expected Result:** ✓ No storage-related errors

### Test: PiP Unsupported
**Steps:**
1. In browser that doesn't support PiP
2. Try to activate PiP
3. Should handle gracefully

**Expected Result:** ✓ Error handling for unsupported features

---

## 10. Cross-Browser Testing

### Test: Chrome
- All features should work
- PiP supported
- Downloads supported

### Test: Edge
- All features should work
- PiP supported
- Downloads supported

### Test: Other Chromium Browsers
- Basic features should work
- Some advanced features may have limitations

---

## Checklist Summary

Use this checklist to track testing progress:

**Keyboard Shortcuts:**
- [ ] Space (Play/Pause)
- [ ] Arrows (Seek & Volume)
- [ ] D (Download)
- [ ] T (Theme)
- [ ] P (PiP)
- [ ] Input field conflict prevention

**Theme System:**
- [ ] Theme toggle button
- [ ] Theme hotkey
- [ ] Theme persistence
- [ ] All UI elements update

**Bookmarks:**
- [ ] Add bookmark
- [ ] Jump to bookmark
- [ ] Bookmark persistence
- [ ] Video-specific bookmarks

**Picture-in-Picture:**
- [ ] PiP button
- [ ] PiP hotkey
- [ ] PiP with audio-only
- [ ] PiP controls

**Download Manager:**
- [ ] Open panel
- [ ] Format selection
- [ ] Quality selection
- [ ] Settings persistence

**Responsive Design:**
- [ ] Mobile (< 480px)
- [ ] Tablet (< 768px)
- [ ] Desktop (> 768px)
- [ ] All panels responsive

**Integration:**
- [ ] All features together
- [ ] Enable/disable
- [ ] Video navigation
- [ ] Performance acceptable

**Error Handling:**
- [ ] No console errors
- [ ] Graceful degradation
- [ ] Storage errors handled

---

## Reporting Issues

If you find any issues during testing:

1. **Check browser console** for errors
2. **Note the exact steps** to reproduce
3. **Record browser version** and extension version
4. **Take screenshots** if visual issues
5. **Report with details** to help debugging

---

**Testing completed?** Mark the date: _______________

**Tester name:** _______________

**Browser:** _______________

**Version:** _______________
