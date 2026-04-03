import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/neon_chat',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test DB connection and initialize tables
async function initDb() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        friend_id INTEGER REFERENCES users(id),
        status TEXT DEFAULT 'pending', -- pending, accepted
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      );
    `);
    client.release();
  } catch (err) {
    console.error('Database initialization error:', err);
    console.log('Continuing without database... (Mock mode)');
  }
}

initDb();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  app.use(express.json());

  const JWT_SECRET = process.env.JWT_SECRET || 'neon-secret-key-2077';

  // Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url',
        [username, email, passwordHash]
      );
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ user, token });
    } catch (err) {
      res.status(400).json({ error: 'User already exists or invalid data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        res.json({ user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url }, token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // User Profile
  app.get('/api/users/me', authenticate, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT id, username, email, avatar_url FROM users WHERE id = $1', [req.userId]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/users/search', authenticate, async (req: any, res) => {
    const { query } = req.query;
    try {
      const q = (query || '').toString().toLowerCase();
      const currentUserId = parseInt(req.userId);

      // Fetch friendships to determine status
      const friendRes = await pool.query('SELECT * FROM friendships WHERE user_id = $1 OR friend_id = $1', [currentUserId]);
      const friendships = friendRes.rows;

      // Fetch all users to filter in JS (temporary robust fix)
      const result = await pool.query('SELECT id, username, email, avatar_url FROM users LIMIT 100');
      
      const filtered = result.rows.filter(u => {
        const matches = (u.username || '').toLowerCase().includes(q) || 
                        (u.email || '').toLowerCase().includes(q);
        const notMe = u.id !== currentUserId;
        return matches && notMe;
      }).map(u => {
         const rel = friendships.find(f => f.user_id === u.id || f.friend_id === u.id);
         return {
             id: u.id,
             username: u.username,
             avatar_url: u.avatar_url,
             friendship_status: rel ? rel.status : 'none'
         };
      }).slice(0, 10);
      
      res.json(filtered);
    } catch (err: any) {
      console.error('SEARCH_JS_ERROR:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/:id', authenticate, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT id, username, avatar_url FROM users WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/users/me', authenticate, async (req: any, res) => {
    const { username, avatar_url } = req.body;
    try {
      const result = await pool.query(
        'UPDATE users SET username = COALESCE($1, username), avatar_url = COALESCE($2, avatar_url) WHERE id = $3 RETURNING id, username, email, avatar_url',
        [username, avatar_url, req.userId]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });


  // Friendships
  app.get('/api/friends', authenticate, async (req: any, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.username, u.avatar_url, f.status
        FROM friendships f
        JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
        WHERE (f.user_id = $1 OR f.friend_id = $1) AND u.id != $1 AND f.status = 'accepted'
      `, [req.userId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/friends/pending', authenticate, async (req: any, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.username, u.avatar_url, f.id as friendship_id
        FROM friendships f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = $1 AND f.status = 'pending'
      `, [req.userId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/friends/request', authenticate, async (req: any, res) => {
    const { friendId } = req.body;
    try {
      await pool.query(
        'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT (user_id, friend_id) DO NOTHING',
        [req.userId, friendId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/friends/accept', authenticate, async (req: any, res) => {
    const { friendId } = req.body;
    try {
      await pool.query(
        'UPDATE friendships SET status = \'accepted\' WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
        [friendId, req.userId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/friends/remove', authenticate, async (req: any, res) => {
    const { friendId } = req.body;
    try {
      await pool.query(
        'DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
        [friendId, req.userId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Chats & Messages
  app.get('/api/chats', authenticate, async (req: any, res) => {
    try {
      // Complex query to get user list with last message
      const result = await pool.query(`
        WITH LastMessages AS (
          SELECT 
            CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
            content,
            created_at,
            ROW_NUMBER() OVER(PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
          FROM messages
          WHERE sender_id = $1 OR receiver_id = $1
        )
        SELECT u.id, u.username, u.avatar_url, lm.content as last_message, lm.created_at as last_message_at
        FROM LastMessages lm
        JOIN users u ON lm.other_user_id = u.id
        WHERE lm.rn = 1
        ORDER BY lm.created_at DESC
      `, [req.userId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/messages/:otherUserId', authenticate, async (req: any, res) => {
    const { otherUserId } = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at ASC',
        [req.userId, otherUserId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('send_message', async (data) => {
      const { senderId, receiverId, content, type } = data;
      try {
        const result = await pool.query(
          'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES ($1, $2, $3, $4) RETURNING *',
          [senderId, receiverId, content, type || 'text']
        );
        const message = result.rows[0];
        io.to(`user_${receiverId}`).emit('receive_message', message);
        socket.emit('message_sent', message);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('GLOBAL_ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error (Global)', message: err.message });
  });

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
