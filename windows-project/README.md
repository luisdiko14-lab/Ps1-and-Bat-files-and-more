# Windows 10 Setup Simulator

An interactive web-based simulator that recreates the Windows 10 installation and user experience.

## Overview

This project is a fully functional Windows 10 simulator built with pure HTML, CSS, and JavaScript. It features an authentic recreation of the Windows 10 interface including setup, login, desktop environment, and working applications.

## Features

### Installation & Setup
- Windows 10 installation wizard with animated loading bars
- Multi-step setup process:
  - Region selection
  - Keyboard layout selection
  - WiFi network connection with password entry
  - Drive selection for Windows installation (SSD, HDD, USB)
  - Account type selection (Microsoft Account or Local Account)
  - Microsoft Account sign-in with email and password
  - Local account creation with username and password
  - Privacy settings configuration (Location, Diagnostics, Tailored experiences)
- Realistic installation progress with dynamic messages

### User Management
- Microsoft Account integration option
- Local account creation option
- User account creation with username and password
- Login screen with password authentication
- Lock screen with time/date display
- Sign out, lock, restart, and shutdown functions

### Desktop Environment
- Authentic Windows 10 desktop with taskbar
- Start menu with app launcher
- System tray with clock and system icons
- Notification center
- Desktop icons (This PC, Recycle Bin)

### Working Applications
- **Calculator**: Full-featured calculator with basic operations
- **Notepad**: Simple text editor
- **File Explorer**: File and folder browsing interface
- **Settings**: Fully functional settings panel with multiple sections:
  - System (brightness, night light, sound, storage)
  - Personalization (background, colors, themes)
  - Apps (installed apps list with uninstall options)
  - Accounts (user profile info showing username and email)
  - Time & Language (time zone, language settings)
  - Privacy (location, camera, microphone, diagnostics)
  - Update & Security (Windows Update, security status, backup)
- **Task Manager**: Real-time CPU and memory monitoring with process list
- **Microsoft Edge**: Browser simulation

### Window Management
- Draggable windows
- Minimize, maximize, and close controls
- Multiple windows can be open simultaneously
- Taskbar shows active applications

### System Functions
- Shutdown with animation
- Restart with animation
- Sign out
- Lock screen
- Real-time clock display

## Technical Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **Layout**: CSS Grid and Flexbox
- **Animations**: CSS animations and transitions
- **State Management**: JavaScript with local variables
- **Server**: Python HTTP server (development)

## Project Structure

```
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # All JavaScript functionality
├── .gitignore          # Git ignore rules
└── replit.md           # Project documentation
```

## Recent Changes

- Initial project creation (November 21, 2025)
- Implemented complete Windows 10 UI simulation
- Fixed CSS display conflicts for proper screen rendering
- Added all core features: setup, login, desktop, apps, task manager
- Added WiFi setup with network selection and password entry
- Added drive selection for Windows installation
- Added Microsoft Account sign-in option
- Expanded Settings app with 7 fully functional sections
- Added privacy settings configuration during setup

## Usage

The simulator runs on port 5000. Simply open the application and:

1. Click "Next" through the setup wizard
2. Select your region and keyboard layout
3. Connect to a WiFi network (password required for secured networks)
4. Select a drive for Windows installation (SSD, HDD, or USB)
5. Choose between Microsoft Account or Local Account
   - For Microsoft Account: Enter email and password
   - For Local Account: Enter username and password
6. Configure privacy settings (Location, Diagnostics, Tailored experiences)
7. Wait for installation to complete
8. Click the lock screen to proceed to login
9. Enter your password to access the desktop
10. Explore apps, settings, and system functions

### Navigating Settings

The Settings app includes 7 sections, each fully functional:
- Click on any section in the sidebar to view its settings
- Toggle switches work for privacy and system options
- Sliders adjust brightness and volume levels
- Account section shows your username and account type

## Performance Monitoring

The Task Manager simulates web-based resource monitoring:
- CPU usage updates every 2 seconds
- Memory usage simulation
- Process list shows running applications
- Performance graphs for CPU and memory

## Notes

- Password fields show browser warnings about not being in forms - these are harmless
- All data is stored in memory and resets on page refresh
- The simulator is for educational and demonstration purposes

- # More info.
- # Windows 10 Setup Simulator

## Overview

This is a web-based Windows 10 simulator that recreates the complete Windows installation experience and desktop environment using HTML, CSS, and JavaScript with a Node.js/Express backend for Discord OAuth2.

## Recent Fixes & Features
- **Real Tabbed Browser**: Microsoft Edge and Chrome both have working tabs, bookmarks bar, history nav, new tab page with tiles, and actual iframe loading of real websites
- **30+ Apps**: WordPad (rich text + formatting), Sticky Notes, PowerShell, Control Panel, Device Manager, Registry Editor, Media Player, Teams (chat), Xbox, Mail, Speed Test, and all previous apps
- **CMD Expanded**: 30+ commands including ipconfig /all, tracert, netstat, tasklist, taskkill, systeminfo, shutdown, sfc, reg, net, cd, mkdir, tree, attrib, set, and more
- **Window Resize**: All windows have drag handles on all 8 edges/corners for resizing
- **Pinned Taskbar**: 8 pinned app icons always visible in the taskbar
- **Discord OAuth2**: Full Discord integration with client ID/secret, state parameter, and real guild data

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend-Only Architecture
- **Technology Stack**: Pure HTML, CSS, and JavaScript with no frameworks
- **Design Pattern**: Multi-screen single-page application using visibility toggling

### Screen Management System
- Multiple "screen" divs represent different states (boot, lock, login, desktop, setup steps)
- Screens are toggled via CSS classes (`.active`) controlled by JavaScript

### State Management
- Global JavaScript variables track application state (`userData`, `openWindows`, `calculatorDisplay`, etc.)
- User data object stores: username, password, email, account type, selected drive, WiFi network

### File Structure
- `index.html` - Main desktop and login experience
- `setup_1.html`, `setup_2.html` - Windows installation wizard steps
- `styles.css` - All styling including Windows 10 visual design
- `script.js` - Core application logic and interactivity

## Features
- Desktop Experience with shortcuts and context menu
- System Tray (WiFi, Volume, Battery, Action Center)
- Working Apps: Calculator, Notepad, File Explorer, Settings, Task Manager, Edge, Paint, etc.
- Security Simulations: Ransomware and BSOD for educational purposes
- Persistent Data: Users and settings saved in `localStorage`
