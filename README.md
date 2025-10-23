# JugiTube - Audio Only YouTube with Live Lyrics

A browser extension that blocks YouTube videos and plays only the audio instead, featuring karaoke-style live lyrics in a popup window.

## Features

🎵 **Audio-Only Playback**: Blocks video content while preserving audio playback  
🎤 **Live Karaoke Lyrics**: Displays synchronized lyrics in a popup window  
📱 **Toggle On/Off**: Easy-to-use switch to enable/disable the extension  
🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations  

## Installation

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `jugitube` folder
5. The JugiTube extension should now appear in your extensions list

## Usage

1. Navigate to any YouTube video page
2. Click the JugiTube extension icon in your browser toolbar
3. Toggle the "Enable JugiTube" switch to activate
4. The video will be hidden and replaced with an audio-only placeholder
5. A popup window will open displaying live karaoke-style lyrics
6. Enjoy your audio-only YouTube experience with synchronized lyrics!

## Technical Details

This extension consists of:
- **Manifest V3** browser extension
- **Content script** that blocks video elements and manages lyrics
- **Background service worker** for lyrics data management
- **Popup interface** for extension controls
- **Responsive lyrics window** with karaoke-style display

## Files Structure

```
jugitube/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup interface
├── popup.js           # Popup functionality
├── content.js         # Main content script
├── content.css        # Styling for blocked video placeholder
├── background.js      # Background service worker
├── icons/             # Extension icons
└── README.md          # This file
```

## Browser Compatibility

- Chrome (recommended)
- Edge
- Other Chromium-based browsers

## License

Open source - feel free to modify and distribute!
