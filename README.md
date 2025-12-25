# DELULU

<div align="center">
  <img src="assets/icon.png" alt="DELULU Logo" width="128" height="128" />
  
  <h3>Your Ultimate Anime & Manga Companion</h3>

  <p>
    A modern, beautiful, and feature-rich desktop application for tracking and discovering anime and manga.
    Built with Electron, React, and Vite.
  </p>
</div>

---

## ✨ Features

- **📺 Anime Discovery**: Browse top airing, upcoming, and popular anime using the Jikan API (MyAnimeList).
- **📖 Manga Reader**: Read your favorite manga from multiple sources with a built-in reader.
- **🎨 Customization**: 
  - extensive theming engine
  - Custom CSS support
  - Background customization
- **⚡ Performance**: Optimized for speed with a lightweight React frontend.
- **🔒 Privacy Focused**: No tracking, local data storage.
- **🐧 Linux Support**: First-class support for Linux (Debian/Ubuntu, AppImage).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/botsailer/delulu.git
   cd delulu
   ```

2. **Install dependencies**
   ```bash
   npm install
   # This will also install renderer dependencies automatically via postinstall script if configured, 
   # otherwise:
   cd renderer && npm install && cd ..
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```
   This will start the Vite dev server for the renderer and launch the Electron app.

## 🛠️ Building

To build the application for production:

### Linux (.deb, .AppImage)
```bash
npm run build:linux
```

### Windows (.exe)
```bash
npm run build:win
```

### macOS (.dmg)
```bash
npm run build:mac
```

The build artifacts will be available in the `dist-electron` directory.

## 💻 Tech Stack

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **APIs**: 
  - [Jikan API](https://jikan.moe/) (Anime)
  - [Consumet](https://github.com/consumet/consumet.ts) (Manga)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
