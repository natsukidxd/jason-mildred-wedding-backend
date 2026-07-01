# Backend Fullstack Implementation Guide

## Overview
Transform the current in-memory Express backend into a fullstack application using **Supabase** (PostgreSQL database) with **Sequelize ORM** for schema management and data synchronization.

## Current State
- Express.js backend with TypeScript
- In-memory arrays for RSVP and Comments data
- Basic API endpoints: `/api/rsvp`, `/api/comments`, `/api/health`
- Manual data management (resets on restart)

## Target Architecture
- **Database**: Supabase PostgreSQL
- **ORM**: Sequelize for schema definitions and migrations
- **Backend**: Express.js with Sequelize models
- **Frontend**: React app connected to backend API

---

## Implementation Steps

### 1. Database Setup (Supabase)

#### Required Setup:
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get database credentials from Project Settings > Database
4. Install Supabase CLI for local development (optional)

#### Environment Configuration:
Create `.env` in the backend root:
```env
# Database Configuration
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_SSL=true

# Server Configuration
PORT=4000
NODE_ENV=development

# Supabase Direct URL (optional, for migrations)
SUPABASE_DB_URL=postgresql://postgres:password@host:5432/postgres
```

---

### 2. Install Dependencies

Run these commands in the backend directory:

```bash
# Core dependencies
npm install sequelize pg pg-hstore dotenv
npm install --save-dev @types/pg @types/pg-hstore

# Existing dependencies (already installed)
npm install cors express zod
npm install tsx typescript --save-dev
```

**package.json dependencies should include:**
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "sequelize": "^6.37.3",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "zod": "^3.23.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.5.0",
    "@types/pg": "^8.11.6",
    "@types/pg-hstore": "^2.3.1"
  }
}
```

---

### 3. Database Schema with Sequelize

#### Create `src/models/index.ts` (Database Configuration)
```typescript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    require: true,
    rejectUnauthorized: false
  } : undefined,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export { sequelize };
export default sequelize;
```

#### Create `src/models/RSVP.ts` (RSVP Model)
```typescript
import { DataTypes } from 'sequelize';
import { sequelize } from './index';

class RSVP extends DataTypes.Model {
  public id!: string;
  public name!: string;
  public attendance!: string;
  public guests!: number;
  public wishes!: string;
}

RSVP.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  attendance: {
    type: DataTypes.ENUM('Hadir', 'Tidak Hadir'),
    allowNull: false,
  },
  guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 2,
    },
  },
  wishes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'rsvps',
  timestamps: true,
  updatedAt: false,
});

export { RSVP };
export default RSVP;
```

#### Create `src/models/Comment.ts` (Comment/Wishes Model)
```typescript
import { DataTypes } from 'sequelize';
import { sequelize } from './index';
import { RSVP } from './RSVP';

class Comment extends DataTypes.Model {
  public id!: string;
  public name!: string;
  public message!: string;
  public attendance!: string;
}

Comment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  attendance: {
    type: DataTypes.ENUM('Hadir', 'Tidak Hadir'),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'comments',
  timestamps: true,
  indexes: [
    {
      fields: ['createdAt'],
    },
  ],
});

// Define associations
RSVP.hasMany(Comment, { foreignKey: 'name', sourceKey: 'name' });
Comment.belongsTo(RSVP, { foreignKey: 'name', targetKey: 'name' });

export { Comment };
export default Comment;
```

#### Update `src/models/index.ts` to Initialize Models
```typescript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import RSVP from './RSVP';
import Comment from './Comment';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    require: true,
    rejectUnauthorized: false
  } : undefined,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Initialize models
const models = {
  RSVP: RSVP.init(sequelize),
  Comment: Comment.init(sequelize),
};

// Define associations AFTER models are initialized
Object.keys(models).forEach(modelName => {
  if (models[modelName as keyof typeof models].associate) {
    models[modelName as keyof typeof models].associate!(models);
  }
});

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database synchronized'))
  .catch(err => console.error('❌ Database sync error:', err));

