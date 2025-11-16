# AnomTube Features Guide

Complete guide to all features added in the latest update.

## Table of Contents

- [Keyboard Shortcuts (Hotkeys)](#keyboard-shortcuts-hotkeys)
- [Theme System](#theme-system)
- [Picture-in-Picture (PiP)](#picture-in-picture-pip)
- [Playlists and Bookmarks](#playlists-and-bookmarks)
- [Responsive Design](#responsive-design)
- [Download Feature](#download-feature-optional)

---

## Keyboard Shortcuts (Hotkeys)

AnomTube now includes comprehensive keyboard shortcuts for quick control without clicking.

### Playback Controls

| Key | Action | Description |
|-----|--------|-------------|
| **Space** or **K** | Play/Pause | Toggle video playback |
| **←** or **J** | Seek Backward | Jump back 5 seconds |
| **→** or **L** | Seek Forward | Jump forward 5 seconds |
| **0-9** | Seek to % | Jump to 0%-90% of the video |

### Volume Controls

| Key | Action | Description |
|-----|--------|-------------|
| **↑** | Volume Up | Increase volume by 5% |
| **↓** | Volume Down | Decrease volume by 5% |
| **M** | Toggle Mute | Mute/unmute audio |

### Display Controls

| Key | Action | Description |
|-----|--------|-------------|
| **F** | Fullscreen | Toggle fullscreen mode |
| **T** | Toggle Theme | Switch between dark and light themes |
| **P** | Toggle PiP | Enter/exit Picture-in-Picture mode |

### Features

| Key | Action | Description |
|-----|--------|-------------|
| **B** | Add Bookmark | Create bookmark at current timestamp |
| **D** | Download | Open download options (requires backend) |

### Notes

- Hotkeys work only when YouTube page is active
- Hotkeys are disabled when typing in input fields
- All hotkeys follow YouTube's standard where applicable (K, J, L, M, F)

---

## Theme System

Switch between dark and light themes to match your preference or lighting conditions.

### Features

- **Dark Theme**: Default, optimized for low-light environments
- **Light Theme**: Better for bright environments
- **Smooth Transitions**: Seamless color transitions between themes
- **Persistent Storage**: Your theme choice is saved

### How to Use

1. **Via Hotkey**: Press **T** while on YouTube
2. **Via Popup**: Click the extension icon → Toggle "Teema" switch
3. **Automatic**: Respects system color scheme preference

### Theme Elements

Both themes style:
- Video placeholder
- Lyrics console
- Extension popup
- All UI elements

---

## Picture-in-Picture (PiP)

Watch videos in a floating window while working on other tasks.

### Features

- **HTML5 PiP**: Native browser Picture-in-Picture support
- **Always on Top**: Stays visible even when switching tabs
- **Resizable**: Drag corners to resize PiP window
- **Movable**: Click and drag to reposition

### How to Use

1. **Via Hotkey**: Press **P** while watching a video
2. **Via Popup**: Click extension icon → Click "Toggle PiP" button

### Compatibility

- Chrome 70+
- Edge 79+
- Other Chromium browsers with PiP support

### Notes

- Only one PiP window active at a time
- PiP works independently of AnomTube audio-only mode
- Video must be playing or paused (not ended)

---

## Playlists and Bookmarks

Create custom playlists and bookmark important moments in videos.

### Bookmarks

#### What are Bookmarks?

Bookmarks save specific timestamps in videos with optional notes, letting you return to important moments instantly.

#### How to Create Bookmarks

1. **Via Hotkey**: 
   - Play video to desired moment
   - Press **B** to bookmark current timestamp
   
2. **Via Popup**:
   - Click extension icon
   - Click "Lisää kirjanmerkki" button

#### Bookmark Information Saved

- Video ID and URL
- Title and artist
- Exact timestamp
- Auto-generated note with formatted time
- Creation date

#### Viewing Bookmarks

Bookmarks are stored locally in your browser. Access them via:
- Browser storage inspector (chrome://extensions)
- Future UI panel (coming soon)

### Playlists

#### What are Playlists?

Custom collections of videos you can create and manage.

#### Playlist Features

- **Create/Delete**: Add new playlists or remove existing ones
- **Add/Remove Videos**: Build your collection
- **Reorder**: Drag to rearrange playlist order
- **Multiple Playlists**: Create unlimited playlists
- **Persistence**: All data stored locally

#### Storage

- Uses `chrome.storage.local` API
- Data stays on your device
- No cloud sync (privacy-focused)
- Export/import functionality (coming soon)

---

## Responsive Design

AnomTube now adapts seamlessly to all screen sizes.

### Breakpoints

| Screen Size | Category | Optimizations |
|-------------|----------|---------------|
| < 400px | Small Mobile | Compact controls, stacked layout |
| 400-768px | Mobile/Tablet | Single-column features |
| 769-1024px | Tablet Landscape | Two-column layout |
| 1025-1440px | Desktop | Full feature set |
| > 1440px | Large Desktop | Enhanced spacing |

### Adaptive Elements

- **Lyrics Console**: Scales from 160px to 420px width
- **Video Placeholder**: Maintains aspect ratio
- **Controls**: Touch-optimized on mobile
- **Text**: Readable on all sizes

### Special Modes

- **Landscape Mobile**: Optimized for horizontal viewing
- **High DPI**: Crisp rendering on retina displays
- **Reduced Motion**: Respects accessibility preferences
- **High Contrast**: Enhanced for visibility

---

## Download Feature (Optional)

Download YouTube videos or extract audio with the optional backend service.

### Overview

The download feature requires a separate backend server that runs locally or on your network. This is necessary because browser extensions cannot directly spawn system processes.

### Setup

See [backend/README.md](../backend/README.md) for complete setup instructions.

**Quick Start:**

```bash
cd backend
npm install
npm start
```

### Requirements

- Node.js 16+
- yt-dlp installed
- ffmpeg installed

### Formats and Quality

#### MP3 (Audio Only)

- **Low**: 128kbps
- **Medium**: 192kbps  
- **High**: 320kbps

#### MP4 (Video)

- **Low**: Minimum quality
- **Medium**: Up to 720p
- **High**: Best available

### How to Use

1. **Start Backend**: Run `npm start` in backend directory
2. **Press D**: While on YouTube, press **D** hotkey
3. **Select Options**: Choose format and quality
4. **Download**: File downloads via browser

### API Example

```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "format": "mp3",
    "quality": "high"
  }' \
  --output "song.mp3"
```

### Rate Limits

- 10 downloads per 15 minutes per IP
- 3 concurrent downloads maximum
- 10-minute timeout per download

### Docker Deployment

For easy deployment, use Docker:

```bash
cd backend
docker build -t anomtube-backend .
docker run -d -p 3000:3000 anomtube-backend
```

### Security Notes

⚠️ **For production use:**
- Enable authentication
- Restrict CORS origins
- Use HTTPS (reverse proxy)
- Set firewall rules

---

## Troubleshooting

### Hotkeys Not Working

- Check if you're typing in an input field
- Ensure YouTube page is focused
- Verify extension is enabled

### Theme Not Changing

- Check popup toggle state
- Try hotkey (T) instead
- Reload YouTube page

### PiP Not Available

- Update browser to latest version
- Check browser supports PiP
- Ensure video is playing

### Bookmarks Not Saving

- Check browser storage permissions
- Verify extension has storage access
- Check browser storage quota

### Download Issues

- Verify backend is running
- Check yt-dlp is installed
- Review backend logs
- Test with curl command

---

## FAQ

**Q: Do hotkeys work on other sites besides YouTube?**  
A: No, hotkeys are specific to YouTube pages only.

**Q: Are playlists synced across devices?**  
A: No, all data is stored locally for privacy.

**Q: Can I customize hotkey bindings?**  
A: Not currently, but this feature is planned.

**Q: Does PiP work in audio-only mode?**  
A: Yes, PiP works independently of audio-only mode.

**Q: Is the download backend safe?**  
A: Yes, it runs locally and doesn't send data anywhere.

**Q: Can I use the extension without the backend?**  
A: Yes! The backend is completely optional.

---

## Credits

Made by **Jugi @ AnomFIN · AnomTools**

### Technologies Used

- Chrome Extensions API
- HTML5 PiP API
- Web Storage API
- yt-dlp
- ffmpeg
- Node.js & Express

---

## Support

For issues or questions:
- GitHub Issues: [AnomFIN/jugitube](https://github.com/AnomFIN/jugitube/issues)
- Documentation: [README.md](../README.md)
