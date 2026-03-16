# INDIVIDUAL_REPORT_67543210062-5

---

## ข้อมูลผู้จัดทำ

| | |
|---|---|
| **ชื่อ-นามสกุล** | นายภาคิน กันทะวงค์ |
| **รหัสนักศึกษา** | 67543210062-5 |
| **กลุ่ม** | TEAM8 |
| **เพื่อนร่วมกลุ่ม** | นายธวัชชัย สุหงษา (6743210019-5) |

---

## 1. ส่วนที่รับผิดชอบ

รับผิดชอบด้าน **Backend และ Infrastructure** ทั้งหมดของโปรเจกต์ ครอบคลุม 6 ส่วนหลัก ได้แก่

- **Auth Service** — พัฒนา API สำหรับ register และ login รวมถึงการออก JWT Token และจัดการ password hashing ด้วย bcrypt
- **JWT Login Flow** — ออกแบบและ implement การ sign/verify Token ผ่าน `jwtUtils.js` ที่ใช้ร่วมกันระหว่าง Auth Service และ Task Service
- **HTTPS Certificate & Nginx** — สร้าง self-signed certificate ด้วย `gen-certs.sh` และตั้งค่า `nginx.conf` ให้รองรับ SSL termination, reverse proxy routing และ rate limiting
- **Task Service** — พัฒนา CRUD API สำหรับจัดการ Task และ implement `authMiddleware.js` เพื่อป้องกัน endpoint ด้วย JWT
- **Log Service** — พัฒนา service สำหรับรวบรวมและ expose log การใช้งาน API ผ่าน `GET /api/logs`
- **Frontend & Docker Compose** — พัฒนา `index.html` (Task Board + JWT Inspector) และ `logs.html` รวมถึงเขียน `docker-compose.yml` เพื่อ orchestrate ทุก container ให้ทำงานร่วมกัน

---

## 2. สิ่งที่ได้ลงมือพัฒนาด้วยตนเอง

### Auth Service (`auth-service/src/`)
- เขียน `routes/auth.js` สำหรับ `POST /api/auth/register` และ `POST /api/auth/login`
- เขียน `middleware/jwtUtils.js` สำหรับ sign และ verify JWT Token โดยอ่าน secret จาก environment variable
- ตั้งค่าการเชื่อมต่อ PostgreSQL ผ่าน `db/db.js`
- Implement password hashing ด้วย bcrypt ก่อน save และใช้ `bcrypt.compare()` ตอน login

### Task Service (`task-service/src/`)
- เขียน `routes/tasks.js` สำหรับ CRUD endpoints ครบทั้ง `GET`, `POST`, `PUT`, `DELETE /api/tasks`
- เขียน `middleware/authMiddleware.js` ตรวจสอบ JWT Token ทุก request ก่อนอนุญาตให้เข้าถึง resource
- แชร์ `jwtUtils.js` ให้ verify ด้วย JWT_SECRET เดียวกันกับ Auth Service

### Log Service (`log-service/src/`)
- เขียน `index.js` สำหรับรวบรวม API activity log และ expose ผ่าน `GET /api/logs`

### Nginx & HTTPS (`nginx/`)
- เขียน `nginx.conf` ตั้งค่า reverse proxy routing ตาม path prefix
  - `/api/auth/*` → auth-service:3001
  - `/api/tasks/*` → task-service:3002
  - `/api/logs/*` → log-service:3003
- ตั้งค่า SSL termination รับ HTTPS :443 แล้วส่งต่อเป็น HTTP ภายใน container
- เพิ่ม rate limiting ป้องกัน request ที่มากเกินกำหนด

### Frontend (`frontend/`)
- พัฒนา `index.html` ครอบคลุม Login form, Task CRUD และ JWT Inspector
- พัฒนา `logs.html` ดึงข้อมูลจาก `/api/logs` แสดงเป็น Log Dashboard

### Docker Compose & Infrastructure
- เขียน `docker-compose.yml` กำหนด network, environment variables และ volume ให้ทุก container ทำงานร่วมกัน
- เขียน `scripts/gen-certs.sh` สร้าง self-signed certificate อัตโนมัติ
- เขียน `db/init.sql` สร้าง schema และ seed users เริ่มต้น

---

## 3. ปัญหาที่พบและวิธีการแก้ไข

