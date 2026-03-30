import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("smartblog.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    visibility TEXT DEFAULT 'public',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blog_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(blog_id) REFERENCES blogs(id)
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    UNIQUE(blog_id, user_id, type),
    FOREIGN KEY(blog_id) REFERENCES blogs(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_spam BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(blog_id) REFERENCES blogs(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blog_tags (
    blog_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(blog_id, tag_id),
    FOREIGN KEY(blog_id) REFERENCES blogs(id),
    FOREIGN KEY(tag_id) REFERENCES tags(id)
  );
`);

// Migration: Add password column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN password TEXT").run();
} catch (e) {}

// Migration: Add visibility column if it doesn't exist
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN visibility TEXT DEFAULT 'public'").run();
} catch (e) {}

// Migration: Add image_url column if it doesn't exist
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN image_url TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    try {
      const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email.trim()) as any;
      
      if (!user) {
        return res.status(404).json({ error: "User not found. Please register first." });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid password." });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      // Ensure ID is a number for JSON serialization
      userWithoutPassword.id = Number(userWithoutPassword.id);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Internal server error during login." });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    try {
      const existing = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email.trim());
      if (existing) {
        return res.status(400).json({ error: "Email already registered. Please login." });
      }
      const result = db.prepare("INSERT INTO users (email, username, password) VALUES (?, ?, ?)").run(email.trim(), username.trim(), password);
      const user = { id: Number(result.lastInsertRowid), email: email.trim(), username: username.trim() };
      res.json(user);
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(500).json({ error: "Internal server error during registration." });
    }
  });

  app.post("/api/auth/check-email", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    try {
      const existing = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email.trim());
      if (existing) {
        return res.status(400).json({ error: "Email already registered." });
      }
      res.json({ available: true });
    } catch (error) {
      res.status(500).json({ error: "Error checking email." });
    }
  });

  app.get("/api/blogs", (req, res) => {
    const userId = req.query.user_id;
    const blogs = db.prepare(`
      SELECT b.*, u.username as author_name,
      (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.id) as reaction_count
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.visibility = 'public' OR b.author_id = ?
      ORDER BY b.created_at DESC
    `).all(userId || -1);
    res.json(blogs);
  });

  app.get("/api/blogs/:id", (req, res) => {
    const blog = db.prepare(`
      SELECT b.*, u.username as author_name
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.id = ?
    `).get(req.params.id) as any;
    
    if (blog) {
      db.prepare("UPDATE blogs SET views = views + 1 WHERE id = ?").run(req.params.id);
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        JOIN blog_tags bt ON t.id = bt.tag_id
        WHERE bt.blog_id = ?
      `).all(req.params.id);
      const reactions = db.prepare("SELECT type, COUNT(*) as count FROM reactions WHERE blog_id = ? GROUP BY type").all(req.params.id);
      const comments = db.prepare(`
        SELECT c.*, u.username FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.blog_id = ? AND c.is_spam = 0
        ORDER BY c.created_at DESC
      `).all(req.params.id);
      res.json({ ...blog, tags, reactions, comments });
    } else {
      res.status(404).json({ error: "Blog not found" });
    }
  });

  app.post("/api/blogs", (req, res) => {
    const { author_id, title, content, tags, visibility, image_url } = req.body;
    const result = db.prepare("INSERT INTO blogs (author_id, title, content, visibility, image_url) VALUES (?, ?, ?, ?, ?)").run(author_id, title, content, visibility || 'public', image_url || null);
    const blogId = result.lastInsertRowid;

    if (tags && Array.isArray(tags)) {
      tags.forEach(tagName => {
        let tag = db.prepare("SELECT id FROM tags WHERE name = ?").get(tagName) as any;
        if (!tag) {
          const tagResult = db.prepare("INSERT INTO tags (name) VALUES (?)").run(tagName);
          tag = { id: tagResult.lastInsertRowid };
        }
        db.prepare("INSERT OR IGNORE INTO blog_tags (blog_id, tag_id) VALUES (?, ?)").run(blogId, tag.id);
      });
    }
    res.json({ id: blogId });
  });

  app.put("/api/blogs/:id", (req, res) => {
    const { title, content, tags, visibility, image_url } = req.body;
    const oldBlog = db.prepare("SELECT content FROM blogs WHERE id = ?").get(req.params.id) as any;
    
    if (oldBlog) {
      db.prepare("INSERT INTO blog_versions (blog_id, content) VALUES (?, ?)").run(req.params.id, oldBlog.content);
    }

    db.prepare("UPDATE blogs SET title = ?, content = ?, visibility = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(title, content, visibility || 'public', image_url || null, req.params.id);

    if (tags && Array.isArray(tags)) {
      db.prepare("DELETE FROM blog_tags WHERE blog_id = ?").run(req.params.id);
      tags.forEach(tagName => {
        let tag = db.prepare("SELECT id FROM tags WHERE name = ?").get(tagName) as any;
        if (!tag) {
          const tagResult = db.prepare("INSERT INTO tags (name) VALUES (?)").run(tagName);
          tag = { id: tagResult.lastInsertRowid };
        }
        db.prepare("INSERT OR IGNORE INTO blog_tags (blog_id, tag_id) VALUES (?, ?)").run(req.params.id, tag.id);
      });
    }
    res.json({ success: true });
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, email, password, newPassword } = req.body;

    try {
      // Verify current password
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid current password" });
      }

      // Update user
      const finalPassword = newPassword || password;
      db.prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?")
        .run(username.trim(), email.trim(), finalPassword, id);

      const updatedUser = { id: Number(id), username: username.trim(), email: email.trim() };
      res.json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/blogs/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM blog_tags WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blog_versions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM reactions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM comments WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog" });
    }
  });

  app.get("/api/blogs/:id/versions", (req, res) => {
    const versions = db.prepare("SELECT * FROM blog_versions WHERE blog_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(versions);
  });

  app.post("/api/blogs/:id/reactions", (req, res) => {
    const { user_id, type } = req.body;
    try {
      db.prepare("INSERT INTO reactions (blog_id, user_id, type) VALUES (?, ?, ?)").run(req.params.id, user_id, type);
      res.json({ success: true });
    } catch (e) {
      db.prepare("DELETE FROM reactions WHERE blog_id = ? AND user_id = ? AND type = ?").run(req.params.id, user_id, type);
      res.json({ success: true, removed: true });
    }
  });

  app.post("/api/blogs/:id/comments", (req, res) => {
    const { user_id, content, is_spam } = req.body;
    db.prepare("INSERT INTO comments (blog_id, user_id, content, is_spam) VALUES (?, ?, ?, ?)").run(req.params.id, user_id, content, is_spam ? 1 : 0);
    res.json({ success: true });
  });

  app.post("/api/ai/suggest-tags", async (req, res) => {
    const { title, content } = req.body;
    const { suggestTags } = await import("./src/services/geminiService.ts");
    const tags = await suggestTags(title, content);
    res.json(tags);
  });

  app.post("/api/ai/filter-comment", async (req, res) => {
    const { comment } = req.body;
    const { filterComment } = await import("./src/services/geminiService.ts");
    const result = await filterComment(comment);
    res.json(result);
  });

  app.get("/api/stats", (req, res) => {
    const trending = db.prepare("SELECT * FROM blogs ORDER BY views DESC LIMIT 5").all();
    const topWriters = db.prepare(`
      SELECT u.username, COUNT(b.id) as blog_count, SUM(b.views) as total_views
      FROM users u
      JOIN blogs b ON u.id = b.author_id
      GROUP BY u.id
      ORDER BY total_views DESC
      LIMIT 5
    `).all();
    const trendingTags = db.prepare(`
      SELECT t.name, COUNT(bt.blog_id) as usage_count
      FROM tags t
      JOIN blog_tags bt ON t.id = bt.tag_id
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT 10
    `).all();
    res.json({ trending, topWriters, trendingTags });
  });

  // Auth: Reset Password
  app.post("/api/auth/reset-password", (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: "Email and new password required" });

    try {
      const result = db.prepare("UPDATE users SET password = ? WHERE email = ?").run(newPassword, email);
      if (result.changes === 0) return res.status(404).json({ error: "User not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
