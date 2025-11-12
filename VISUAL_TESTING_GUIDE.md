# Visual Testing Guide - AnomTube v2.1.0

## 🎨 UI Changes Overview

This guide provides visual descriptions of the new UI elements and expected behaviors for manual testing.

---

## 1. Popup UI Changes

### Location: Extension Popup (click extension icon)

### New Section: "UI-asetukset" (UI Settings)

**Expected Layout:**
```
┌─────────────────────────────────────────┐
│  AnomFIN Ad Shield                      │
│  ├─ Mainosten ääni              [toggle]│
│  ├─ Mainokset ASAP POIS         [toggle]│
│  ├─ Mainokset                   [toggle]│
│  ├─ Ohita automaattisesti       [toggle]│ ← NEW
│  └─ Salli video, pidä mainosten [toggle]│ ← NEW
│                                          │
│  UI-asetukset                           │ ← NEW SECTION
│  ├─ Piilota lyriikka-popup      [toggle]│ ← NEW
│  └─ Laajenna työkalupalkki      [toggle]│ ← NEW (default ON)
└─────────────────────────────────────────┘
```

### Toggle States
- **ON:** Blue/purple gradient background, toggle knob on right
- **OFF:** Gray background, toggle knob on left
- All toggles should respond immediately to clicks

---

## 2. Toolbar Width Changes

### Test: Expanded Toolbar (Default)

**Setting:** Laajenna työkalupalkki = ON

**Expected Appearance:**
```
┌────────────────────────────────────────────┐
│  [AnomFIN Logo]  AnomFIN Tools             │  ← Spacious
│                  Karaoke Console           │
│                                  [Piilota] │
│                                            │
│  🎵 Song Title Here                        │
│  ARTIST NAME                               │
│                                            │
│  ● Synkronoidut lyriikat                   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Lyric line 1                         │ │  ← Wide
│  │ Lyric line 2                         │ │
│  │ Lyric line 3                         │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Made by: Jugi @ AnomFIN                   │
└────────────────────────────────────────────┘
     Min-width: 220px
```

### Test: Compact Toolbar

**Setting:** Laajenna työkalupalkki = OFF

**Expected Appearance:**
```
┌───────────────────────────────┐
│  [Logo] AnomFIN Tools         │  ← Compact
│         Karaoke Console       │
│                     [Piilota] │
│                               │
│  🎵 Song Title                │
│  ARTIST                       │
│                               │
│  ● Synkronoidut lyriikat      │
│                               │
│  ┌─────────────────────────┐ │
│  │ Lyric line 1            │ │  ← Narrower
│  │ Lyric line 2            │ │
│  │ Lyric line 3            │ │
│  └─────────────────────────┘ │
│                               │
│  Made by: Jugi @ AnomFIN      │
└───────────────────────────────┘
     Min-width: 180px
```

**How to Verify:**
1. Open DevTools (F12)
2. Inspect lyrics console element
3. Check computed width in Styles panel
4. Toggle setting and observe width change

---

## 3. Popup Visibility

### Test: Popup Visible (Default)

**Setting:** Piilota lyriikka-popup = OFF

**Expected:**
```
YouTube Page
├─ Video Player (hidden if standard mode)
├─ Video Controls
└─ Lyrics Console ✅ (bottom-right corner)
   └─ Draggable, visible, functional
```

### Test: Popup Hidden

**Setting:** Piilota lyriikka-popup = ON

**Expected:**
```
YouTube Page
├─ Video Player (hidden if standard mode)
├─ Video Controls
└─ Lyrics Console ❌ (not visible)
   └─ Element exists in DOM but display: none
```

**DevTools Check:**
```javascript
// In console:
const popup = document.getElementById('anomfin-lyrics-console');
console.log(popup.style.display); // Should be "none"
console.log(popup.style.visibility); // Should be "hidden"
```

---

## 4. Video Display Modes

### Mode A: Standard Audio-Only (Default)

**Settings:**
- Salli video, pidä mainosten esto = OFF
- Any ad settings = ON/OFF

**Expected:**
```
┌────────────────────────────────────────┐
│                                        │
│     [AnomFIN Audio Only Placeholder]   │ ← Visible
│                                        │
│  Video player is hidden                │
│  Audio plays normally                  │
│                                        │
└────────────────────────────────────────┘
    [▶ ⏸ ⏭ Volume Controls]
```

### Mode B: Video with Ad Settings

**Settings:**
- Salli video, pidä mainosten esto = ON
- Any ad settings = ON

**Expected:**
```
┌────────────────────────────────────────┐
│                                        │
│     [YouTube Video Playing]            │ ← Video visible!
│                                        │
│  Video player is VISIBLE               │
│  Ads are still controlled by settings  │
│                                        │
└────────────────────────────────────────┘
    [▶ ⏸ ⏭ Volume Controls]
```

**Visual Difference:**
- Mode A: See AnomFIN branded placeholder
- Mode B: See actual YouTube video

---

## 5. Auto-Skip Ads Behavior

### Test: Manual Skip (Original Behavior)

**Setting:** Ohita automaattisesti = OFF

**Expected:**
```
Ad plays
↓
Wait 5 seconds
↓
"Skip Ad" button appears
↓
YOU MUST CLICK IT MANUALLY ← User action required
↓
Ad is skipped
```

### Test: Auto-Skip (New Feature)

**Setting:** Ohita automaattisesti = ON

