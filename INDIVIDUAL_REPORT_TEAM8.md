# INDIVIDUAL_REPORT — TEAM8
## Final Lab Set 2: Database-per-Service + Railway Deployment

---

# 👤 นายภาคิน กันทะวงค์ — 6743210062-5

## ข้อมูลผู้จัดทำ

| | |
|---|---|
| **ชื่อ-นามสกุล** | นายภาคิน กันทะวงค์ |
| **รหัสนักศึกษา** | 6743210062-5 |
| **กลุ่ม** | TEAM8 |
| **เพื่อนร่วมกลุ่ม** | นายธวัชชัย สุหงษา (6743210019-5) |

---

### 1. ส่วนที่รับผิดชอบ

รับผิดชอบด้าน **Backend Development และ Infrastructure** ทั้งหมดของ Set 2 ครอบคลุม Auth Service (ขยายเพิ่ม Register), Task Service (migrate to task-db), User Service (ใหม่ทั้งหมด), Docker Compose (3 databases) และ Railway Deployment

---

### 2. สิ่งที่ได้ลงมือพัฒนาด้วยตนเอง

**Auth Service — ขยายจาก Set 1**
- เพิ่ม `POST /api/auth/register` รองรับ `username`, `email`, `password` พร้อม bcrypt hash ก่อน save
- แยก database ออกเป็น **auth-db** โดยเฉพาะ ปรับ `db/db.js` ให้อ่านจาก `DATABASE_URL` environment variable
- เพิ่ม `logs` table ใน auth-db บันทึก login event, failed attempts และ register event

**Task Service — migrate to database-per-service**
- ปรับ connection จาก shared DB ไปเป็น **task-db** แยกต่างหาก
- เพิ่มคอลัมน์ `status` และ `priority` ใน `tasks` table
- ปรับ `authMiddleware.js` ให้ decode `user_id` จาก JWT payload (`sub`) แทนการ query auth-db

**User Service — พัฒนาใหม่ทั้งหมด**
- สร้าง service ใหม่ทั้งหมดตั้งแต่ `package.json`, `Dockerfile` จนถึง route logic
- เขียน `GET /api/users/me` พร้อม **auto-create profile** ถ้ายังไม่มี record ใน `user_profiles`
- เขียน `PUT /api/users/me` สำหรับแก้ไข `display_name`, `bio`, `avatar_url`
- เขียน `GET /api/users` สำหรับ admin listing พร้อม middleware ตรวจสอบ `role === 'admin'`

**Docker Compose**
- ปรับ `docker-compose.yml` ให้รองรับ 3 databases แยกกัน (auth-db, task-db, user-db) พร้อม volume แยกแต่ละ DB
- กำหนด `depends_on` และ health check ให้แต่ละ service รอ database ของตัวเองก่อน start

**Railway Deployment**
- ตั้งค่า environment variables ทุก service บน Railway dashboard
- ผูก `DATABASE_URL` โดยใช้ `${{service.DATABASE_URL}}` reference
- ยืนยันว่าทุก service start สำเร็จและเชื่อมต่อ database ของตัวเองได้

---

### 3. ปัญหาที่พบและวิธีการแก้ไข

**ปัญหาที่ 1 — user_profiles ไม่มีข้อมูลเมื่อเรียก GET /api/users/me ครั้งแรก**
หลัง register ผ่าน auth-service แล้ว user-service ยังไม่มี record ใน `user_profiles` เพราะแต่ละ service มี database แยกกัน แก้ไขโดยเพิ่ม logic ใน `GET /api/users/me` ให้ `INSERT` profile เริ่มต้นจาก `user_id`, `username`, `email` ที่ decode จาก JWT payload ทันทีถ้าไม่พบ record

**ปัญหาที่ 2 — JWT_SECRET ไม่ตรงกันใน Railway**
ตั้งค่า `JWT_SECRET` แต่ละ service ด้วยค่าต่างกันผ่าน Railway dashboard ทำให้ token จาก auth-service verify ไม่ผ่านใน task-service และ user-service แก้ไขโดยคัดลอกค่าเดียวกันและวางในทุก service บน Railway

**ปัญหาที่ 3 — Docker volume เก็บ schema เก่าของ shared DB**
เมื่อ rebuild แต่ละ container ยังคง volume เดิมที่มี schema ของ Set 1 ทำให้ `init.sql` ใหม่ไม่ถูก execute แก้ไขโดยรัน `docker compose down -v` ก่อนทุกครั้งที่ต้องการ reset schema

