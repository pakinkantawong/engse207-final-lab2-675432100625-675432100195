# ENGSE207 Software Architecture
## Final Lab Set 2: Database-per-Service + Railway Deployment

---

## 1. ข้อมูลรายวิชาและสมาชิก

**รายวิชา:** ENGSE207 Software Architecture
**ชื่องาน:** Final Lab — ชุดที่ 2: Database-per-Service + Railway Deployment

### สมาชิกในกลุ่ม

| ชื่อ-สกุล | รหัสนักศึกษา |
|---|---|
| นายภาคิน กันทะวงค์ | 6743210062-5 |
| นายธวัชชัย สุหงษา | 6743210019-5 |

**Repository:** `engse207-final-lab2-675432100625-675432100195`

---

## 2. ภาพรวมของระบบ

Set 2 ขยายระบบจาก Set 1 จาก 2 services เป็น 3 services และเปลี่ยนจาก shared database ไปเป็น **database-per-service** โดยคง data model หลักดังนี้

- `auth-db.users.id` เป็น `SERIAL PRIMARY KEY`
- JWT ใช้ `sub = user.id`
- `task-db.tasks.user_id` และ `user-db.user_profiles.user_id` เป็น `INTEGER`
- ทุก service ใช้ `JWT_SECRET` ค่าเดียวกัน

ระบบประกอบด้วย

- **auth-service** — register, login, verify, me
- **task-service** — CRUD tasks ของผู้ใช้
- **user-service** — profile ของผู้ใช้และ admin listing

> **หมายเหตุ:** งานชุดนี้เพิ่ม Register API และ User Service จาก Set 1 และ deploy จริงบน Railway Cloud

---

## 3. วัตถุประสงค์ของงาน

งานนี้มีจุดมุ่งหมายเพื่อฝึกให้นักศึกษาสามารถ

- ขยายระบบ Microservices จาก shared DB ไปเป็น database-per-service pattern
- เพิ่ม User Service และ Register API ต่อยอดจาก Set 1
- Deploy microservices จริงบน Railway Cloud platform
- ออกแบบ gateway strategy ที่เหมาะสมสำหรับระบบหลาย service
- จัดการ environment variables และ secrets สำหรับ production

---

## 4. Architecture Overview

```
Browser / Postman / Frontend
        │
        ├──► auth-service:3001 ──► auth-db (PostgreSQL)
        │        users, logs
        │
        ├──► task-service:3002 ──► task-db (PostgreSQL)
        │        tasks, logs
        │
        └──► user-service:3003 ──► user-db (PostgreSQL)
                 user_profiles, logs
```

### Gateway Strategy — Option A (Direct Call)

เลือกใช้ **Option A**: frontend หรือ Postman เรียก URL ของแต่ละ service โดยตรง

**เหตุผล:**
- Deploy ง่ายที่สุด ลดขั้นตอนการตั้งค่า
- ลดความเสี่ยงจากการตั้งค่า gateway เพิ่มระหว่างสอบ
- เหมาะกับระบบ 3 services ที่มี endpoint ชัดเจน

### Services ที่ใช้ในระบบ

| Service | Port | Database | หน้าที่ |
|---|---|---|---|
| `auth-service` | 3001 | auth-db | Register, Login, Verify, Me |
| `task-service` | 3002 | task-db | CRUD Tasks |
| `user-service` | 3003 | user-db | User Profile, Admin listing |
| `frontend` | 8080 | — | Task Board UI |

---

## 5. โครงสร้างฐานข้อมูล

### auth-db
```sql
users(id, username, email, password_hash, role, created_at, last_login)
logs(id, level, event, user_id, message, meta, created_at)
```

### task-db
```sql
tasks(id, user_id, title, description, status, priority, created_at, updated_at)
logs(id, level, event, user_id, message, meta, created_at)
```

### user-db
```sql
user_profiles(id, user_id, username, email, role, display_name, bio, avatar_url, updated_at)
logs(id, level, event, user_id, message, meta, created_at)
```

---

## 6. โครงสร้าง Repository

```
engse207-final-lab2-675432100625-675432100195/
├── README.md
├── TEAM_SPLIT.md
├── INDIVIDUAL_REPORT_6743210062-5.md
├── INDIVIDUAL_REPORT_6743210019-5.md
├── docker-compose.yml
├── .env.example
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/auth.js
│       ├── middleware/jwtUtils.js
│       └── db/db.js
├── task-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/tasks.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── jwtUtils.js
│       └── db/db.js
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/users.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── jwtUtils.js
│       └── db/db.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── public/
│       ├── index.html
│       └── config.js
└── screenshots/
    ├── 01_docker_running.png
    ├── 02_register.png
    └── ...
```