**Expected:**
```
Ad plays
↓
Wait 5 seconds
↓
"Skip Ad" button appears
↓
AUTOMATICALLY CLICKED ← No user action!
↓
Ad is skipped immediately
```

**Visual Indicator:**
- No visual change (button clicks automatically)
- Ad should skip almost instantly when button appears
- Check console for any errors

---

## 6. Responsive Behavior

### Desktop (1920px+)
```
Expanded: 380px max-width
Compact:  300px max-width
Spacious layout, all features visible
```

### Tablet (900px - 1024px)
```
Expanded: Adapts to min(100%, calc(100vw - 24px))
Compact:  Slightly narrower
Responsive font sizes
```

### Mobile (< 560px)
```
Expanded: Min-width 200px
Compact:  Min-width 160px
Stacked layout, compact controls
```

**Test Method:**
1. Open DevTools
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select different device sizes
4. Verify toolbar adapts smoothly
5. Check no overflow or layout breaks

---

## 7. DOM Inspection Checklist

### Check Body Attributes
```html
<body data-anomtube-expand-toolbar="true">  ← When expanded
<body data-anomtube-expand-toolbar="false"> ← When compact
```

### Check Popup Element
```html
<aside id="anomfin-lyrics-console" class="anomfin-lyrics">
  <!-- When hidden: -->
  <div style="display: none; visibility: hidden; pointer-events: none;">
  
  <!-- When visible: -->
  <div style="display: ''; visibility: ''; pointer-events: '';">
</aside>
```

### Check Video Element
```html
<!-- Mode A (video hidden): -->
<video style="display: none;"></video>
<div id="anomtube-placeholder">...</div> ← Placeholder visible

<!-- Mode B (video visible): -->
<video style="display: '';"></video>
<!-- No placeholder -->
```

---

## 8. Console Messages

### Expected Console Logs (No Errors)
```javascript
// On activation:
"AnomTube activated"

// On setting changes:
[No errors, smooth updates]

// During ad skipping:
[No warnings about failed clicks]
```

### Unexpected Console Messages (Report These)
```javascript
// ❌ Should NOT see:
"Failed to dispatch click"
"Ad control loop error"
"Failed to load settings"
"MutationObserver error"
```

---

## 9. Testing Scenarios Matrix

| Test Case | Expand Toolbar | Hide Popup | Allow Video | Auto-Skip | Expected Result |
|-----------|---------------|------------|-------------|-----------|-----------------|
| 1         | ✓             | ✗          | ✗           | ✗         | Wide popup, video hidden, manual skip |
| 2         | ✗             | ✗          | ✗           | ✗         | Compact popup, video hidden, manual skip |
| 3         | ✓             | ✓          | ✗           | ✗         | No popup, video hidden, manual skip |
| 4         | ✓             | ✗          | ✓           | ✗         | Wide popup, video visible, manual skip |
| 5         | ✓             | ✗          | ✗           | ✓         | Wide popup, video hidden, auto skip |
| 6         | ✓             | ✗          | ✓           | ✓         | Wide popup, video visible, auto skip |
| 7         | ✗             | ✓          | ✓           | ✓         | No popup, video visible, auto skip |
| 8         | ✓             | ✓          | ✓           | ✓         | No popup, video visible, auto skip |

**Test each scenario:**
1. Set toggles as shown
2. Navigate to YouTube video
3. Verify all expected behaviors
4. Toggle settings during playback
5. Verify immediate effect

---

## 10. Performance Checks

### Memory Usage (Chrome Task Manager)
```
Before enabling: [Baseline]
After enabling:  [Baseline + ~10KB] ← Acceptable
After 30 mins:   [No significant growth] ← No leaks
```

### CPU Usage (During Ad)
```
Without auto-skip: [Normal]
With auto-skip:    [Normal + <5%] ← Acceptable
```

### Page Load Speed
```
Extension OFF: [X seconds]
Extension ON:  [X + <0.5 seconds] ← Minimal impact
```

---

## 11. Edge Case Scenarios

### Scenario A: Rapid Toggle
1. Toggle settings on/off repeatedly (5x in 10 seconds)
2. Expected: Extension remains stable, no errors
3. Settings persist correctly

### Scenario B: Multiple Tabs
1. Open 3 YouTube tabs with extension enabled
2. Expected: Each tab works independently
3. Settings apply to all tabs

### Scenario C: YouTube Navigation
1. Click through multiple videos via recommendations
2. Expected: Settings persist, lyrics reload
3. No memory leaks or performance degradation

### Scenario D: Mid-Video Toggle
1. Play video with lyrics showing
2. Toggle popup visibility ON/OFF
3. Expected: Immediate effect, no reload needed
4. Lyrics sync continues when re-enabled

---

## ✅ Visual Acceptance Criteria

After testing, verify:

- [ ] All 4 new toggles appear in popup
- [ ] Toolbar width changes are visible
- [ ] Popup hides/shows correctly
- [ ] Video shows/hides based on setting
- [ ] Auto-skip works on actual ads
- [ ] No layout breaks at any screen size
- [ ] No console errors during normal use
- [ ] Settings persist across page loads
- [ ] Performance remains acceptable
- [ ] All existing features still work

---

## 📸 Screenshot Checklist

Capture screenshots of:
1. Popup with all new settings
2. Expanded toolbar (220px)
3. Compact toolbar (180px)
4. Hidden popup state
5. Video visible with ad settings
6. Auto-skip in action (if possible)

---

**For Questions or Issues:**
See TEST_INSTRUCTIONS_V2.md for detailed test cases.