export { sequelize, models };
export default sequelize;
export { RSVP, Comment };
```

---

### 4. Create Database Migration Script

#### Create `src/migrations/001-create-tables.ts`
```typescript
import { sequelize } from '../models';

async function migrate() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

Add to package.json:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "tsx src/seed.ts",
    "migrate": "tsx src/migrations/001-create-tables.ts"
  }
}
```

---

### 5. API Layer Implementation

#### Update `src/routes/rsvp.ts`
```typescript
import { Router } from 'express';
import { RSVP } from '../models';
import { z } from 'zod';

const router = Router();

// Validation schema
const rsvpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  attendance: z.enum(['Hadir', 'Tidak Hadir']),
  guests: z.number().min(1).max(2).default(1),
  wishes: z.string().optional(),
});

// POST /api/rsvp - Create RSVP
router.post('/', async (req, res) => {
  try {
    const validatedData = rsvpSchema.parse(req.body);
    
    const rsvp = await RSVP.create({
      ...validatedData,
      wishes: validatedData.wishes || '',
    });

    // Auto-create comment from RSVP wishes
    if (validatedData.wishes) {
      const { Comment } = await import('../models');
      await Comment.create({
        name: validatedData.name,
        message: validatedData.wishes,
        attendance: validatedData.attendance,
      });
    }

    res.status(201).json({
      success: true,
      data: rsvp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    console.error('RSVP creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create RSVP',
    });
  }
});

// GET /api/rsvp - Get all RSVPs (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const rsvps = await RSVP.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({
      success: true,
      data: rsvps,
    });
  } catch (error) {
    console.error('RSVP fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RSVPs',
    });
  }
});

export default router;
```

#### Update `src/routes/comments.ts`
```typescript
import { Router } from 'express';
import { Comment } from '../models';

const router = Router();

// GET /api/comments - Get paginated comments
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * perPage;

    const { count, rows: comments } = await Comment.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: perPage,
      offset: offset,
    });

    const totalPages = Math.ceil(count / perPage);

    res.json({
      success: true,
      data: {
        comments: comments.map(c => ({
          id: Number(c.id.slice(0, 8), 16), // Simple ID conversion for frontend
          name: c.name,
          message: c.message,
          attendance: c.attendance,
          timestamp: formatTimestamp(c.createdAt),
        })),
        page,
        totalPages,
        total: count,
      },
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
    });
  }
});

// Helper function
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

