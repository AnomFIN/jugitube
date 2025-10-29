# Testing Instructions for AnomTube Updates

## Overview
This document provides step-by-step instructions for testing the new features and improvements in AnomTube.

## Prerequisites
1. Chrome or Edge browser
2. Developer mode enabled in extensions
3. Access to YouTube with various types of videos (with/without ads)

## Installation
1. Navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the repository folder
4. Verify the extension appears in your extensions list

## Feature Testing

### Test 1: Lyrics Console Width
**Purpose**: Verify the lyrics console panel has appropriate width and is responsive

**Steps**:
1. Navigate to any YouTube video (e.g., a music video)
2. Click the AnomTube extension icon in your browser toolbar
3. Toggle "Enable AnomTube" to activate the extension
4. Observe the lyrics console in the bottom-right corner

**Expected Result**:
- The console should have a minimum width of 220px
- The console should be clearly visible and not too narrow
- Text and controls should be properly displayed without being cut off
- On smaller screens, the console should adapt responsively

**Pass Criteria**: ✅ Console is at least 220px wide and all content is visible

---

### Test 2: Hide Lyrics Popup Setting
**Purpose**: Verify the new setting to completely hide the lyrics popup

**Steps**:
1. Open the AnomTube popup
2. Scroll to the "Lisäasetukset" (Additional Settings) section
3. Enable the "Piilota lyriikka-popup" (Hide lyrics popup) toggle
4. Navigate to a YouTube video
5. Enable AnomTube if not already enabled

**Expected Result**:
- The lyrics console should NOT appear on the screen
- The video placeholder (or video if allowVideo is enabled) should still work
- No lyrics UI elements should be visible

**Steps to Verify Reversal**:
1. Open the AnomTube popup again
2. Disable the "Piilota lyriikka-popup" toggle
3. Refresh the YouTube page

**Expected Result**:
- The lyrics console should now appear normally

**Pass Criteria**: ✅ Lyrics popup is hidden when setting is enabled, appears when disabled

---

### Test 3: Improved Ad Skip Functionality
**Purpose**: Verify the new MutationObserver-based ad skipper works reliably

**Steps**:
1. Open the AnomTube popup
2. Enable "Mainokset ASAP POIS" (Skip ads ASAP)
3. Navigate to YouTube videos that typically show ads
4. Watch for pre-roll ads or mid-roll ads

**Expected Result**:
- When the "Skip Ad" button appears, it should be clicked automatically within ~100-250ms
- Ad overlay banners should be removed automatically
- The system should not attempt to click the button more than 3 times per minute per button
- No console errors should appear related to ad skipping

**Testing Tips**:
- Test with multiple videos to encounter different ad types
- Observe the browser console for any debug messages (should see limited logs only)
- Verify that regular video controls are not affected

**Pass Criteria**: ✅ Skip buttons are clicked automatically, rate limiting works, no false positives

---

### Test 4: Allow Video with Ad Controls
**Purpose**: Verify the new setting that allows video display while keeping ad management active

**Steps**:
1. Open the AnomTube popup
2. Scroll to "Lisäasetukset" (Additional Settings)
3. Enable "Salli video + mainosten hallinta" (Allow video + ad management)
4. Navigate to a YouTube video
5. Ensure AnomTube is enabled

**Expected Result**:
- The video should be visible (not replaced with placeholder)
- Ad settings (mute, skip, block) should still function
- If "Mainokset ASAP POIS" is enabled, ads should still be skipped
- If "Mainosten ääni" is enabled, ads should still be muted

**Steps to Verify Default Behavior**:
1. Disable "Salli video + mainosten hallinta"
2. Refresh the page

**Expected Result**:
- Video should now be hidden with the audio-only placeholder
- Ad settings should still work

**Pass Criteria**: ✅ Video visible when enabled, hidden when disabled, ad controls work in both modes

---

### Test 5: Settings Persistence
**Purpose**: Verify that all settings are saved and restored correctly

**Steps**:
1. Open the AnomTube popup
2. Enable various settings:
   - Enable AnomTube
   - Enable "Piilota lyriikka-popup"
   - Enable "Salli video + mainosten hallinta"
   - Enable "Mainokset ASAP POIS"
3. Close the popup
4. Navigate away from YouTube
5. Navigate back to YouTube
6. Open the AnomTube popup again

**Expected Result**:
- All settings should be in the same state as before
- The settings should be reflected in the actual behavior on the page

**Pass Criteria**: ✅ All settings persist across browser sessions and page navigations

---

### Test 6: Backwards Compatibility
**Purpose**: Ensure existing functionality is not broken

**Steps**:
1. Test all original features with default settings:
   - Audio-only mode (video blocking)
   - Lyrics display and synchronization
   - Manual lyrics retry
   - Lyrics popup dragging
   - Lyrics collapse/expand
   - Custom logo and background upload
   - Ad muting
   - Ad blocking

**Expected Result**:
- All original features should work as before
- No console errors
- No visual glitches or UI problems

**Pass Criteria**: ✅ All existing features work without issues

---

## Regression Testing

### Edge Cases to Test:
1. **Rapid setting changes**: Toggle settings on/off rapidly - should not cause crashes
2. **Multiple tabs**: Open multiple YouTube tabs with different settings
3. **Page navigation**: Test settings when navigating between different YouTube pages
4. **Browser restart**: Close and reopen browser, verify settings persist
5. **Extension reload**: Reload the extension, verify it initializes correctly

## Known Limitations
- Ad skipper rate limiting is per-button per minute (max 3 attempts)
- MutationObserver watches the `.html5-video-player` container or body
- Some ads may not have skip buttons detectable by the current selectors

## Reporting Issues
If you encounter any issues during testing, please report:
1. Browser version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console error messages (if any)
5. Screenshots or screen recordings (if applicable)

## Success Metrics
All tests should pass with ✅ for the update to be considered successful.
