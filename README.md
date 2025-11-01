# AnomTube - Audio Only YouTube with Live Lyrics

A browser extension that blocks YouTube videos and plays only the audio instead, featuring karaoke-style live lyrics in a popup window.

## Features

🎵 **Audio-Only Playback**: Blocks video content while preserving audio playback  
🎤 **Live Karaoke Lyrics**: Displays synchronized lyrics in a popup window  
🚫 **Advanced Ad Management**: Automatic ad muting, skipping, and blocking with MutationObserver  
⚙️ **Flexible Settings**: Hide lyrics, show video with ad controls, and more  
📱 **Toggle On/Off**: Easy-to-use switch to enable/disable the extension  
🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations  
📐 **Responsive Design**: Optimized lyrics console width (220px minimum) for all screen sizes  

## Installation

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `anomtube` folder
5. The AnomTube extension should now appear in your extensions list

## Usage

1. Navigate to any YouTube video page
2. Click the AnomTube extension icon in your browser toolbar
3. Toggle "Enable AnomTube" switch to activate
4. The video will be hidden and replaced with an audio-only placeholder
5. A popup window will open displaying live karaoke-style lyrics
6. Customize your experience with additional settings:
   - **Hide Lyrics Popup**: Completely hide the karaoke console
   - **Allow Video + Ad Controls**: Show video while keeping ad management active
   - **Ad Management**: Mute, skip, or block ads automatically
7. Enjoy your personalized YouTube experience!

## Advanced Settings

### Lisäasetukset (Additional Settings)
- **Piilota lyriikka-popup**: Hide the lyrics console completely
- **Salli video + mainosten hallinta**: Display video while maintaining ad control features

### Ad Management (AnomFIN Ad Shield)
- **Mainosten ääni**: Automatically mute ads
- **Mainokset ASAP POIS**: Skip ads immediately when skip button appears (using MutationObserver)
- **Mainokset**: Block pre-roll ads entirely

## Technical Details

This extension consists of:
- **Manifest V3** browser extension
- **Content script** that blocks video elements and manages lyrics
- **Background service worker** for lyrics data management
- **Popup interface** for extension controls
- **Responsive lyrics window** with karaoke-style display

## Files Structure

```
anomtube/
├── manifest.json                      # Extension configuration
├── popup.html                         # Extension popup interface
├── popup.js                          # Popup functionality
├── content.js                        # Main content script with ad skipper
├── content.css                       # Styling for blocked video placeholder
├── background.js                     # Background service worker
├── icons/                            # Extension icons
├── README.md                         # This file
├── CHANGELOG_v2.1.0.md              # Version 2.1.0 changelog
├── TESTING_GUIDE.md                 # Comprehensive testing instructions
├── CHANGES_VISUAL_GUIDE_UPDATE.md   # Visual guide (Finnish)
├── UI_CHANGES_VISUAL.md             # UI changes visualization
└── IMPLEMENTATION_SUMMARY_FINAL.md  # Complete implementation summary
```

## Recent Updates (v2.1.0)

### New Features
- ✨ **Hide Lyrics Popup**: Option to completely hide the karaoke console
- ✨ **Video + Ad Controls**: Show video while keeping ad management active
- ⚡ **Improved Ad Skipper**: MutationObserver-based with rate limiting
- 📐 **Better Responsiveness**: Lyrics console minimum width reduced to 220px

### Technical Improvements
- MutationObserver for real-time ad button detection
- Rate limiting (max 3 attempts per button per minute)
- Support for 6 different skip button selectors
- Enhanced click methods with fallback mechanisms
- False-positive protection with button tracking

See [CHANGELOG_v2.1.0.md](CHANGELOG_v2.1.0.md) for detailed changes.

## Browser Compatibility

- Chrome (recommended)
- Edge
- Other Chromium-based browsers

## License

Open source - feel free to modify and distribute!