---

## 7. เทคโนโลยีที่ใช้

| Category | Technology |
|---|---|
| Runtime | Node.js / Express.js |
| Database | PostgreSQL (database-per-service) |
| Containerization | Docker / Docker Compose |
| Frontend | HTML / CSS / JavaScript |
| Authentication | JWT |
| Password Hashing | bcryptjs |
| Cloud Platform | Railway |

---

## 8. การตั้งค่าและการรันในเครื่อง (Local Setup)

### 8.1 สร้างไฟล์ .env

```bash
cp .env.example .env
```

ตัวอย่างค่าใน `.env`:

```env
JWT_SECRET=engse207-super-secret-change-me
JWT_EXPIRES_IN=1h

AUTH_DB_URL=postgresql://admin:secret@auth-db:5432/authdb
TASK_DB_URL=postgresql://admin:secret@task-db:5432/taskdb
USER_DB_URL=postgresql://admin:secret@user-db:5432/userdb
```

### 8.2 รันระบบ

```bash
docker compose up --build
```

### 8.3 ทดสอบ endpoint หลัก

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","email":"alice@lab.local","password":"alice123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@lab.local","password":"alice123"}'
```

นำ `token` ที่ได้ไปเรียก endpoints อื่น:

```bash
# Auth
curl http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"

# Tasks
curl http://localhost:3002/api/tasks -H "Authorization: Bearer $TOKEN"

# User Profile
curl http://localhost:3003/api/users/me -H "Authorization: Bearer $TOKEN"
```

> **หมายเหตุ:** `GET /api/users/me` จะสร้าง profile เริ่มต้นให้อัตโนมัติถ้ายังไม่มี record ใน `user_profiles`

---

Gateway Strategy
 
นักศึกษาต้องเลือก 1 วิธี — กลุ่มนี้เลือก **Option A**
 
| Option | วิธี | ความยาก | แนะนำ |
|---|---|---|:---:|
| **A** | Frontend เรียก URL ของแต่ละ service โดยตรงผ่าน `config.js` | ง่าย | ✅ |
| B | Deploy Nginx เป็น 1 service บน Railway เป็น single entry point | ปานกลาง | |
| C | ทำ API Gateway ด้วย Express ทำ proxy ไปแต่ละ service | ปานกลาง | |
 
**เหตุผลที่เลือก Option A:**
- Deploy ง่ายที่สุด ลดขั้นตอนการตั้งค่าระหว่างสอบ
- Frontend อ่าน URL จาก `window.APP_CONFIG` ที่ inject ตอน runtime ทำให้ใช้ image เดิมได้ทั้ง local และ Railway
- เหมาะกับระบบ 3 services ที่มี endpoint ชัดเจนและไม่ซับซ้อน
 
```javascript
// frontend/public/config.js (inject ตอน container start)
window.APP_CONFIG = {
  AUTH_URL: 'https://auth-service-production.up.railway.app',
  TASK_URL: 'https://task-service-production.up.railway.app',
  USER_URL: 'https://user-service-production.up.railway.app'
};

##  Railway Deployment
 
### 9.1 การตั้งค่า Environment Variables บน Railway
 
**Auth Service**
```
Root Directory: auth-service
DATABASE_URL=${{auth-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
JWT_EXPIRES_IN=1h
PORT=3001
NODE_ENV=production
```
 
**Task Service**
```
Root Directory: task-service
DATABASE_URL=${{task-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
PORT=3002
NODE_ENV=production
```
 
**User Service**
```
Root Directory: user-service
DATABASE_URL=${{user-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
PORT=3003
NODE_ENV=production
```
 
**Frontend**
```
Root Directory: frontend
Start Command: npm start
PORT=8080
AUTH_URL=https://auth-service-production.up.railway.app
TASK_URL=https://task-service-production.up.railway.app
USER_URL=https://user-service-production.up.railway.app
```
 
> Frontend อ่านค่า URL จาก environment แล้วสร้าง `config.js` ตอน runtime ให้เอง จึงไม่ต้องแก้ URL hardcode ในไฟล์ก่อน deploy
 
### 9.2 ตัวอย่าง config.js ที่ได้
 
```javascript
window.APP_CONFIG = {
  AUTH_URL: 'https://auth-service-production.up.railway.app',
  TASK_URL: 'https://task-service-production.up.railway.app',
  USER_URL:  'https://user-service-production.up.railway.app'
};
```
 