**ปัญหาที่ 4 — CORS error เมื่อ frontend บน Railway เรียก service อื่น**
แต่ละ service deploy อยู่คนละ subdomain บน Railway ทำให้ browser บล็อก cross-origin request แก้ไขโดยเพิ่ม `cors()` middleware ใน Express ของทุก service

**ปัญหาที่ 5 — Railway ไม่รัน init.sql อัตโนมัติ**
Railway PostgreSQL ไม่รัน `init.sql` เหมือน Docker Compose แก้ไขโดยเพิ่ม migration logic ใน `db/db.js` ให้ `CREATE TABLE IF NOT EXISTS` ทุกตารางเมื่อ service start ครั้งแรก

---

### 4. สิ่งที่ได้เรียนรู้จากงานนี้

- **Database-per-Service Pattern** — เข้าใจข้อดีของการแยก database ที่แต่ละ service เป็น owner ของข้อมูลตัวเอง และข้อจำกัดคือไม่สามารถใช้ FK constraint ข้าม DB ได้ ต้องแก้ด้วย application-level validation แทน
- **JWT เป็น shared contract** — ในระบบที่ไม่มี centralized auth server แต่ละ service ต้อง verify token ของตัวเอง ทำให้ `JWT_SECRET` กลายเป็นสิ่งที่ต้องจัดการให้ตรงกันทุก service
- **Railway Deployment** — เรียนรู้การ deploy microservice จริงบน cloud รวมถึงการผูก `DATABASE_URL` ด้วย reference variable และการ debug ผ่าน Railway logs
- **Auto-create Pattern** — เรียนรู้ pattern การสร้าง resource อัตโนมัติเมื่อ user เข้าถึงครั้งแรก แทนที่จะบังคับให้ทำ explicit registration ใน service นั้น

---

### 5. แนวทางที่ต้องการพัฒนาต่อในอนาคต

- **API Gateway จริง** — เพิ่ม Nginx หรือ Kong เป็น gateway กลาง แทน Option A ที่ frontend รู้ URL ทุก service
- **Event-driven sync** — ใช้ message queue เช่น RabbitMQ หรือ Redis Pub/Sub เพื่อ sync ข้อมูลระหว่าง database เมื่อมีการ register user ใหม่
- **Centralized Logging** — รวม logs table ของทุก service เข้าใน observability platform เช่น Grafana + Loki
- **CI/CD Pipeline** — ตั้งค่า GitHub Actions ให้ auto deploy ไปยัง Railway เมื่อ push ไปยัง `main` branch
- **Refresh Token** — เพิ่ม refresh token mechanism เพื่อให้ user ไม่ต้อง login ใหม่เมื่อ access token หมดอายุ

---
---

# 👤 นายธวัชชัย สุหงษา — 6743210019-5

## ข้อมูลผู้จัดทำ

| | |
|---|---|
| **ชื่อ-นามสกุล** | นายธวัชชัย สุหงษา |
| **รหัสนักศึกษา** | 6743210019-5 |
| **กลุ่ม** | TEAM8 |
| **เพื่อนร่วมกลุ่ม** | นายภาคิน กันทะวงค์ (6743210062-5) |

---

### 1. ส่วนที่รับผิดชอบ

รับผิดชอบด้าน **Frontend, Documentation และ Quality Assurance** ของ Set 2 ครอบคลุมการปรับ Frontend UI ให้รองรับ Register และ User Profile, ระบบ runtime config injection, README, และการทดสอบทั้ง local และ Railway production

---

### 2. สิ่งที่ได้ลงมือพัฒนาด้วยตนเอง

**Frontend — ปรับจาก Set 1**
- เพิ่ม **Register form** ใน `index.html` เชื่อมกับ `POST /api/auth/register` ของ auth-service
- เพิ่ม **User Profile page** แสดงข้อมูลจาก `GET /api/users/me` และรองรับแก้ไขผ่าน `PUT /api/users/me`
- ปรับ fetch URL ทั้งหมดในไฟล์ frontend ให้อ่านจาก `window.APP_CONFIG` แทนการ hardcode

**Runtime Config Injection**
- เขียน script ใน `Dockerfile` สำหรับ inject environment variables (`AUTH_URL`, `TASK_URL`, `USER_URL`) ลงใน `config.js` ตอน container start
- ทำให้ frontend image ชุดเดียวกันใช้ได้ทั้ง local และ Railway โดยไม่ต้อง rebuild