**ปัญหาที่ 1 — Seed users login ไม่ได้**

Password ใน `db/init.sql` ถูก insert เป็น plain text แต่ Auth Service ใช้ `bcrypt.compare()` ในการตรวจสอบ ทำให้ login ด้วย seed users ไม่ผ่านทุกครั้ง แก้ไขโดยสร้าง bcrypt hash ด้วย `bcrypt.hashSync()` แล้วนำ hash ที่ได้ไปแทนที่ค่าเดิมใน `db/init.sql` จากนั้น rebuild container ใหม่

**ปัญหาที่ 2 — JWT Secret ไม่ตรงกันระหว่าง Auth Service และ Task Service**

แต่ละ service ใช้ `JWT_SECRET` คนละค่าในช่วงแรก ทำให้ Token ที่ออกโดย Auth Service ถูก verify ไม่ผ่านใน Task Service แก้ไขโดยกำหนด `JWT_SECRET` เป็น environment variable เดียวใน `docker-compose.yml` และให้ทั้งสอง service อ่านจากตัวแปรเดียวกัน

**ปัญหาที่ 3 — Container เริ่มก่อน PostgreSQL พร้อม**

Auth Service และ Task Service พยายามเชื่อมต่อ database ทันทีที่ start แต่ PostgreSQL ยังไม่พร้อม ทำให้ connection ล้มเหลว แก้ไขโดยเพิ่ม `depends_on` ใน `docker-compose.yml` และเพิ่ม retry logic ใน `db/db.js` เพื่อรอจนกว่า database จะพร้อมรับ connection

**ปัญหาที่ 4 — CORS error ระหว่าง Frontend กับ API**

Frontend เรียก API แล้วเกิด CORS error เนื่องจาก service ภายในยังไม่ได้ตั้งค่า CORS header แก้ไขโดยเพิ่ม `cors()` middleware ใน Express ของแต่ละ service

---

## 4. สิ่งที่ได้เรียนรู้จากงานนี้

- **Microservices Architecture** — เข้าใจการแบ่งระบบออกเป็น service ย่อยที่แต่ละตัวมีหน้าที่ชัดเจน สื่อสารกันผ่าน HTTP API และ deploy แยกกันได้อิสระ
- **JWT Authentication Flow** — เข้าใจกระบวนการครบ ตั้งแต่การ sign token ด้วย secret, การแนบ token ใน Authorization header และการ verify token ก่อนอนุญาตให้เข้าถึง resource
- **Nginx as API Gateway** — เข้าใจการใช้ Nginx เป็น reverse proxy กระจาย request ไปยัง service ต่างๆ ตาม path พร้อม SSL termination และ rate limiting ในที่เดียว
- **Docker Compose Networking** — เข้าใจการที่ container สื่อสารกันผ่านชื่อ service แทน IP address และการใช้ environment variable แชร์ค่าระหว่าง service
- **bcrypt Password Hashing** — เข้าใจความสำคัญของการ hash password ก่อน save และข้อผิดพลาดที่เกิดจากการเก็บ plain text ลงฐานข้อมูล

---

## 5. แนวทางที่ต้องการพัฒนาต่อใน Set 2

- **Role-based Access Control (RBAC)** — เพิ่มระบบสิทธิ์ให้ user แต่ละคนมี role ต่างกัน เช่น admin สามารถดู task ของทุก user ได้ ส่วน user ทั่วไปเห็นได้เฉพาะ task ของตัวเอง
- **Refresh Token Mechanism** — เพิ่ม refresh token เพื่อให้ user ไม่ต้อง login ใหม่เมื่อ access token หมดอายุ แทนที่จะใช้ token อายุยาว
- **Centralized Logging** — ปรับปรุง Log Service ให้รับ log จากทุก service แบบ real-time แทนการเก็บแยกกัน เช่น ใช้ message queue อย่าง Redis หรือ RabbitMQ
- **Health Check Endpoints** — เพิ่ม `/health` endpoint ในทุก service เพื่อให้ Nginx และ monitoring system ตรวจสอบสถานะได้
- **Deploy บน Cloud** — นำระบบไป deploy บน cloud platform เช่น AWS หรือ GCP โดยเปลี่ยนจาก self-signed certificate เป็น Let's Encrypt