export default router;
```

---

### 6. Update Main Server File

#### Update `src/server.ts`
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rsvpRoutes from './routes/rsvp';
import commentRoutes from './routes/comments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' 
  });
});

// API Routes
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/comments', commentRoutes);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: Connected to Supabase`);
});
```

---

### 7. Frontend Integration

#### Update `src/config.ts`
```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
};
```

#### Update `src/components/RsvpSection.tsx`
```typescript
import React, { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { config } from '../config';
import './RsvpSection.css';

const RsvpSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [form, setForm] = useState({ name: '', attendance: '', guests: '1', wishes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAttendanceChange = (value: string) => {
    setForm(prev => ({ ...prev, attendance: value }));
    setShowGuests(value === 'Hadir');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          attendance: form.attendance,
          guests: Number(form.guests),
          wishes: form.wishes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit RSVP');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="wishes" className="rsvp-section" ref={ref}>
        <div className="section-container">
          <div className="success-message">
            <span className="success-icon">✓</span>
            <p>RSVP successfully submitted!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="wishes" className="rsvp-section" ref={ref}>
      <div className="section-container">
        <h2 className={`section-title ${isVisible ? 'fade-in delay-1' : ''}`}>RSVP</h2>
        <p className={`section-description ${isVisible ? 'fade-in delay-2' : ''}`}>
          For guests attending our wedding, please confirm your attendance by filling out the form below:
        </p>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form className={`rsvp-form ${isVisible ? 'fade-in delay-2' : ''}`} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Attendance</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="attendance"
                  value="Hadir"
                  checked={form.attendance === 'Hadir'}
                  onChange={() => handleAttendanceChange('Hadir')}
                  required
                />
                <span>Attending</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="attendance"
                  value="Tidak Hadir"
                  checked={form.attendance === 'Tidak Hadir'}
                  onChange={() => handleAttendanceChange('Tidak Hadir')}
                  required
                />
                <span>Not Attending</span>
              </label>
            </div>
          </div>

          {showGuests && (
            <div className="form-group">
              <label>Number of Guests</label>
              <select value={form.guests} onChange={e => setForm(prev => ({ ...prev, guests: e.target.value }))}>
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Wishes & Messages</label>
            <textarea
              required
              rows={4}
              placeholder="Write your wishes for us"
              value={form.wishes}
              onChange={e => setForm(prev => ({ ...prev, wishes: e.target.value }))}
            />
          </div>

          <div className="btn-wrapper">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RsvpSection;
```

#### Update `src/components/WishesSection.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { config } from '../config';
import './WishesSection.css';

interface Comment {
  id: number;
  name: string;
  message: string;
  timestamp: string;
  attendance: string;
}

const WishesSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 3;

  useEffect(() => {
    fetchComments(1);
  }, []);

  const fetchComments = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/comments?page=${pageNum}&limit=${perPage}`);
      const result = await response.json();
      
      if (result.success) {
        setComments(result.data.comments);
        setTotalPages(result.data.totalPages);
        setPage(result.data.page);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchComments(newPage);
  };

  return (
    <section className="wishes-section" ref={ref}>
      <div className="section-container">
        <h2 className={`section-title ${isVisible ? 'fade-in delay-1' : ''}`}>WISHES</h2>
        <p className={`section-description ${isVisible ? 'fade-in delay-2' : ''}`}>
          Thank you for your wishes, prayers, and love — they mean the world to us!
        </p>

        <div className={`wishes-list ${isVisible ? 'fade-in delay-3' : ''}`}>
          {loading ? (
            <div className="loading">Loading wishes...</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="wish-card">
                <div className="wish-name">
                  <span>{comment.name}</span>
                  <svg className="verified-icon" width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path fill="#3d9a62" d="M17.645 8.032c-.294-.307-.599-.625-.714-.903-.106-.256-.112-.679-.118-1.089-.012-.762-.025-1.626-.626-2.227s-1.465-.614-2.227-.626c-.41-.006-.833-.012-1.089-.118-.278-.115-.596-.42-.903-.714-.54-.518-1.152-1.105-1.968-1.105-.816 0-1.428.587-1.968 1.105-.307.294-.625.599-.903.714-.256.106-.679.112-1.089.118-.762.012-1.626.025-2.227.626s-.614 1.465-.626 2.227c-.006.41-.012.833-.118 1.089-.115-.278-.42-.596-.714-.903C1.837 8.572 1.25 9.184 1.25 10c0 .816.587 1.428 1.105 1.968.294.307.599.625.714.903.106.256.112.679.118 1.089.012.762.025 1.626.626 2.227s1.465.614 2.227.626c.41.006.833.012 1.089.118.278.115.596.42.903.714.54.518 1.152 1.105 1.968 1.105.816 0 1.428-.587 1.968-1.105.307-.294.625-.599.903-.714.256-.106.679-.112 1.089-.118.762-.012 1.626-.025 2.227-.626s.614-1.465.626-2.227c.006-.41.012-.833.118-1.089.115-.278.42-.596.714-.903.518-.54 1.105-1.152 1.105-1.968 0-.816-.587-1.428-1.105-1.968Z"/>
                  </svg>
                </div>
                <p className="wish-message">{comment.message}</p>
                <span className="wish-time">{comment.timestamp}</span>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-num ${page === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default WishesSection;
```

---

### 8. Create Environment Files

#### Backend `.env`
```env
# Database Configuration (Supabase)
DB_HOST=db.xxxxxxxx.project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_SSL=true

# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend `.env` (in jason-mildred-wedding-frontend/)
```env
VITE_API_URL=http://localhost:4000/api
```

---

### 9. Create Seed Script (Optional)

#### Create `src/seed.ts`
```typescript
import { sequelize, RSVP, Comment } from './models';

async function seed() {
  try {
    await sequelize.sync({ force: true });
    
    // Seed sample RSVPs
    await RSVP.bulkCreate([
      {
        name: 'Person 1',
        attendance: 'Hadir',
        guests: 1,
        wishes: 'Congratulations on your wedding! Wishing you a lifetime of love and happiness together. 💕',
      },
      {
        name: 'Person 2',
        attendance: 'Tidak Hadir',
        guests: 1,
        wishes: 'So sorry I cannot attend, but I will be there in spirit. Congratulations! 💐',
      },
      {
        name: 'Person 3',
        attendance: 'Hadir',
        guests: 2,
        wishes: 'Wishing you both a wonderful journey ahead. May your love continue to grow! 🌟',
      },
      {
        name: 'Person 4',
        attendance: 'Hadir',
        guests: 1,
        wishes: 'So happy for you both! Here is to a beautiful forever. Cheers! 🥂',
      },
    ]);

    // Seed comments
    await Comment.bulkCreate([
      {
        name: 'Person 1',
        message: 'Congratulations on your wedding! Wishing you a lifetime of love and happiness together. 💕',
        attendance: 'Hadir',
      },
      {
        name: 'Person 2',
        message: 'So sorry I cannot attend, but I will be there in spirit. Congratulations! 💐',
        attendance: 'Tidak Hadir',
      },
      {
        name: 'Person 3',
        message: 'Wishing you both a wonderful journey ahead. May your love continue to grow! 🌟',
        attendance: 'Hadir',
      },
      {
        name: 'Person 4',
        message: 'So happy for you both! Here is to a beautiful forever. Cheers! 🥂',
        attendance: 'Hadir',
      },
    ]);

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
```

---

### 10. Update TypeScript Configuration

#### Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Running the Application

### Backend Development:
```bash
cd jason-mildred-wedding-backend

# 1. Install dependencies
npm install

# 2. Run database migrations
npm run migrate

# 3. (Optional) Seed database with sample data
npm run seed

# 4. Start development server
npm run dev
```

### Frontend Development:
```bash
cd jason-mildred-wedding-frontend

# Start development server (should auto-start on port 5173)
npm run dev
```

---

## Additional Features to Consider

### Authentication (Optional)
Add user authentication if you want admin features:
- Admin login to view/edit RSVPs
- Admin can delete comments
- API key protection for sensitive endpoints

### Additional Models
- **Guests table** (if you want more detailed guest tracking)
- **Photos/Media** (for wedding gallery CRUD)
- **Events** (if you want CMS for event details)

### CORS Configuration
Ensure Supabase RLS (Row Level Security) is configured for PostgreSQL:
```sql
-- Enable RLS on tables
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY "Allow public read on comments" 
  ON comments FOR SELECT USING (true);

CREATE POLICY "Allow public insert on comments" 
  ON comments FOR INSERT WITH CHECK (true);
```

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Database credentials configured in `.env`
- [ ] Dependencies installed (sequelize, pg, pg-hstore)
- [ ] Sequelize models created (RSVP, Comment)
- [ ] Routes updated with database queries
- [ ] Frontend updated to call API endpoints
- [ ] Database migrations run successfully
- [ ] Backend server starts without errors
- [ ] RSVP form submits to database
- [ ] Comments load from database with pagination
- [ ] Data persists after server restart

---

## Troubleshooting

### Connection Issues:
- Ensure Supabase database allows connections from your IP
- Check SSL settings (Supabase requires SSL)
- Verify connection pooling settings

### Sequelize Sync:
- Use `sequelize.sync({ alter: true })` for development
- Use migrations for production deployments
- Run `npm run migrate` before starting server

### CORS Errors:
- Update `FRONTEND_URL` in backend `.env`
- Check browser console for specific CORS errors

---

## Security Considerations

1. **Input Validation**: Zod schemas validate all inputs
2. **SQL Injection**: Sequelize ORM prevents SQL injection
3. **Rate Limiting**: Add `express-rate-limit` for production
4. **Helmet**: Add security headers with `helmet` package
5. **Environment Variables**: Never commit `.env` file

---

This implementation provides a production-ready fullstack wedding website with persistent data storage, proper ORM patterns, and scalable architecture.