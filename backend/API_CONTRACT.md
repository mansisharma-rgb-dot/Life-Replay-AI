# Life Replay AI — API Contract

This document outlines the API contracts and inferred database models required to rebuild the Flask backend, derived strictly from the existing React frontend source code (`src/api/*` and components).

## 1. Discovered API Endpoints

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Payload | Query Params | Auth Required? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `full_name`, `email`, `password`, `confirm_password` | None | No | Create new user account |
| `POST` | `/auth/login` | `email`, `password` | None | No | Authenticate and return JWT |
| `POST` | `/auth/logout` | None | None | Yes | Invalidate session/JWT |
| `POST` | `/auth/refresh` | None | None | Yes (Refresh token) | Issue new access token |
| `GET`  | `/auth/me` | None | None | Yes | Get current user profile |
| `POST` | `/auth/forgot-password` | `email` | None | No | Request password reset |
| `POST` | `/auth/reset-password` | `token`, `password`, `confirm_password` | None | No | Reset user password |

### Daily Check-in Endpoints (`/api/checkins`)
| Method | Endpoint | Payload | Query Params | Auth Required? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET`  | `/checkins/today` | None | None | Yes | Fetch today's draft or completed check-in |
| `POST` | `/checkins/` | `activities` (dict), `mood` (dict), `wellbeing` (dict), `journal` (dict), `daily_rating` (number), `is_completed` (bool) | None | Yes | Upsert (create/update) today's check-in |
| `GET`  | `/checkins/history` | None | `page` (int), `per_page` (int) | Yes | Fetch paginated historical check-ins |

### Analytics Endpoints (`/api/analytics`)
| Method | Endpoint | Payload | Query Params | Auth Required? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET`  | `/analytics/overview` | None | `range` (7d, 30d, 90d, 1y) | Yes | High-level metrics |
| `GET`  | `/analytics/life-score` | None | `range` | Yes | Life Score history |
| `GET`  | `/analytics/mood` | None | `range` | Yes | Mood distribution & history |
| `GET`  | `/analytics/habits` | None | `range` | Yes | Habit completion rates |
| `GET`  | `/analytics/productivity`| None | `range` | Yes | Study, work, screen time, etc |
| `GET`  | `/analytics/sleep` | None | `range` | Yes | Sleep duration and quality |
| `GET`  | `/analytics/water` | None | `range` | Yes | Hydration tracking |
| `GET`  | `/analytics/goals` | None | None | Yes | Goal progress metrics |
| `GET`  | `/analytics/achievements`| None | None | Yes | Unlocked badges/awards |
| `GET`  | `/analytics/correlations`| None | `range` | Yes | AI/statistical correlations |

---

## 2. Inferred Database Entities & Data Models

Based on the payloads sent by the frontend (specifically in `DailyCheckinPage.jsx` and `analyticsApi.js`), the following data structures are required.

### `User`
- `id` (PK)
- `full_name` (String)
- `email` (String, Unique)
- `password_hash` (String)
- `current_streak` (Integer, inferred from analytics)
- `longest_streak` (Integer, inferred from analytics)
- `total_xp` (Integer, inferred from analytics)
- `level` (Integer, inferred from analytics)

### `DailyCheckin`
- `id` (PK)
- `user_id` (FK to User)
- `date` (Date)
- `daily_rating` (Integer)
- `is_completed` (Boolean)

### `Activities` (Relationship to DailyCheckin)
*Note: The frontend groups these under an `activities` object. They could be a JSON column or a separate table mapped 1:1 with DailyCheckin.*
- `study_hours` (Number)
- `work_hours` (Number)
- `exercise_minutes` (Number)
- `reading_minutes` (Number)
- `meditation_minutes` (Number)
- `sleep_hours` (Number)
- `water_intake_ml` (Number)
- `screen_time_minutes` (Number)
- `leisure_hours` (Number)
- `walking_steps` (Number)
- `calories_burned` (Number)

### `MoodLog` (Relationship to DailyCheckin)
- `mood_score` (Integer, 1-10)
- `intensity` (Integer, 1-5)
- `mood_label` (String, e.g., '😐')
- `note` (String/Text)

### `Wellbeing` (Relationship to DailyCheckin)
- `energy_level` (Integer, 1-5)
- `stress_level` (Integer, 1-5)
- `focus_level` (Integer, 1-5)
- `motivation_level` (Integer, 1-5)

### `Journal` (Relationship to DailyCheckin)
- `title` (String)
- `content` (Text)

### `Goal`
- `id` (PK)
- `user_id` (FK to User)
- `title` (String)
- `progress` (Number)
- `target` (Number)
- `category` (String)

### `Achievement`
- `id` (PK)
- `user_id` (FK to User)
- `name` (String)
- `description` (String)
- `icon` (String)
- `unlocked_at` (Date/DateTime)

---

## 3. Relationships
- **User (1) to Many (DailyCheckin)**
- **User (1) to Many (Goal)**
- **User (1) to Many (Achievement)**
- **DailyCheckin (1) to One (Activities)**
- **DailyCheckin (1) to One (MoodLog)**
- **DailyCheckin (1) to One (Wellbeing)**
- **DailyCheckin (1) to One (Journal)**
