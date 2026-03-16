# ENGSE207 Software Architecture
## Final Lab Set 2: Database-per-Service + Railway Deployment

### สมาชิกในกลุ่ม

| ชื่อ-สกุล | รหัสนักศึกษา |
|---|---|
| นายภาคิน กันทะวงค์ | 6743210062-5 |
| นายธวัชชัย สุหงษา | 6743210019-5 |

## ภาพรวม

Set 2 ขยายระบบจาก Set 1 จาก 2 services เป็น 3 services และเปลี่ยนจาก shared database ไปเป็น database-per-service โดยคง data model หลักดังนี้:

- `auth-db.users.id` เป็น `SERIAL PRIMARY KEY`
- JWT ใช้ `sub = user.id`
- `task-db.tasks.user_id` และ `user-db.user_profiles.user_id` เป็น `INTEGER`
- ทุก service ใช้ `JWT_SECRET` ค่าเดียวกัน

ระบบประกอบด้วย:

- `auth-service` สำหรับ `register`, `login`, `verify`, `me`
- `task-service` สำหรับ CRUD tasks ของผู้ใช้
- `user-service` สำหรับ profile ของผู้ใช้และ admin listing

## Architecture

```text
Browser / Postman / Frontend
        |
        +--> auth-service:3001 --> auth-db
        |
        +--> task-service:3002 --> task-db
        |
        +--> user-service:3003 --> user-db
```

หมายเหตุ: local compose ใน repo นี้เน้น Option A คือ frontend/client เรียกแต่ละ service โดยตรงเพื่อลดความซับซ้อนก่อน deploy บน Railway

## โครงสร้างฐานข้อมูล

### auth-db

- `users(id, username, email, password_hash, role, created_at, last_login)`
- `logs(id, level, event, user_id, message, meta, created_at)`

### task-db

- `tasks(id, user_id, title, description, status, priority, created_at, updated_at)`
- `logs(id, level, event, user_id, message, meta, created_at)`

### user-db

- `user_profiles(id, user_id, username, email, role, display_name, bio, avatar_url, updated_at)`
- `logs(id, level, event, user_id, message, meta, created_at)`

## Local Setup

1. สร้างไฟล์ environment:

```bash
cp .env.example .env
```

2. รัน services ทั้งหมด:

```bash
docker compose up --build
```

3. ทดสอบ endpoint หลัก:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","email":"alice@lab.local","password":"alice123"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@lab.local","password":"alice123"}'
```

นำ token ที่ได้ไปเรียก:

- `GET http://localhost:3001/api/auth/me`
- `GET http://localhost:3002/api/tasks`
- `POST http://localhost:3002/api/tasks`
- `GET http://localhost:3003/api/users/me`
- `PUT http://localhost:3003/api/users/me`

## API Summary

### Auth Service

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify`
- `GET /api/auth/me`
- `GET /api/auth/health`

### Task Service

- `GET /api/tasks/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### User Service

- `GET /api/users/health`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users` admin only

`GET /api/users/me` จะสร้าง profile เริ่มต้นให้อัตโนมัติถ้ายังไม่มี record ใน `user_profiles`

## Railway Deploy

ตั้งค่าแต่ละ service ใน Railway แยกกันดังนี้

### Auth Service

- Root Directory: `auth-service`
- `DATABASE_URL=${{auth-db.DATABASE_URL}}`
- `JWT_SECRET=your-shared-jwt-secret-here`
- `JWT_EXPIRES_IN=1h`
- `PORT=3001`
- `NODE_ENV=production`

### Task Service

- Root Directory: `task-service`
- `DATABASE_URL=${{task-db.DATABASE_URL}}`
- `JWT_SECRET=your-shared-jwt-secret-here`
- `PORT=3002`
- `NODE_ENV=production`

### User Service

- Root Directory: `user-service`
- `DATABASE_URL=${{user-db.DATABASE_URL}}`
- `JWT_SECRET=your-shared-jwt-secret-here`
- `PORT=3003`
- `NODE_ENV=production`

### Frontend

- Root Directory: `frontend`
- Start Command: `npm start`
- `PORT=8080`
- `AUTH_URL=https://auth-service-production.up.railway.app`
- `TASK_URL=https://task-service-production.up.railway.app`
- `USER_URL=https://user-service-production.up.railway.app`

frontend จะอ่านค่าเหล่านี้จาก environment แล้วสร้าง `config.js` ตอน runtime ให้เอง จึงไม่ต้องแก้ URL hardcode ในไฟล์ก่อน deploy

## Gateway Strategy

เลือกใช้ Option A: frontend หรือ Postman เรียก URL ของแต่ละ service โดยตรง

เหตุผล:

- deploy ง่ายที่สุด
- ลดความเสี่ยงจากการตั้งค่า gateway เพิ่มระหว่างสอบ
- เหมาะกับระบบ 3 services ที่มี endpoint ชัดเจน

ตัวอย่าง `frontend/config.js`

```js
window.APP_CONFIG = {
  AUTH_URL: 'https://auth-service-production.up.railway.app',
  TASK_URL: 'https://task-service-production.up.railway.app',
  USER_URL: 'https://user-service-production.up.railway.app'
};
```
