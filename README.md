# AnomTube - Audio Only YouTube with Live Lyrics

A browser extension that blocks YouTube videos and plays only the audio instead, featuring karaoke-style live lyrics in a popup window.

## Features

### Core Features
🎵 **Audio-Only Playback**: Blocks video content while preserving audio playback  
🎤 **Live Karaoke Lyrics**: Displays synchronized lyrics in a popup window  
🚫 **Advanced Ad Management**: Automatic ad muting, skipping, and blocking with MutationObserver  
⚙️ **Flexible Settings**: Hide lyrics, show video with ad controls, and more  
📱 **Toggle On/Off**: Easy-to-use switch to enable/disable the extension  
🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations  
📐 **Responsive Design**: Optimized for all screen sizes with responsive CSS

### New Features (v2.2.0)
⌨️ **Keyboard Shortcuts (Hotkeys)**: Full keyboard control for video playback  
🎨 **Theme System**: Light/Dark theme toggle with persistence  
📝 **Playlists & Bookmarks**: Save timestamps and manage bookmarks  
📺 **Picture-in-Picture**: Native browser PiP support  
⬇️ **Download Manager**: UI for downloading videos with quality options

## Installation

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `anomtube` folder
5. The AnomTube extension should now appear in your extensions list

## Usage

### Basic Usage
1. Navigate to any YouTube video page
2. Click the AnomTube extension icon in your browser toolbar
3. Toggle "Enable AnomTube" switch to activate
4. The video will be hidden and replaced with an audio-only placeholder
5. A popup window will open displaying live karaoke-style lyrics
6. Customize your experience with additional settings
7. Enjoy your personalized YouTube experience!

### Keyboard Shortcuts
Use these keyboard shortcuts while watching videos:

| Key | Action |
|-----|--------|
| **Space** | Play/Pause video |
| **←** | Seek backward 5 seconds |
| **→** | Seek forward 5 seconds |
| **↑** | Increase volume |
| **↓** | Decrease volume |
| **D** | Toggle download panel |
| **T** | Toggle theme (Light/Dark) |
| **P** | Toggle Picture-in-Picture |

### Bookmarks
- Click the **"Soittolistat"** button in the popup to open the bookmark manager
- Add bookmarks at any timestamp while watching
- Click on a bookmark to jump to that moment in the video
- Bookmarks are saved automatically and persist across sessions

### Theme Switching
- Click the **"Teema"** button or press **T** to toggle between light and dark themes
- Theme preference is saved automatically
- Applies to the popup, lyrics console, and all UI elements

### Picture-in-Picture
- Click the **"PiP"** button or press **P** to enter Picture-in-Picture mode
- Video floats above other windows while you work
- Works with native browser PiP API

### Download Manager
- Click the **"Lataa"** button or press **D** to open the download panel
- Select format (MP3/MP4) and quality (Low/Medium/High)
- Click download to initiate
- Note: Browser extension downloads have limitations; consider using dedicated tools for conversion

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
- **Background service worker** for lyrics data management and downloads
- **Popup interface** for extension controls
- **Responsive lyrics window** with karaoke-style display
- **Modular architecture** with separate managers for hotkeys, themes, playlists, and downloads

### Modules
- `modules/settings.js` - Settings management
- `modules/adSkipper.js` - Ad detection and skipping
- `modules/lyricHandler.js` - Lyrics fetching and display
- `modules/hotkeys.js` - Keyboard shortcuts handler
- `modules/themeManager.js` - Theme switching and persistence
- `modules/playlistManager.js` - Playlist and bookmark management
- `modules/downloadManager.js` - Download UI and functionality

## Files Structure

```
anomtube/
├── manifest.json                      # Extension configuration (v2.2.0)
├── popup.html                         # Extension popup interface
├── popup.js                          # Popup functionality
├── content.js                        # Main content script
├── content.css                       # Styling for blocked video placeholder
├── background.js                     # Background service worker
├── modules/
│   ├── settings.js                   # Settings manager
│   ├── adSkipper.js                  # Ad detection and skipping
│   ├── lyricHandler.js               # Lyrics fetching
│   ├── hotkeys.js                    # Keyboard shortcuts (NEW)
│   ├── themeManager.js               # Theme system (NEW)
│   ├── playlistManager.js            # Playlists & bookmarks (NEW)
│   └── downloadManager.js            # Download manager (NEW)
├── src/
│   ├── css/
│   │   ├── toolbar.css               # Toolbar styling
│   │   └── responsive.css            # Responsive design (NEW)
│   ├── options/                      # Options page
│   └── content/                      # Content script modules
├── icons/                            # Extension icons
└── README.md                         # This file
```

## Recent Updates

### Version 2.2.0 (Latest)
🎉 **Major Feature Release**

#### New Features
- ⌨️ **Keyboard Shortcuts**: Full keyboard control (Space, arrows, D, T, P)
- 🎨 **Theme System**: Light/Dark theme toggle with persistence
- 📝 **Bookmarks**: Save and jump to timestamps
- 📺 **Picture-in-Picture**: Native browser PiP support
- ⬇️ **Download Manager**: UI for video/audio downloads with quality options
- 📱 **Enhanced Responsive Design**: Better mobile and tablet support

#### Technical Improvements
- Modular architecture with separate manager classes
- Chrome storage API integration for all features
- Native browser APIs (PiP, downloads)
- Improved event handling and state management
- Comprehensive keyboard shortcut system

### Version 2.1.0

#### New Features
- ✨ **Hide Lyrics Popup**: Option to completely hide the karaoke console
- ✨ **Video + Ad Controls**: Show video while keeping ad management active
- ⚡ **Improved Ad Skipper**: MutationObserver-based with rate limiting
- 📐 **Better Responsiveness**: Lyrics console minimum width reduced to 220px

#### Technical Improvements
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
