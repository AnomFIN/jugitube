# Manual Testing Instructions for logo_ANOMFIN_AUTOMATED_AI.png Changes

## Setup
1. Load the extension in Chrome/Edge:
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `jugitube` folder

## Test Cases

### Test 1: Verify Logo in Popup
1. Click the JugiTube extension icon in the browser toolbar
2. **Expected Result**: The popup should display `logo_ANOMFIN_AUTOMATED_AI.png` at the top of the popup interface
3. **What to check**: The logo should be visible and properly sized (42x42px, rounded)

### Test 2: Verify Logo in Video Placeholder (Audio-Only Mode)
1. Navigate to any YouTube video (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
2. Click the JugiTube extension icon and enable the extension
3. **Expected Result**: The video should be replaced with an audio-only placeholder
4. **What to check**: 
   - The `logo_ANOMFIN_AUTOMATED_AI.png` should appear in the center badge of the placeholder
   - Multiple floating/animated copies of the logo should appear in the background
   - The logo should be visible and clear

### Test 3: Verify Logo in Lyrics Console
1. With the extension enabled on a YouTube video
2. Look for the AnomFIN Tools karaoke console (usually in the bottom-right corner)
3. **Expected Result**: The console should display `logo_ANOMFIN_AUTOMATED_AI.png` in its header
4. **What to check**: The logo should be visible (52x52px, rounded, with border)

### Test 4: Verify Custom Logo Upload Still Works
1. Open the popup
2. Scroll to "AnomFIN Visual Suite" section
3. Click "Valitse" button under "Valitse logo"
4. Upload a custom image
5. **Expected Result**: 
   - Custom logo should appear in preview
   - Custom logo should replace the default logo in all locations
6. Click "Palauta" to reset
7. **Expected Result**: Logo should revert to `logo_ANOMFIN_AUTOMATED_AI.png`

### Test 5: Verify Background Wallpaper Uses Logo
1. With extension enabled on a YouTube video
2. Check the video placeholder background
3. **Expected Result**: 
   - If no custom background is set, `logo_ANOMFIN_AUTOMATED_AI.png` should be used as the background wallpaper
   - The logo should be visible with a blur effect in the background
   - CSS variable `--jugitube-background` should use the logo

## Success Criteria
- [ ] Logo displays correctly in popup
- [ ] Logo displays correctly in video placeholder
- [ ] Logo displays correctly in lyrics console
- [ ] Logo is used as default background wallpaper
- [ ] Custom logo upload and reset functionality works
- [ ] All logos are properly sized and styled
