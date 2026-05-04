import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new Database("smartblog.db");

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Initialize Database
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user',
    bio TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    visibility TEXT DEFAULT 'public',
    image_url TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'image',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS blog_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    UNIQUE(blog_id, user_id, type),
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_spam BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blog_tags (
    blog_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(blog_id, tag_id),
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(following_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blog_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(user_id, blog_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    from_user_id INTEGER,
    blog_id INTEGER,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    blog_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE CASCADE
  );
`);

// Migration: Add status column to blogs if it doesn't exist
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN status TEXT DEFAULT 'published'").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0").run();
} catch (e) {}

// Migration: Add password column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN password TEXT").run();
} catch (e) {}

// Migration: Add role column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
  // Set default admin
  db.prepare("UPDATE users SET role = 'admin' WHERE email = 'sajidahmad1001@gmail.com'").run();
} catch (e) {}

// Migration: Add visibility column if it doesn't exist
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN visibility TEXT DEFAULT 'public'").run();
} catch (e) {}

// Migration: Add image_url column if it doesn't exist
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN image_url TEXT").run();
} catch (e) {}

// Migration: Add media_url and media_type columns
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN media_url TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE blogs ADD COLUMN media_type TEXT DEFAULT 'image'").run();
} catch (e) {}

// Migration: Add bio and photo_url to users
try {
  db.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN photo_url TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // Serve static files from public/uploads
  app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

  // API Routes
  app.post("/api/upload", upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
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

      if (user.is_banned) {
        return res.status(403).json({ error: "Your account has been suspended for violating community guidelines." });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      // Ensure ID is a number for JSON serialization
      userWithoutPassword.id = Number(userWithoutPassword.id);

      // Auto-assign admin role for the specific email
      if (email.trim().toLowerCase() === "sajidahmad1001@gmail.com" && user.role !== 'admin') {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
        userWithoutPassword.role = 'admin';
      }

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
      const isMainAdmin = email.trim().toLowerCase() === "sajidahmad1001@gmail.com";
      const role = isMainAdmin ? 'admin' : 'user';
      
      const result = db.prepare("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)").run(email.trim(), username.trim(), password, role);
      const user = { id: Number(result.lastInsertRowid), email: email.trim(), username: username.trim(), role: role };
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

  app.get("/api/admin/blogs", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    
    try {
      const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(userId) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid session. Please login again." });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }

      const blogs = db.prepare(`
        SELECT b.*, u.username as author_name,
        (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.id) as reaction_count
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        ORDER BY b.created_at DESC
      `).all();
      res.json(blogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch blogs" });
    }
  });

  app.get("/api/admin/dashboard-stats", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(userId) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid session. Please login again." });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }

      const totalBlogs = db.prepare("SELECT COUNT(*) as count FROM blogs").get() as any;
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
      const totalViews = db.prepare("SELECT SUM(views) as count FROM blogs").get() as any;
      const recentActions = db.prepare(`
        SELECT l.*, u.username as admin_name 
        FROM admin_logs l 
        JOIN users u ON l.admin_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT 5
      `).all();

      res.json({
        totalBlogs: totalBlogs.count,
        totalUsers: totalUsers.count,
        totalViews: totalViews.count || 0,
        recentActions
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/blogs/:id", (req, res) => {
    const { userId, visibility, status } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(userId) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid session. Please login again." });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }

      if (visibility) {
        db.prepare("UPDATE blogs SET visibility = ? WHERE id = ?").run(visibility, req.params.id);
        db.prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)").run(
          userId, 'update_visibility', 'blog', req.params.id, `Set visibility to ${visibility}`
        );
      }
      if (status) {
        db.prepare("UPDATE blogs SET status = ? WHERE id = ?").run(status, req.params.id);
        db.prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)").run(
          userId, 'update_status', 'blog', req.params.id, `Set status to ${status}`
        );
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update blog" });
    }
  });

  app.delete("/api/admin/blogs/:id", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const user = db.prepare("SELECT id, role FROM users WHERE id = ?").get(userId) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid session. Please login again." });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }

      const blog = db.prepare("SELECT title FROM blogs WHERE id = ?").get(req.params.id) as any;
      if (!blog) return res.status(404).json({ error: "Blog not found" });

      // Manual delete order as fallback for non-cascading schemas
      db.prepare("DELETE FROM blog_tags WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blog_versions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM reactions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM comments WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);

      db.prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)").run(
        userId, 'delete_blog', 'blog', req.params.id, `Deleted blog: ${blog?.title || 'Unknown'}`
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin Delete Blog Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete blog" });
    }
  });

  app.get("/api/blogs", (req, res) => {
    const userId = req.query.user_id;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, u.username as author_name, u.bio as author_bio, u.photo_url as author_photo,
      (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.id) as reaction_count,
      (SELECT COUNT(*) FROM blogs b2 WHERE b2.author_id = u.id) as author_blog_count,
      (SELECT SUM(views) FROM blogs b3 WHERE b3.author_id = u.id) as author_total_views,
      (SELECT COUNT(*) FROM comments c WHERE c.blog_id = b.id) as comment_count
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE (b.visibility = 'public' OR b.author_id = ?)
      AND (b.status = 'published' OR b.author_id = ?)
    `;
    const params: any[] = [userId || -1, userId || -1];

    if (search) {
      query += ` AND (b.title LIKE ? OR b.content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const blogs = db.prepare(query).all(...params).map((blog: any) => {
        const score = (blog.author_blog_count * 50) + (blog.author_total_views || 0);
        let level = "Rookie";
        let levelColor = "text-slate-400";
        if (score >= 1000) { level = "Expert"; levelColor = "text-indigo-600"; }
        else if (score >= 500) { level = "Elite"; levelColor = "text-emerald-500"; }
        else if (score >= 100) { level = "Rising"; levelColor = "text-amber-500"; }
        
        return { ...blog, author_level: level, author_level_color: levelColor };
      });
      res.json(blogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch blogs" });
    }
  });

  app.get("/api/blogs/:id", (req, res) => {
    const blog = db.prepare(`
      SELECT b.*, u.username as author_name, u.bio as author_bio, u.photo_url as author_photo
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.id = ?
    `).get(req.params.id) as any;
    
    if (blog) {
      db.prepare("UPDATE blogs SET views = views + 1 WHERE id = ?").run(req.params.id);
      
      // Calculate author stats for level
      const authorStats = db.prepare(`
        SELECT 
          COUNT(DISTINCT b.id) as blog_count, 
          SUM(b.views) as total_views,
          (SELECT COUNT(*) FROM reactions r WHERE r.blog_id IN (SELECT id FROM blogs WHERE author_id = u.id)) as total_reactions,
          (SELECT COUNT(DISTINCT bt.tag_id) FROM blog_tags bt WHERE bt.blog_id IN (SELECT id FROM blogs WHERE author_id = u.id)) as unique_tags
        FROM users u
        JOIN blogs b ON u.id = b.author_id
        WHERE u.id = ?
        GROUP BY u.id
      `).get(blog.author_id) as any;

      let level = "Rookie";
      let levelColor = "text-slate-400";
      let uniqueness = "Focused";

      if (authorStats) {
        const totalScore = (authorStats.blog_count * 50) + authorStats.total_views + (authorStats.total_reactions * 10) + (authorStats.unique_tags * 20);
        if (totalScore >= 5000) { level = "Legendary Writer"; levelColor = "text-rose-500"; }
        else if (totalScore >= 2000) { level = "Master Creator"; levelColor = "text-orange-500"; }
        else if (totalScore >= 1000) { level = "Expert Author"; levelColor = "text-indigo-600"; }
        else if (totalScore >= 500) { level = "Elite Contributor"; levelColor = "text-emerald-500"; }
        else if (totalScore >= 100) { level = "Rising Star"; levelColor = "text-amber-500"; }
        uniqueness = authorStats.unique_tags > 10 ? "High" : authorStats.unique_tags > 5 ? "Moderate" : "Focused";
      }

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
      res.json({ ...blog, tags, reactions, comments, author_level: level, author_level_color: levelColor, author_uniqueness: uniqueness });
    } else {
      res.status(404).json({ error: "Blog not found" });
    }
  });

  app.post("/api/blogs", (req, res) => {
    const { author_id, title, content, tags, visibility, status, media_url, media_type } = req.body;
    
    // Check if user exists to prevent stale session FK failure
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(author_id);
    if (!user) {
      return res.status(401).json({ error: "Your session is invalid. Please log out and log in again." });
    }

    try {
      const result = db.prepare("INSERT INTO blogs (author_id, title, content, visibility, status, media_url, media_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        author_id, 
        title, 
        content, 
        visibility || 'public', 
        status || 'published',
        media_url || null, 
        media_type || 'image',
        new Date().toISOString(),
        new Date().toISOString()
      );
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
    } catch (error: any) {
      console.error("Create Blog Error:", error);
      res.status(500).json({ error: error.message || "Failed to create blog" });
    }
  });

  app.put("/api/blogs/:id", (req, res) => {
    const { title, content, tags, visibility, status, media_url, media_type } = req.body;
    const oldBlog = db.prepare("SELECT content FROM blogs WHERE id = ?").get(req.params.id) as any;
    
    if (oldBlog) {
      db.prepare("INSERT INTO blog_versions (blog_id, content) VALUES (?, ?)").run(req.params.id, oldBlog.content);
    }

    db.prepare("UPDATE blogs SET title = ?, content = ?, visibility = ?, status = ?, media_url = ?, media_type = ?, updated_at = ? WHERE id = ?")
      .run(title, content, visibility || 'public', status || 'published', media_url || null, media_type || 'image', new Date().toISOString(), req.params.id);

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
    const { username, email, bio, photo_url } = req.body;

    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      if (!user) return res.status(404).json({ error: "User not found" });

      db.prepare(`
        UPDATE users 
        SET username = COALESCE(?, username), 
            email = COALESCE(?, email), 
            bio = COALESCE(?, bio), 
            photo_url = COALESCE(?, photo_url) 
        WHERE id = ?
      `).run(username?.trim() || null, email?.trim() || null, bio || null, photo_url || null, id);

      const updatedUser = db.prepare("SELECT id, username, email, bio, photo_url, role FROM users WHERE id = ?").get(id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update User Error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/security", (req, res) => {
    const { id } = req.params;
    const { password, newPassword } = req.body;

    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid current password" });
      }

      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Security Update Error:", error);
      res.status(500).json({ error: "Failed to update security" });
    }
  });

  app.delete("/api/blogs/:id", (req, res) => {
    try {
      // Manual delete order as fallback
      db.prepare("DELETE FROM blog_tags WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blog_versions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM reactions WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM comments WHERE blog_id = ?").run(req.params.id);
      db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete Blog Error:", error);
      res.status(500).json({ error: error.message || "Failed to delete blog" });
    }
  });

  app.get("/api/blogs/:id/versions", (req, res) => {
    const versions = db.prepare("SELECT * FROM blog_versions WHERE blog_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(versions);
  });

  app.post("/api/blogs/:id/reactions", (req, res) => {
    const { user_id, type } = req.body;
    
    // Validate existence
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(user_id) as any;
    const blog = db.prepare("SELECT id, author_id, title FROM blogs WHERE id = ?").get(req.params.id) as any;
    
    if (!user || !blog) {
      return res.status(404).json({ error: "User or Blog no longer exists." });
    }

    try {
      db.prepare("INSERT INTO reactions (blog_id, user_id, type, created_at) VALUES (?, ?, ?, ?)").run(
        req.params.id, 
        user_id, 
        type, 
        new Date().toISOString()
      );

      // Create notification
      if (Number(blog.author_id) !== Number(user_id)) {
        db.prepare("INSERT INTO notifications (user_id, type, from_user_id, blog_id, message) VALUES (?, ?, ?, ?, ?)").run(
          blog.author_id, 'like', user_id, blog.id, `liked your post: ${blog.title}`
        );
      }

      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('UNIQUE')) {
        db.prepare("DELETE FROM reactions WHERE blog_id = ? AND user_id = ? AND type = ?").run(req.params.id, user_id, type);
        res.json({ success: true, removed: true });
      } else {
        res.status(500).json({ error: e.message || "Reaction failed" });
      }
    }
  });

  app.get("/api/blogs/:id/comments", (req, res) => {
    try {
      const comments = db.prepare(`
        SELECT c.*, u.username, u.photo_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.blog_id = ?
        ORDER BY c.created_at ASC
      `).all(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/blogs/:id/comments", (req, res) => {
    const { user_id, content, parent_id } = req.body;
    
    const blog = db.prepare("SELECT id, author_id, title FROM blogs WHERE id = ?").get(req.params.id) as any;
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    try {
      const result = db.prepare("INSERT INTO comments (blog_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)").run(
        req.params.id, user_id, content, parent_id || null
      );

      // Notification
      if (Number(blog.author_id) !== Number(user_id)) {
        db.prepare("INSERT INTO notifications (user_id, type, from_user_id, blog_id, message) VALUES (?, ?, ?, ?, ?)").run(
          blog.author_id, parent_id ? 'reply' : 'comment', user_id, blog.id, 
          parent_id ? `replied to your comment on: ${blog.title}` : `commented on your post: ${blog.title}`
        );
      }

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Comment failed" });
    }
  });

  app.post("/api/blogs/:id/bookmark", (req, res) => {
    const { user_id } = req.body;
    const { id: blog_id } = req.params;

    try {
      const existing = db.prepare("SELECT id FROM bookmarks WHERE user_id = ? AND blog_id = ?").get(user_id, blog_id);
      if (existing) {
        db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND blog_id = ?").run(user_id, blog_id);
        res.json({ bookmarked: false });
      } else {
        db.prepare("INSERT INTO bookmarks (user_id, blog_id) VALUES (?, ?)").run(user_id, blog_id);
        res.json({ bookmarked: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Bookmark failed" });
    }
  });

  app.get("/api/bookmarks", (req, res) => {
    const { user_id } = req.query;
    try {
      const blogs = db.prepare(`
        SELECT b.*, u.username as author_name, u.photo_url as author_photo
        FROM blogs b
        JOIN bookmarks bm ON b.id = bm.blog_id
        JOIN users u ON b.author_id = u.id
        WHERE bm.user_id = ?
        ORDER BY bm.created_at DESC
      `).all(user_id);
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/notifications", (req, res) => {
    const { user_id } = req.query;
    try {
      const notifications = db.prepare(`
        SELECT n.*, u.username as from_name, u.photo_url as from_photo
        FROM notifications n
        LEFT JOIN users u ON n.from_user_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
      `).all(user_id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/read", (req, res) => {
    const { user_id } = req.body;
    try {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(user_id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  app.post("/api/reports", (req, res) => {
    const { reporter_id, blog_id, reason } = req.body;
    try {
      db.prepare("INSERT INTO reports (reporter_id, blog_id, reason) VALUES (?, ?, ?)").run(reporter_id, blog_id, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Reporting failed" });
    }
  });

  app.get("/api/admin/reports", (req, res) => {
    const { userId } = req.query;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
    if (!user || (user as any).role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    try {
      const reports = db.prepare(`
        SELECT r.*, b.title as blog_title, u.username as reporter_name
        FROM reports r
        JOIN blogs b ON r.blog_id = b.id
        JOIN users u ON r.reporter_id = u.id
        ORDER BY r.created_at DESC
      `).all();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/admin/users/:id/ban", (req, res) => {
    const { userId, is_banned } = req.body;
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
    if (!admin || (admin as any).role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    try {
      db.prepare("UPDATE users SET is_banned = ? WHERE id = ?").run(is_banned ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Action failed" });
    }
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
      SELECT 
        u.id,
        u.username, 
        u.photo_url,
        COUNT(DISTINCT b.id) as blog_count, 
        SUM(b.views) as total_views,
        (SELECT COUNT(*) FROM reactions r WHERE r.blog_id IN (SELECT id FROM blogs WHERE author_id = u.id)) as total_reactions,
        (SELECT COUNT(DISTINCT bt.tag_id) FROM blog_tags bt WHERE bt.blog_id IN (SELECT id FROM blogs WHERE author_id = u.id)) as unique_tags
      FROM users u
      JOIN blogs b ON u.id = b.author_id
      GROUP BY u.id
      ORDER BY total_views DESC
      LIMIT 10
    `).all().map((writer: any) => {
      // Logic for level based on stats
      const blogPoints = writer.blog_count * 50;
      const viewPoints = writer.total_views;
      const reactionPoints = (writer.total_reactions || 0) * 10;
      const uniquenessPoints = (writer.unique_tags || 0) * 20;
      
      const totalScore = blogPoints + viewPoints + reactionPoints + uniquenessPoints;
      
      let level = "Rookie";
      let color = "text-slate-400";
      
      if (totalScore >= 5000) { level = "Legendary Writer"; color = "text-rose-500"; }
      else if (totalScore >= 2000) { level = "Master Creator"; color = "text-orange-500"; }
      else if (totalScore >= 1000) { level = "Expert Author"; color = "text-indigo-600"; }
      else if (totalScore >= 500) { level = "Elite Contributor"; color = "text-emerald-500"; }
      else if (totalScore >= 100) { level = "Rising Star"; color = "text-amber-500"; }

      return {
        ...writer,
        totalScore,
        level,
        levelColor: color,
        uniqueness: writer.unique_tags > 10 ? "High" : writer.unique_tags > 5 ? "Moderate" : "Focused"
      };
    });
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

  // User Profile APIs
  app.get("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { viewer_id } = req.query;

    try {
      const user = db.prepare(`
        SELECT id, username, email, bio, photo_url, created_at, role
        FROM users WHERE id = ?
      `).get(id) as any;

      if (!user) return res.status(404).json({ error: "User not found" });

      const postCount = db.prepare("SELECT COUNT(*) as count FROM blogs WHERE author_id = ? AND visibility = 'public'").get(id) as any;
      const followersCount = db.prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?").get(id) as any;
      const followingCount = db.prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?").get(id) as any;
      
      let isFollowing = false;
      if (viewer_id) {
        const follow = db.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?").get(viewer_id, id);
        isFollowing = !!follow;
      }

      res.json({
        ...user,
        postCount: postCount.count,
        followersCount: followersCount.count,
        followingCount: followingCount.count,
        isFollowing
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:id/posts", (req, res) => {
    const { id } = req.params;
    const { viewer_id } = req.query;

    try {
      const blogs = db.prepare(`
        SELECT b.*, u.username as author_name, u.photo_url as author_photo,
        (SELECT COUNT(*) FROM reactions r WHERE r.blog_id = b.id) as reaction_count
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.author_id = ? AND (b.visibility = 'public' OR b.author_id = ?)
        ORDER BY b.created_at DESC
      `).all(id, viewer_id || -1);
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  app.post("/api/users/:id/follow", (req, res) => {
    const { id: followingId } = req.params;
    const { follower_id } = req.body;

    if (!follower_id) return res.status(400).json({ error: "Follower ID required" });
    if (Number(follower_id) === Number(followingId)) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    try {
      const existing = db.prepare("SELECT id FROM follows WHERE follower_id = ? AND following_id = ?").get(follower_id, followingId);
      
      if (existing) {
        db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(follower_id, followingId);
        res.json({ followed: false });
      } else {
        db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)").run(follower_id, followingId);
        res.json({ followed: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Follow action failed" });
    }
  });

  // Delete consolidated to line 612


  // Admin User Management APIs
  app.get("/api/admin/users", (req, res) => {
    const { userId, search } = req.query;
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as any;
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
      let users;
      if (search) {
        users = db.prepare("SELECT id, username, email, role, created_at FROM users WHERE username LIKE ? OR email LIKE ?").all(`%${search}%`, `%${search}%`);
      } else {
        users = db.prepare("SELECT id, username, email, role, created_at FROM users").all();
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as any;
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    const targetUser = db.prepare("SELECT email FROM users WHERE id = ?").get(id) as any;
    if (targetUser?.email === "sajidahmad1001@gmail.com") {
      return res.status(400).json({ error: "Cannot delete the main admin" });
    }

    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
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
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;

  app.listen(PORT, "0.0.0.0", () => {
    const serverTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(new Date());

    console.log(`
🚀 Smart Blog Server Started Successfully
------------------------------------------
Current Server Time (IST): ${serverTime}
Port: ${PORT}
URL: http://localhost:${PORT}

Local Deployment Steps:
1. Ensure Node.js (v18+) is installed.
2. Run 'npm install' to install dependencies.
3. Run 'npm run build' to generate production files.
4. Run 'npm start' to launch the production server.
------------------------------------------
    `);
  });
}

startServer();
