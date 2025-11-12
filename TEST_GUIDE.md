# JugiTube Feature Implementation - Test Guide

## Overview
This PR implements comprehensive settings management, toolbar width control, modular ad skipping, and lyric popup handling for the JugiTube extension.

## Reference Image
See `image1` from the problem statement for visual reference of the expected behavior.

---

## Test Scenarios

### 1. Settings Page Functionality

#### Test 1.1: Access Settings Page
**Steps:**
1. Install/load the extension in Chrome
2. Right-click the extension icon in toolbar
3. Select "Options" from context menu
4. Verify settings page opens at `src/options/options.html`

**Expected Result:**
- Settings page displays with AnomFIN branding
- Four toggle switches visible:
  - Laajenna työkalurivi (Expand Toolbar)
  - Piilota lyriikka-popup (Hide Lyric Popup)
  - Salli video mainosasetusten kanssa (Allow Video Keep Ad Settings)
  - Klikkaa "Ohita" automaattisesti (Auto Click Skips)

#### Test 1.2: Toggle Settings and Persistence
**Steps:**
1. Toggle each setting ON and OFF
2. Verify green success message appears: "Asetukset tallennettu!"
3. Close and reopen settings page
4. Verify all settings retain their last state

**Expected Result:**
- Settings save to localStorage key 'jugitube_settings_v1'
- Settings persist across page reloads
- Success message displays for 2 seconds after each change

#### Test 1.3: Default Settings
**Steps:**
1. Clear localStorage: `localStorage.removeItem('jugitube_settings_v1')`
2. Open settings page

**Expected Result:**
- expandToolbar: ON (true)
- hideLyricPopup: OFF (false)
- allowVideoKeepAdSettings: OFF (false)
- autoClickSkips: ON (true)

---

### 2. Toolbar Width Control

