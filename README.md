# AnomTube - Audio Only YouTube with Live Lyrics

A browser extension that blocks YouTube videos and plays only the audio instead, featuring karaoke-style live lyrics in a popup window with comprehensive hotkeys, playlists, and optional download functionality.

## Features

### Core Features
🎵 **Audio-Only Playback**: Blocks video content while preserving audio playback  
🎤 **Live Karaoke Lyrics**: Displays synchronized lyrics in a popup window  
🚫 **Advanced Ad Management**: Automatic ad muting, skipping, and blocking with MutationObserver  
⚙️ **Flexible Settings**: Hide lyrics, show video with ad controls, and more  
📱 **Toggle On/Off**: Easy-to-use switch to enable/disable the extension  
🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations  
📐 **Responsive Design**: Optimized lyrics console width (220px minimum) for all screen sizes

### New MVP Features (v2.2.0)
🪟 **Window State Persistence**: Remembers lyrics console size and position  
⌨️ **Global Hotkeys**: Keyboard shortcuts for playback control (space, arrows, d, t, p)  
📋 **Playlists & Bookmarks**: Create playlists and bookmark timestamps for quick access  
🖼️ **Picture-in-Picture**: HTML5 PiP support for floating video player  
🎨 **Theme Toggle**: Switch between light and dark themes  
⬇️ **Download Support**: Optional backend server for downloading videos/audio (requires yt-dlp)  

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
7. Use hotkeys for quick control (see Hotkeys section below)
8. Create playlists and bookmark your favorite moments
9. Toggle PiP mode or download videos (with optional backend)
10. Enjoy your personalized YouTube experience!

## Hotkeys

Use these keyboard shortcuts while on YouTube:

| Key | Action | Description |
|-----|--------|-------------|
| `Space` | Play/Pause | Toggle video playback |
| `←` | Seek Backward | Jump back 5 seconds |
| `→` | Seek Forward | Jump forward 5 seconds |
| `↑` | Volume Up | Increase volume by 10% |
| `↓` | Volume Down | Decrease volume by 10% |
| `D` | Download | Open download dialog (requires backend) |
| `T` | Toggle Theme | Switch between light/dark themes |
| `P` | Toggle PiP | Enter/exit Picture-in-Picture mode |

## Playlists & Bookmarks

### Creating Playlists
1. Right-click on any video while AnomTube is active
2. Select "Add to Playlist"
3. Choose existing playlist or create new one

### Managing Bookmarks
1. While watching a video, press `B` or click the bookmark button
2. Bookmarks save the current timestamp
3. Click on a bookmark to jump to that moment instantly

### Accessing Your Collections
- Click the playlists icon in the extension popup
- View all playlists and bookmarks
- Organize, rename, or delete collections

## Download Support (Optional)

AnomTube includes an optional backend server for downloading YouTube videos and audio.

### Prerequisites
- Node.js 16+ installed
- yt-dlp installed (`pip install yt-dlp`)
- ffmpeg installed (for audio conversion)

### Starting the Backend
```bash
cd backend
npm install
npm start
```

The server will run on `http://localhost:3000` by default.

### Using Downloads
1. Press `D` while watching any video
2. Choose format (MP4/MP3) and quality (Low/Medium/High)
3. Click Download

See [backend/README.backend.md](backend/README.backend.md) for detailed backend documentation.

### Docker Deployment
```bash
docker build -t anomtube-backend .
docker run -p 3000:3000 anomtube-backend
```

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
├── modules/                          # Modular components
│   ├── settings.js                   # Settings manager
│   ├── adSkipper.js                  # Ad skipping logic
│   └── lyricHandler.js               # Lyrics handling
├── src/
│   ├── js/                           # Feature modules
│   │   ├── windowState.js            # Window state persistence
│   │   ├── hotkeys.js                # Hotkeys manager
│   │   ├── playlists.js              # Playlists & bookmarks manager
│   │   ├── pip.js                    # PiP and theme managers
│   │   └── download.js               # Download manager
│   ├── css/
│   │   ├── responsive.css            # Responsive design styles
│   │   └── toolbar.css               # Toolbar styles
│   └── options/
│       ├── options.html              # Options page
│       └── options.js                # Options functionality
├── backend/                          # Optional download backend
│   ├── server.js                     # Express server
│   ├── package.json                  # Backend dependencies
│   └── README.backend.md             # Backend documentation
├── Dockerfile                        # Docker configuration
├── README.md                         # This file
├── CHANGELOG_v2.1.0.md              # Version 2.1.0 changelog
├── TESTING_GUIDE.md                 # Comprehensive testing instructions
├── CHANGES_VISUAL_GUIDE_UPDATE.md   # Visual guide (Finnish)
├── UI_CHANGES_VISUAL.md             # UI changes visualization
└── IMPLEMENTATION_SUMMARY_FINAL.md  # Complete implementation summary
```

## Recent Updates (v2.2.0 MVP)

### New Features
- ✨ **Window State Persistence**: Lyrics console remembers position and size
- ✨ **Global Hotkeys**: Full keyboard control (play/pause, seek, volume, download, theme, PiP)
- ✨ **Playlists & Bookmarks**: Create collections and bookmark timestamps
- ✨ **Picture-in-Picture**: HTML5 PiP support for floating video
- ✨ **Theme Toggle**: Switch between light and dark themes
- ✨ **Download Support**: Optional backend for downloading videos/audio
- ✨ **Responsive UI**: Mobile-friendly design with collapsible sidebar
- ⚡ **Improved Performance**: Optimized rendering and state management

### v2.1.0 Features
- ✨ **Hide Lyrics Popup**: Option to completely hide the karaoke console
- ✨ **Video + Ad Controls**: Show video while keeping ad management active
- ⚡ **Improved Ad Skipper**: MutationObserver-based with rate limiting
- 📐 **Better Responsiveness**: Lyrics console minimum width reduced to 220px

### Technical Improvements
- Modular architecture with separate feature managers
- Chrome storage API for all persistence
- Rate-limited ad skipping with MutationObserver
- Support for 6 different skip button selectors
- Enhanced click methods with fallback mechanisms
- False-positive protection with button tracking
- Responsive CSS with mobile-first approach
- REST API backend with streaming downloads

See [CHANGELOG_v2.1.0.md](CHANGELOG_v2.1.0.md) for detailed v2.1.0 changes.

## Browser Compatibility

- Chrome (recommended)
- Edge
- Other Chromium-based browsers

## License

Open source - feel free to modify and distribute!