---

**Auth Service**
```
Root Directory: auth-service
DATABASE_URL=${{auth-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
JWT_EXPIRES_IN=1h
PORT=3001
NODE_ENV=production
```

**Task Service**
```
Root Directory: task-service
DATABASE_URL=${{task-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
PORT=3002
NODE_ENV=production
```

**User Service**
```
Root Directory: user-service
DATABASE_URL=${{user-db.DATABASE_URL}}
JWT_SECRET=your-shared-jwt-secret-here
PORT=3003
NODE_ENV=production
```

**Frontend**
```
Root Directory: frontend
Start Command: npm start
PORT=8080
AUTH_URL=https://auth-service-production.up.railway.app
TASK_URL=https://task-service-production.up.railway.app
USER_URL=https://user-service-production.up.railway.app
```

> Frontend อ่านค่า URL จาก environment แล้วสร้าง `config.js` ตอน runtime ให้เอง จึงไม่ต้องแก้ URL hardcode ในไฟล์ก่อน deploy

### 10.2 ตัวอย่าง config.js ที่ได้

```javascript
window.APP_CONFIG = {
  AUTH_URL: 'https://auth-service-production.up.railway.app',
  TASK_URL: 'https://task-service-production.up.railway.app',
  USER_URL:  'https://user-service-production.up.railway.app'
};
```

---

## 11. การแบ่งงานของทีม

รายละเอียดการแบ่งงานของสมาชิกอยู่ในไฟล์:

📄 [`TEAM_SPLIT.md`](./TEAM_SPLIT.md)

และรายงานรายบุคคลของสมาชิกแต่ละคนอยู่ในไฟล์:

📄 [`INDIVIDUAL_REPORT_6743210062-5.md`](./INDIVIDUAL_REPORT_TEAM8.md) 

---

## 12. ปัญหาที่พบและแนวทางแก้ไข

| # | ปัญหา | สาเหตุ | วิธีแก้ไข |
|---|---|---|---|
| 1 | JWT verify ไม่ผ่านระหว่าง services | แต่ละ service ใช้ `JWT_SECRET` คนละค่า | กำหนด `JWT_SECRET` เดียวกันใน Railway environment ทุก service |
| 2 | `user_profiles` ไม่มีข้อมูลตอนเรียก `/me` | ยังไม่มี record ใน user-db ตอน register | เพิ่ม auto-create profile logic ใน `GET /api/users/me` |
| 3 | Database connection ล้มเหลวใน Railway | `DATABASE_URL` ยังไม่ได้ผูกกับ Railway DB | ใช้ `${{service.DATABASE_URL}}` reference ใน Railway dashboard |
| 4 | CORS error เมื่อ frontend เรียก service ต่าง domain | แต่ละ service deploy คนละ URL | เพิ่ม `cors()` middleware และกำหนด allowed origins ใน Express |
| 5 | Docker volume เก็บข้อมูลเดิมทำให้ schema เก่า | Volume ไม่ถูก reset ระหว่าง rebuild | รัน `docker compose down -v` ก่อน `docker compose up --build` |

---

## 13. ข้อจำกัดของระบบ

- ใช้ Option A (direct call) แทน API Gateway จริง ทำให้ frontend ต้องรู้ URL ของแต่ละ service
- แต่ละ service มี `logs` table ของตัวเองแยกกัน ยังไม่ได้รวมเป็น centralized log
- ยังไม่มี health monitoring หรือ auto-restart สำหรับ production
- Free tier ของ Railway อาจมีข้อจำกัดด้าน uptime และ compute

---

## 14. การต่อยอดในอนาคต

- เพิ่ม API Gateway จริง (เช่น Kong หรือ custom Nginx) แทน direct call
- รวม logging ทุก service เข้า centralized platform เช่น ELK Stack
- เพิ่ม Role-based Access Control ให้ละเอียดขึ้น
- เพิ่ม Refresh Token mechanism
- CI/CD pipeline สำหรับ auto deploy เมื่อ push ไปยัง main branch

---

## 15. ภาคผนวก

### ไฟล์สำคัญใน Repository

| ไฟล์ | คำอธิบาย |
|---|---|
| `docker-compose.yml` | Orchestration ทุก container (local) |
| `auth-service/src/routes/auth.js` | Register, login, verify, me |
| `task-service/src/routes/tasks.js` | CRUD task endpoints |
| `user-service/src/routes/users.js` | User profile endpoints |
| `frontend/public/index.html` | Task Board UI |