#### Test 2.1: Expanded Toolbar (Desktop)
**Steps:**
1. Set expandToolbar: ON
2. Navigate to YouTube.com
3. Open DevTools → Elements
4. Inspect YouTube sidebar (#guide-inner, ytd-guide-renderer)

**Expected Result:**
- CSS variable `--jugitube-toolbar-width` is set to 220px
- Sidebar width is 220px
- Body attribute `jugitube-toolbar-collapsed` is NOT present

#### Test 2.2: Collapsed Toolbar
**Steps:**
1. Set expandToolbar: OFF
2. Navigate to YouTube.com
3. Inspect YouTube sidebar

**Expected Result:**
- Body attribute `jugitube-toolbar-collapsed="true"` is present
- Sidebar width is 72px

#### Test 2.3: Responsive Toolbar (Tablet)
**Steps:**
1. Set expandToolbar: ON
2. Resize browser window to 768px width or less
3. Inspect sidebar

**Expected Result:**
- `--jugitube-toolbar-width` is 180px (from media query)

#### Test 2.4: Responsive Toolbar (Mobile)
**Steps:**
1. Set expandToolbar: ON
2. Resize browser window to 480px width or less
3. Inspect sidebar

**Expected Result:**
- `--jugitube-toolbar-width` is 60px (from media query)

---

### 3. Ad Skipper Module

#### Test 3.1: Auto-Click Skip Ads
**Steps:**
1. Set autoClickSkips: ON
2. Open YouTube video with pre-roll ad
3. Open DevTools → Console
4. Wait for "Skip Ad" button to appear

**Expected Result:**
- Console shows: "[JugiTube AdSkipper] Clicked element using native click()"
- Skip button is automatically clicked
- Ad is skipped immediately when button becomes available

#### Test 3.2: Rate Limiting
**Steps:**
1. Set autoClickSkips: ON
2. Open Console and monitor logs
3. Play multiple ads in succession

**Expected Result:**
- Console shows rate-limiting messages
- Maximum 3 clicks per element (PER_ELEMENT_LIMIT)
- Minimum 1 second between clicks (MIN_INTERVAL_MS)
- Console: "[JugiTube AdSkipper] Skipping click due to global rate limit"

#### Test 3.3: Visibility Check
**Steps:**
1. Set autoClickSkips: ON
2. Inspect page for hidden skip buttons using DevTools
3. Verify only visible buttons are clicked

**Expected Result:**
- Hidden buttons (display:none, visibility:hidden, opacity:0) are NOT clicked
- Only visible, clickable buttons are targeted

#### Test 3.4: Multiple Selectors
**Steps:**
1. Set autoClickSkips: ON
2. Test on different YouTube ad types:
   - Standard video ads
   - Overlay banner ads
   - Modern ad formats

**Expected Result:**
- All ad types are handled with appropriate selectors:
  - `button.ytp-ad-skip-button`
  - `.ytp-ad-skip-button-modern`
  - `.ytp-ad-overlay-close-button`
  - etc.

#### Test 3.5: Disabled Auto-Click
**Steps:**
1. Set autoClickSkips: OFF
2. Open YouTube video with ad

**Expected Result:**
- Skip buttons are NOT automatically clicked
- Console shows: "[JugiTube AdSkipper] Auto-click skips disabled in settings"
- User must manually click "Skip Ad"

---

### 4. Lyric Handler Module

#### Test 4.1: Hide Lyric Popups
**Steps:**
1. Set hideLyricPopup: ON
2. Navigate to YouTube Music or video with lyrics
3. Look for lyric popup elements

**Expected Result:**
- Lyric popups are removed from DOM or hidden
- Console shows: "[JugiTube LyricHandler] Removed lyric popup: .lyric-popup"
- No lyric overlays visible on page

#### Test 4.2: Multiple Lyric Selectors
**Steps:**
1. Set hideLyricPopup: ON
2. Test on different YouTube pages:
   - YouTube Music
   - Regular YouTube with lyrics
   - Videos with custom lyric overlays

**Expected Result:**
- All lyric popup types are handled:
  - `.lyric-popup`
  - `#lyrics-popup`
  - `.lyrics-overlay`
  - `ytmusic-lyrics-renderer`

#### Test 4.3: Disabled Lyric Hiding
**Steps:**
1. Set hideLyricPopup: OFF
2. Navigate to page with lyrics

**Expected Result:**
- Lyric popups remain visible
- Console shows: "[JugiTube LyricHandler] Lyric popup hiding disabled in settings"

---

### 5. Video Blocking with Ad Settings

#### Test 5.1: Normal Video Blocking (Default Behavior)
**Steps:**
1. Set allowVideoKeepAdSettings: OFF
2. Enable AnomTube extension
3. Navigate to YouTube video

**Expected Result:**
- Video element is hidden (display: none)
- Audio-only placeholder is displayed
- AnomTube branding and features visible
- Console shows: "AnomTube activated"

#### Test 5.2: Allow Video with Ad Settings
**Steps:**
1. Set allowVideoKeepAdSettings: ON
2. Enable AnomTube extension
3. Navigate to YouTube video

**Expected Result:**
- Video remains visible (NOT hidden)
- No audio-only placeholder
- Ad controls still active (skip ads, mute ads work)
- Console shows: "Video blocking disabled by jugitubeSettings.allowVideoKeepAdSettings = true"

#### Test 5.3: Ad Controls Still Work
**Steps:**
1. Set allowVideoKeepAdSettings: ON
2. Enable skip ads, mute ads in popup
3. Play video with ads

**Expected Result:**
- Ads are still skipped automatically
- Ads are muted if enabled
- Video blocking is disabled but ad handling works

---

### 6. Module Initialization and Coordination

#### Test 6.1: Settings Load Order
**Steps:**
1. Open YouTube page
2. Open DevTools → Console
3. Look for initialization logs

**Expected Result:**
- Log sequence:
  1. "[JugiTube] Settings applied: {expandToolbar: true, ...}"
  2. "[JugiTube AdSkipper] Initializing ad skipper..."
  3. "[JugiTube LyricHandler] Initializing lyric handler..."
  4. "[JugiTube Main] JugiTube Main initializing..."
  5. "AnomTube activated"

#### Test 6.2: Settings Change Propagation
**Steps:**
1. Open settings page in one tab
2. Open YouTube in another tab
3. Change settings
4. Check YouTube tab console

**Expected Result:**
- Console shows: "JugiTube settings changed, reapplying..."
- Modules reinitialize with new settings
- Changes take effect without page reload

---

### 7. Performance and Resource Usage

#### Test 7.1: MutationObserver Performance
**Steps:**
1. Open DevTools → Performance
2. Start recording
3. Play video for 30 seconds
4. Stop recording
5. Analyze MutationObserver activity

**Expected Result:**
- MutationObserver callbacks run at reasonable intervals
- No excessive DOM traversal
- CPU usage remains under 5% for extension

#### Test 7.2: Rate Limiting Effectiveness
**Steps:**
1. Monitor Console for rate limit messages
2. Play multiple ads
3. Count click attempts

**Expected Result:**
- Maximum 3 attempts per element
- Minimum 1 second between attempts
- Rate limiting prevents click spam

---

### 8. Error Handling and Edge Cases

#### Test 8.1: Missing Settings
**Steps:**
1. Clear localStorage
2. Reload YouTube page
3. Check Console for errors

**Expected Result:**
- No JavaScript errors
- Default settings are used
- Console shows: "[JugiTube] Settings applied: {expandToolbar: true, ...}"

#### Test 8.2: Invalid Settings Data
**Steps:**
1. Set localStorage.setItem('jugitube_settings_v1', 'invalid json')
2. Reload YouTube page

**Expected Result:**
- No JavaScript errors
- Falls back to default settings
- Console shows error: "[JugiTube] Failed to load settings: ..."

#### Test 8.3: Missing DOM Elements
**Steps:**
1. Navigate to non-YouTube page with extension active
2. Check Console

**Expected Result:**
- No errors for missing YouTube elements
- Modules gracefully handle missing elements
- No continuous error spam

---

## Security Validation

### CodeQL Results
- **Status**: ✅ PASSED
- **Alerts**: 0
- **Language**: JavaScript
- **Analysis**: No security vulnerabilities detected

---

## Performance Benchmarks

### Expected Performance Metrics:
- **Settings Load Time**: < 10ms
- **MutationObserver Callbacks**: < 100ms execution
- **Ad Skip Detection**: < 500ms after button appears
- **Memory Usage**: < 10MB additional
- **CPU Usage**: < 5% during active playback

---

## Known Limitations

1. **YouTube UI Changes**: If YouTube updates their ad button selectors, ad skipping may stop working until selectors are updated
2. **Custom Lyrics**: Third-party lyric extensions may use different selectors not covered
3. **Browser Compatibility**: Tested on Chrome; may require adjustments for Firefox
4. **Rate Limiting**: Aggressive ads may still show briefly before rate limit allows next click

---

## Rollback Plan

If issues are encountered:
1. Disable extension from chrome://extensions
2. Or toggle individual features OFF in settings page
3. Or set `allowVideoKeepAdSettings: ON` to restore video visibility

---

## Change Log

### Added
- Settings page with 4 configurable options
- CSS variable `--jugitube-toolbar-width` for responsive toolbar
- Modular `adSkipper.js` with rate limiting and safe clicking
- Modular `lyricHandler.js` for popup management
- `main.js` coordinator for module initialization
- `settings-apply.js` for settings loading and CSS application

### Changed
- `manifest.json`: Added content scripts and options page
- `content.js`: Conditional video blocking based on settings

### Fixed
- Video blocking logic now respects `allowVideoKeepAdSettings` flag

---

## Changelog (suomeksi)

### Lisätty
- Asetussivu 4 säädettävällä asetuksella
- CSS-muuttuja `--jugitube-toolbar-width` responsiiviselle työkaluriville
- Modulaarinen `adSkipper.js` rajoituksilla ja turvallisella klikkauksella
- Modulaarinen `lyricHandler.js` ponnahdusikkunoiden hallintaan
- `main.js` koordinaattori moduulien alustukseen
- `settings-apply.js` asetusten lataamiseen ja CSS:n soveltamiseen

### Muutettu
- `manifest.json`: Lisätty content scriptit ja asetussivu
- `content.js`: Ehdollinen videon esto asetusten perusteella

### Korjattu
- Videon estologiikka kunnioittaa nyt `allowVideoKeepAdSettings`-lippua

---

## Made by
**Jugi @ AnomFIN · AnomTools**
