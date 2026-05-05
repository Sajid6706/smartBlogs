# Smart Blog - Full Stack Portfolio Application

A modern, high-performance blog platform with glassmorphism UI, real-time-like features, and an integrated admin dashboard.

## Features

- **Triple Theme Mode**: Light Mode, Dark (Orange) Mode, and Glassmorphism Mode.
- **Full-Stack Architecture**: React + Vite frontend, Express backend, and SQLite database.
- **Dynamic Content**: Create, edit, and manage blogs with Markdown support.
- **Smart Features**: AI-suggested tags and automated spam detection (powered by Gemini).
- **Admin Dashboard**: Comprehensive user management, blog oversight, and activity logs.
- **Profile System**: Custom bio, profile pictures (local upload), and security settings.
- **Social Interactivity**: Follow system, comments (with replies), and likes.

---

## Local Setup Instructions

Follow these steps to run the project on your local machine.

### 1. Prerequisites

- **Node.js**: Install the latest LTS version (v18 or higher recommended) from [nodejs.org](https://nodejs.org/).
- **NPM**: Comes bundled with Node.js.

### 2. Installation

1. Clone or download the project files.
2. Open your terminal in the project root directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Environment Configuration

1. Create a `.env` file in the root directory (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and fill in the required values:
   - `GEMINI_API_KEY`: Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) for smart features.
   - `VITE_EMAILJS_...`: (Optional) Setup [EmailJS](https://www.emailjs.com/) if you want to use the notification system.

### 4. Running the Application

#### Development Mode
Runs the backend server and Vite dev server simultaneously with hot reloading.
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

#### Production Mode
Builds the frontend for production and starts the optimized server.
```bash
npm run build
npm start
```

---

## Technical Details

### Database
The project uses **SQLite** (`better-sqlite3`). A file named `smartblog.db` will be created automatically in the root directory upon the first run. No separate database installation (like MySQL or Postgres) is required.

### File Uploads
User profile pictures are stored locally in `public/uploads/`. The server automatically handles directory creation and static file serving.

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Motion (Framer Motion), Lucide Icons.
- **Backend**: Express, Better-SQLite3, Multer.
- **State Management**: Zustand.
- **AI Integration**: Google Generative AI (@google/genai).

---

## Troubleshooting

- **SQLite Build Error**: If `better-sqlite3` fails to install, ensure you have build tools installed (`npm install --global windows-build-tools` on Windows or `xcode-select --install` on Mac).
- **Port Conflict**: If port 3000 is in use, you can change the `PORT` constant at the top of `server.ts`.

---

Enjoy building with Smart Blog!
