# Test Instructions for AnomTube v2.1.0

## Overview
This update introduces modular architecture with new settings for toolbar width, popup visibility, video display control, and improved ad skipping capabilities.

## Pre-Testing Setup

1. **Load the Extension**
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory
   - Verify the extension appears in your browser toolbar

2. **Clear Previous Settings** (if upgrading from previous version)
   - Right-click the extension icon
   - Select "Options" or click the icon to open popup
   - Clear browser storage via DevTools Console:
     ```javascript
     chrome.storage.sync.clear();
     chrome.storage.local.clear();
     ```

## Test Cases

### 1. New Settings in Popup

**Test 1.1: Verify All New Settings Are Present**
- [ ] Open extension popup
- [ ] Verify these new settings exist:
  - "Ohita automaattisesti" (Auto-click Skip ads)
  - "Salli video, pidä mainosten esto" (Allow video but keep ad settings)
  - "Piilota lyriikka-popup" (Hide lyric popup completely)
  - "Laajenna työkalupalkki" (Expand toolbar)
- [ ] All toggles should be interactive

**Test 1.2: Settings Persistence**
- [ ] Toggle each new setting on/off
- [ ] Close and reopen popup
- [ ] Verify settings are preserved
- [ ] Refresh YouTube page
- [ ] Verify settings still work correctly

### 2. Toolbar Width Settings

**Test 2.1: Expanded Toolbar (Default)**
- [ ] Ensure "Laajenna työkalupalkki" is ON (default)
- [ ] Enable AnomTube on a YouTube video
- [ ] Open browser DevTools and inspect the lyrics console
- [ ] Verify `data-anomtube-expand-toolbar="true"` on body element
- [ ] Verify lyrics panel min-width is 220px
- [ ] Panel should be wider and more spacious

**Test 2.2: Compact Toolbar**
- [ ] Disable "Laajenna työkalupalkki" setting
- [ ] Verify `data-anomtube-expand-toolbar="false"` on body element
- [ ] Verify lyrics panel min-width reduces to 180px
- [ ] Panel should become more compact

**Test 2.3: Responsive Behavior**
- [ ] Test on different window sizes (1920px, 1024px, 768px, 560px)
- [ ] Verify toolbar adapts appropriately at each breakpoint
- [ ] Check mobile viewport (DevTools device emulation)
- [ ] Ensure no layout breaks or overflow issues

### 3. Hide Lyric Popup Feature

**Test 3.1: Popup Hidden**
- [ ] Enable AnomTube
- [ ] Enable "Piilota lyriikka-popup" setting
- [ ] Navigate to a YouTube video
- [ ] Verify lyrics console is NOT visible on page
- [ ] Check DevTools: Element should exist but be hidden (display: none)

**Test 3.2: Popup Shown (Default)**
- [ ] Disable "Piilota lyriikka-popup" setting
- [ ] Navigate to a YouTube video
- [ ] Verify lyrics console IS visible
- [ ] Lyrics should load and display normally

**Test 3.3: Dynamic Toggle**
- [ ] Start with popup visible
- [ ] Enable "Piilota lyriikka-popup" while on a video
- [ ] Popup should immediately hide
- [ ] Disable "Piilota lyriikka-popup"
- [ ] Popup should immediately reappear

### 4. Video Display with Ad Settings

**Test 4.1: Standard Behavior (Video Hidden)**
- [ ] Ensure "Salli video, pidä mainosten esto" is OFF
- [ ] Enable AnomTube with any ad setting enabled
- [ ] Navigate to a YouTube video
- [ ] Video should be hidden with AnomFIN placeholder shown
- [ ] Audio should play normally

**Test 4.2: Allow Video with Ad Settings**
- [ ] Enable "Salli video, pidä mainosten esto" setting
- [ ] Enable at least one ad setting (e.g., "Mainosten ääni")
- [ ] Navigate to a YouTube video
- [ ] Video should be VISIBLE (not blocked)
- [ ] Ad settings should still work (e.g., ads muted)
- [ ] Verify video plays normally

**Test 4.3: Ad Skipper Works Without Video Block**
- [ ] Enable "Salli video, pidä mainosten esto"
- [ ] Enable "Ohita automaattisesti"
- [ ] Navigate to a video with ads
- [ ] Video should be visible
- [ ] Skip button should be auto-clicked when ads appear
- [ ] Ad blocking features should still function

### 5. Auto-Click Skip Ads (adSkipper Module)

