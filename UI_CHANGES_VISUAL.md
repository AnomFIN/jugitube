# Visual UI Changes Summary

## New Settings in Popup UI

### Additional Settings Section (Lisäasetukset)

The popup now includes a new settings section with two new toggles:

```
┌─────────────────────────────────────────────────────────────┐
│  Lisäasetukset                                               │
│  Muokkaa lyriikka- ja videoasetuksia                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Piilota lyriikka-popup                           [⚪]  │  │
│  │  Piilottaa karaoke-konsolipopupin kokonaan       OFF   │  │
│  │  näytöltä. Lyriikka-ikkunaa ei luoda.                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Salli video + mainosten hallinta                [⚪]  │  │
│  │  Näyttää videon mutta pitää mainosten           OFF   │  │
│  │  automaattisen hallinnan päällä.                       │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Settings Location in Popup

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [AnomFIN Logo]  AnomFIN Tools · AnomTube                    │
│                  Audio only- tube · Powered by AnomTools     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Audio only cockpit                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Enable AnomTube                               [🔘]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AnomFIN Ad Shield                                           │
│  Hallinnoi mainosten hallintaa                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mainosten ääni                                [⚪]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mainokset ASAP POIS                           [⚪]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mainokset                                     [⚪]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Lisäasetukset                          ← NEW SECTION        │
│  Muokkaa lyriikka- ja videoasetuksia                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Piilota lyriikka-popup                        [⚪]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Salli video + mainosten hallinta              [⚪]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AnomFIN Visual Suite                                        │
│  [Custom background and logo upload section]                │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Extension is active                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Lyrics Console Width Comparison

### Before (300px minimum):
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  AnomFIN Tools                                   │
│          AnomTools Karaoke Console         [Piilota]    │
├─────────────────────────────────────────────────────────┤
│  🎵 AnomTube Lyrics                                      │
│  Karaoke Mode Active                                     │
├─────────────────────────────────────────────────────────┤
│  ● AnomFIN analysoi kappaletta...                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Lyrics display area...                                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
        Minimum width: 300px (sometimes too wide)
```

### After (220px minimum):
```
┌──────────────────────────────────────────────┐
│  [Logo]  AnomFIN Tools         [Piilota]    │
│          AnomTools Karaoke Console          │
├──────────────────────────────────────────────┤
│  🎵 AnomTube Lyrics                          │
│  Karaoke Mode Active                         │
├──────────────────────────────────────────────┤
│  ● AnomFIN analysoi kappaletta...            │
├──────────────────────────────────────────────┤
│                                               │
│  Lyrics display area...                      │
│                                               │
└──────────────────────────────────────────────┘
     Minimum width: 220px (more responsive)
```

## Behavior Changes

### 1. Hide Lyrics Popup (hideLyrics = true)
```
YouTube Page with AnomTube Active:
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [Audio Only Placeholder]                                │
│  or                                                       │
│  [Video Playing] (if allowVideo = true)                  │
│                                                           │
│  NO LYRICS CONSOLE VISIBLE ✗                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 2. Allow Video + Ad Controls (allowVideo = true)
```
YouTube Page with AnomTube Active:
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [VIDEO IS VISIBLE AND PLAYING] ✓                        │
│                                                           │
│  ┌───────────────────────────┐                           │
│  │  [Lyrics Console]         │ ← Still shows unless      │
│  │  🎵 Song Title            │   hideLyrics is true      │
│  │  Artist Name              │                           │
│  │  ● Lyrics synced          │                           │
│  └───────────────────────────┘                           │
│                                                           │
│  Ad controls active:                                      │
│  - Ads muted (if enabled)                                │
│  - Ads skipped (if enabled)                              │
│  - Ads blocked (if enabled)                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 3. Default Behavior (allowVideo = false, hideLyrics = false)
```
YouTube Page with AnomTube Active:
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Audio Only Placeholder]                       │    │
│  │  AnomFIN Tools Logo                             │    │
│  │  Audio Only Mode                                │    │
│  │  Focus on fidelity...                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌───────────────────────────┐                           │
│  │  [Lyrics Console]         │                           │
│  │  🎵 Song Title            │                           │
│  │  Artist Name              │                           │
│  │  ● Lyrics synced          │                           │
│  └───────────────────────────┘                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Ad Skip Mechanism Visualization

### Old Method:
```
Timer Loop (300ms) → Check for button → Try click once
                      ↓
                      Limited selectors
                      No rate limiting
                      May miss dynamically added buttons
```

### New Method (MutationObserver):
```
MutationObserver → DOM Change Detected
                   ↓
                   Check if ad-related element added/changed
                   ↓
                   Wait 100ms for DOM stabilization
                   ↓
                   Search with multiple selectors:
                   - .ytp-ad-skip-button.ytp-button
                   - .ytp-ad-skip-button-modern.ytp-button
                   - .ytp-ad-skip-button-modern
                   - .ytp-ad-skip-button
                   - button.ytp-ad-skip-button-modern
                   - .ytp-skip-ad-button
                   ↓
                   Rate limit check (max 3/min per button)
                   ↓
                   Try multiple click methods:
                   1. button.click()
                   2. PointerEvent dispatch
                   ↓
                   Track attempt with timestamp
```

## Toggle States

All toggles follow the same visual pattern:
- **OFF**: ⚪ (white circle on left, gray background)
- **ON**: 🔘 (white circle on right, blue gradient background with glow)

## Color Scheme
- Active state: Blue gradient (#6ca8ff to #b56cff)
- Inactive state: Gray/transparent
- Success indicators: Green
- Error indicators: Red
- Info indicators: Blue