**ทดสอบ API ทั้ง Local และ Railway**
- ทดสอบ register flow ใหม่ทั้งหมด: `POST /register` → `POST /login` → รับ token → ใช้ token ใน task และ user service
- ทดสอบ `GET /api/users/me` ทั้งกรณีที่มีและไม่มี profile เพื่อยืนยัน auto-create logic
- ทดสอบ `GET /api/users` ด้วย admin token และ member token เพื่อยืนยัน role guard
- ทดสอบ CORS ทุก combination ระหว่าง frontend domain กับ service domain บน Railway
- ทดสอบ Railway deployment จริงและยืนยัน environment variable ทุกตัวทำงานถูกต้อง

**README & Documentation**
- เขียน `README.md` ครอบคลุมทุก section ตาม template ENGSE207 ปรับให้ตรงกับ Set 2
- เขียน `TEAM_SPLIT.md` อธิบาย Work Allocation, Reason for Work Split และ Integration Notes
- จัดทำ screenshots ครอบคลุม flow ใหม่ทั้งหมดของ Set 2

---

### 3. ปัญหาที่พบและวิธีการแก้ไข

**ปัญหาที่ 1 — window.APP_CONFIG ยังไม่ถูก inject เมื่อ fetch รัน**
ตอนแรกเขียน fetch ก่อนที่ `config.js` จะโหลดเสร็จ ทำให้ `window.APP_CONFIG` เป็น `undefined` แก้ไขโดยย้าย script tag ของ `config.js` ไปไว้ก่อน script หลัก และเพิ่ม null check ก่อนอ่าน URL

**ปัญหาที่ 2 — Register สำเร็จแต่ Login ไม่ผ่านทันที**
หลัง register แล้ว login ด้วย email เดิมไม่ผ่าน พบว่าเกิดจาก race condition ระหว่าง INSERT กับ SELECT ของ bcrypt แก้ไขโดยประสานงานกับ Student 1 ให้เพิ่ม `await` ให้ครบใน register handler และทดสอบซ้ำจนผ่าน

**ปัญหาที่ 3 — Railway service URL เปลี่ยนทุกครั้งที่ redeploy**
ตอนแรก hardcode URL ใน test script ทำให้ต้องแก้ทุกครั้งที่ Railway generate URL ใหม่ แก้ไขโดยเปลี่ยนมาอ่านจาก environment variable ใน test script แทน และบันทึก URL สุดท้ายใน README

**ปัญหาที่ 4 — GET /api/users แสดงข้อมูลไม่ครบเมื่อ test ด้วย admin**
admin listing แสดงเฉพาะ user ที่มี profile ใน user-db แต่ไม่แสดง user ที่ยังไม่เคยเรียก `/me` แจ้งปัญหาให้ Student 1 แก้ไขโดยเพิ่ม fallback query จาก JWT claim แทน

---

### 4. สิ่งที่ได้เรียนรู้จากงานนี้

- **Database-per-Service ในทางปฏิบัติ** — เห็นผลจริงว่าการแยก database ทำให้ข้อมูลไม่ sync กันอัตโนมัติ เช่น register ผ่าน auth-service แต่ user-service ยังไม่รู้จัก user นั้น ต้องออกแบบ flow ให้รองรับ
- **Runtime Config Injection** — เรียนรู้ pattern การ inject config ตอน container start แทนการ hardcode ทำให้ image เดียวกัน deploy ได้ทุก environment
- **Railway Platform** — เรียนรู้การ debug production service ผ่าน Railway logs, การจัดการ environment variable และการเชื่อม service กับ managed database
- **Cross-origin Testing** — เรียนรู้วิธี test CORS issue อย่างเป็นระบบ ทั้งการใช้ browser DevTools Network tab และ curl เพื่อแยกแยะว่าปัญหาอยู่ที่ frontend หรือ backend

---

### 5. แนวทางที่ต้องการพัฒนาต่อในอนาคต

- **ปรับปรุง Frontend UX** — เพิ่ม loading state, error message ที่ชัดเจน และ redirect อัตโนมัติหลัง register สำเร็จ
- **Automated E2E Testing** — เขียน test script ที่ทดสอบ flow ทั้งหมดอัตโนมัติตั้งแต่ register จนถึง profile update
- **Admin Dashboard** — พัฒนาหน้า admin ที่แสดง user listing และ task statistics แยกจากหน้าปกติ
- **Swagger/OpenAPI Docs** — เพิ่ม API documentation ในรูปแบบ Swagger เพื่อให้ทดสอบ endpoint ได้สะดวกโดยไม่ต้องเขียน curl
- **Monitor Railway Uptime** — ตั้งค่า uptime monitoring เพื่อให้รู้ทันทีเมื่อ service ล่มบน Railway