**Test 5.1: Basic Auto-Skip**
- [ ] Enable "Ohita automaattisesti" setting
- [ ] Navigate to a video with skippable ads
- [ ] Wait for ad to start
- [ ] Skip button should be automatically clicked
- [ ] Ad should be skipped immediately when button appears

**Test 5.2: Multiple Click Methods**
- [ ] Test on different ad types:
  - Pre-roll ads
  - Mid-roll ads
  - Overlay banner ads
- [ ] Verify ads are consistently skipped
- [ ] Check DevTools Console for any errors

**Test 5.3: Rate Limiting**
- [ ] Watch multiple ads in sequence
- [ ] Verify skip attempts are rate-limited (300ms between attempts)
- [ ] No excessive clicking or performance issues

**Test 5.4: MutationObserver Behavior**
- [ ] Enable DevTools Performance monitor
- [ ] Watch several videos with ads
- [ ] Verify no memory leaks or excessive DOM observations
- [ ] CPU usage should remain reasonable

### 6. Integration Testing

**Test 6.1: All Settings Combined**
- [ ] Enable all new settings together:
  - Auto-click skip ads: ON
  - Allow video + ad settings: ON
  - Hide popup: ON
  - Expand toolbar: ON
- [ ] Navigate to YouTube video
- [ ] Verify:
  - Video is visible
  - Popup is hidden
  - Ads are auto-skipped
  - No JavaScript errors

**Test 6.2: Settings Changes During Playback**
- [ ] Start playing a video with AnomTube enabled
- [ ] Toggle each setting on/off while video plays
- [ ] Verify immediate effect without page reload
- [ ] Audio/video playback should not interrupt

**Test 6.3: Browser Compatibility**
- [ ] Test on Chrome (latest)
- [ ] Test on Edge (latest)
- [ ] Test on Brave (if available)
- [ ] All features should work consistently

### 7. Edge Cases and Error Handling

**Test 7.1: YouTube Navigation**
- [ ] Enable AnomTube with various settings
- [ ] Navigate between videos using:
  - Next video button
  - Recommended videos
  - Search results
  - Playlist navigation
- [ ] Settings should persist and work correctly

**Test 7.2: Ad Blocker Conflicts**
- [ ] Test with other ad blockers enabled (uBlock, AdBlock)
- [ ] Verify no conflicts or errors
- [ ] Both should work harmoniously

**Test 7.3: Rapid Setting Changes**
- [ ] Rapidly toggle settings on/off
- [ ] Verify no race conditions or state corruption
- [ ] Extension should remain stable

**Test 7.4: Long Session**
- [ ] Keep browser open with extension for 30+ minutes
- [ ] Play multiple videos
- [ ] Toggle settings occasionally
- [ ] Verify no memory leaks or performance degradation

### 8. Performance Testing

**Test 8.1: Page Load Time**
- [ ] Measure YouTube load time with extension disabled
- [ ] Measure YouTube load time with extension enabled
- [ ] Difference should be minimal (<500ms)

**Test 8.2: CPU Usage**
- [ ] Monitor CPU usage in Task Manager
- [ ] Compare with/without extension
- [ ] With adSkipper running during ads
- [ ] Should not exceed 5-10% CPU increase

**Test 8.3: Memory Usage**
- [ ] Monitor memory in Chrome Task Manager
- [ ] Extension should use <50MB of memory
- [ ] No significant memory growth over time

## Expected Results Summary

### ✅ Success Criteria
- All new settings appear in popup and function correctly
- Settings persist across browser sessions
- Toolbar width responds to expand/collapse setting
- Popup can be hidden completely when setting is enabled
- Video can remain visible while ad settings still work
- Auto-click skip ads uses MutationObserver efficiently
- No JavaScript errors in console
- Smooth user experience without performance issues
- All existing features continue to work

### ❌ Known Limitations
- Auto-skip depends on YouTube's ad button structure (may break with YouTube updates)
- MutationObserver may trigger frequently on dynamic pages
- Some ad types may not be caught by all skip methods

## Reporting Issues

If you encounter any issues during testing, please report:
1. Browser and version
2. Which test case failed
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots or video (if applicable)

## Regression Testing

After all new features are tested, verify these existing features still work:
- [ ] Basic audio-only mode
- [ ] Lyrics display and synchronization
- [ ] Caption fallback when lyrics unavailable
- [ ] Drag-and-drop lyrics window
- [ ] Custom logo/background upload
- [ ] Existing ad settings (mute, skip, block)
- [ ] Manual retry for lyrics
- [ ] Lyrics collapse/expand
- [ ] YouTube navigation handling
