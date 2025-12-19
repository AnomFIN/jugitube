# Changelog - Version 2.2.0

## AnomTube v2.2.0 - Feature Bundle Release
**Release Date**: November 2024

### 🎉 Major New Features

#### 1. Keyboard Shortcuts (Hotkeys)
- **Space**: Play/Pause video
- **← →**: Seek backward/forward 5 seconds
- **↑ ↓**: Volume control with visual indicator
- **D**: Toggle download panel
- **T**: Toggle theme (Light/Dark)
- **P**: Toggle Picture-in-Picture mode
- Smart detection to prevent conflicts with input fields
- Volume indicator overlay shows current volume level

#### 2. Theme System
- Light and Dark theme support
- Theme toggle button in popup (or press T)
- Persists theme preference across sessions
- Applies to all UI elements:
  - Popup interface
  - Lyrics console
  - Download panel
  - Playlist manager
- Uses CSS variables for easy customization
- Respects system color scheme preference

#### 3. Bookmarks & Playlists
- **Bookmark Manager**: Save important moments in videos
- Add bookmarks with current timestamp
- Jump to bookmarks with single click
- Bookmarks stored per video
- Persistent storage using chrome.storage.local
- Visual bookmark panel with:
  - Timestamp display
  - Custom notes
  - Easy management
- Export/import functionality (planned)

#### 4. Picture-in-Picture (PiP)
- Native browser PiP support
- Toggle via popup button or P key
- Video floats above other windows
- Works seamlessly with audio-only mode
- Automatic state management

#### 5. Download Manager
- Comprehensive download UI panel
- Format selection:
  - MP3 (audio only)
  - MP4 (video)
- Quality options:
  - Low (faster downloads)
  - Medium (balanced)
  - High (best quality)
- Progress indicators
- Settings persistence
- Integration with chrome.downloads API
- Note: Direct YouTube download has browser limitations

### 🎨 UI/UX Enhancements

#### Popup Interface
- New "Ominaisuudet" (Features) section
- Theme toggle button
- PiP button
- Download button
- Playlist manager button
- Keyboard shortcuts reference card
- Better organization of controls
- More intuitive layout

#### Responsive Design
- New `responsive.css` for better mobile support
- Media queries for different screen sizes:
  - Mobile (< 480px)
  - Tablet (< 768px)
  - Desktop (> 768px)
- Touch-friendly buttons (min 44px)
- Adaptive text sizing
- Optimized panel positioning on small screens
- Landscape orientation support
- High DPI display optimization
- Print-friendly styles

### 🏗️ Technical Improvements

#### Architecture
- **Modular Design**: New manager classes
  - `HotkeyManager`: Keyboard shortcut handling
  - `ThemeManager`: Theme switching and persistence
  - `PlaylistManager`: Playlist and bookmark CRUD
  - `DownloadManager`: Download UI and logic
- Better separation of concerns
- Improved code maintainability

#### Storage
- Enhanced use of chrome.storage API
- Separate sync and local storage strategies
- Efficient data persistence
- Automatic state restoration

#### Event Handling
- Improved message passing between popup and content script
- Better event listener management
- Proper cleanup on deactivation

#### Browser APIs
- Integration with native PiP API
- Chrome downloads API support
- Better permission handling

### 📦 Files Added

#### New Modules
- `modules/hotkeys.js` (182 lines)
- `modules/themeManager.js` (119 lines)
- `modules/playlistManager.js` (213 lines)
- `modules/downloadManager.js` (298 lines)

#### New Styles
- `src/css/responsive.css` (175 lines)

### 🔧 Files Modified

#### Configuration
- `manifest.json`:
  - Version bumped to 2.2.0
  - Added `downloads` permission
  - Included new modules in content_scripts

#### Core Files
- `content.js`:
  - Integrated new managers
  - Added message handlers for new actions
  - Added playlist manager UI methods
  - Enhanced initialization

- `background.js`:
  - Added download request handler
  - Better message routing

- `popup.html`:
  - New feature section with buttons
  - Keyboard shortcuts reference
  - Better organization

- `popup.js`:
  - Event handlers for new buttons
  - Message sending for actions

- `README.md`:
  - Comprehensive documentation for all new features
  - Keyboard shortcuts table
  - Usage instructions
  - Updated file structure

### 🐛 Bug Fixes
- Fixed potential race conditions in module initialization
- Improved error handling in download manager
- Better cleanup on extension disable

### ⚡ Performance
- Lazy loading of UI panels (only created when needed)
- Efficient storage queries
- Optimized event listener attachment

### 🔒 Security
- Sanitized file names for downloads
- Proper permission checks
- No sensitive data exposure

### 📱 Compatibility
- Chrome 88+ (recommended: latest version)
- Edge 88+
- Other Chromium-based browsers
- Requires Manifest V3 support

### 🎯 Known Limitations
- Browser extension download capabilities are limited
- Direct YouTube video download may require external tools
- Some features require specific browser permissions
- PiP availability depends on browser support

### 📝 Migration Notes
- No breaking changes from v2.1.0
- All existing settings preserved
- Automatic migration of storage keys
- New permissions requested on update

### 🔮 Future Plans
- Playlist creation and management
- Advanced download options with backend support
- Custom theme creation
- Backup/restore functionality
- Sync across devices
- More keyboard shortcuts
- Advanced bookmark features

### 🙏 Acknowledgments
This release adds comprehensive features while maintaining the core audio-only YouTube experience. Special thanks to all users providing feedback!

---

**Full Changelog**: v2.1.0...v2.2.0
