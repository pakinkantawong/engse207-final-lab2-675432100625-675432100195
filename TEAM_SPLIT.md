# TEAM_SPLIT — Final Lab Set 2

## Team Members

| รหัสนักศึกษา | ชื่อ-นามสกุล |
|---|---|
| 6743210062-5 | นายภาคิน กันทะวงค์ |
| 6743210019-5 | นายธวัชชัย สุหงษา |

---

## Work Allocation

### 👨‍💻 Student 1: นายภาคิน กันทะวงค์
รับผิดชอบด้าน **Backend Development และ Infrastructure** ครอบคลุม:

- **Auth Service** — ขยายจาก Set 1 เพิ่ม `POST /api/auth/register` และแยก database ออกเป็น auth-db โดยเฉพาะ
- **Task Service** — migrate จาก shared DB ไปเป็น task-db แยกต่างหาก ปรับ connection string ให้รองรับ `DATABASE_URL`
- **User Service (ใหม่)** — พัฒนา service ใหม่ทั้งหมด ครอบคลุม `GET/PUT /api/users/me` และ `GET /api/users` (admin only) พร้อม auto-create profile logic
- **Docker Compose** — ปรับ `docker-compose.yml` ให้รองรับ 3 databases แยกกัน (auth-db, task-db, user-db)
- **Railway Deploy** — ตั้งค่า environment variables, DATABASE_URL reference และ deploy ทุก service บน Railway

### 👨‍💻 Student 2: นายธวัชชัย สุหงษา
รับผิดชอบด้าน **Frontend, Documentation และ Quality Assurance** ครอบคลุม:

- **Frontend** — ปรับ UI ให้รองรับ Register form และ User Profile page ที่เพิ่มมาใน Set 2 รวมถึงเพิ่มการอ่าน config จาก `window.APP_CONFIG` แทน hardcode URL
- **config.js runtime injection** — เขียน script ที่ inject `AUTH_URL`, `TASK_URL`, `USER_URL` จาก environment variable ตอน container start
- **README & Documentation** — เขียน README.md ครอบคลุม architecture, local setup, Railway deployment และ API summary ของ Set 2
- **Testing & Screenshots** — ทดสอบ API ครบทุก endpoint ทั้ง local และ Railway production พร้อมจัดเตรียม screenshots สำหรับส่งงาน

---

## Shared Responsibilities

- ทดสอบ end-to-end flow ร่วมกัน: register → login → สร้าง task → ดู profile → admin listing
- ตรวจสอบ JWT flow ข้ามทุก service ว่าใช้ `JWT_SECRET` เดียวกันและ verify ผ่าน
- ทดสอบ Railway deployment จริงและยืนยันว่าแต่ละ service เชื่อมต่อ database ของตัวเองได้ถูกต้อง
- ตรวจสอบ CORS configuration ให้ frontend สามารถเรียกทุก service ได้จาก Railway domain

---

## Reason for Work Split

แบ่งงานต่อเนื่องจาก Set 1 โดยยังใช้หลัก **technical responsibility boundary** เหมือนเดิม

**Student 1** รับผิดชอบทุกส่วนที่เกี่ยวกับการ implement และ infrastructure เพราะงาน backend ทุกชิ้นมี dependency ต่อกัน โดยเฉพาะการแยก database ซึ่งต้องปรับทั้ง schema, connection string และ Docker Compose พร้อมกัน การให้คนเดียวดูแลทำให้มั่นใจได้ว่า `user_id` type ตรงกันทุก database และ JWT flow ไม่สะดุด

**Student 2** รับผิดชอบ frontend และ documentation ซึ่งต้องเข้าใจ API contract ของทุก service เพื่อเขียน UI และ README ได้ถูกต้อง นอกจากนี้การ test จาก perspective ของ client ช่วย catch ปัญหา CORS และ URL configuration ที่ backend อาจมองข้ามได้

---

## Integration Notes

**จุดที่ 1 — JWT Secret เป็น shared contract ทั้ง 3 services**

ทุก service ต้องใช้ `JWT_SECRET` ค่าเดียวกัน ทั้งใน local (`.env`) และ Railway (environment variable) เพื่อให้ token ที่ออกโดย Auth Service ถูก verify ได้ใน Task Service และ User Service

```
Auth Service (sign)    Task Service (verify)    User Service (verify)
      │                       │                        │
      └────── JWT_SECRET ──────┴────────────────────────┘
                    shared across all services
```

**จุดที่ 2 — user_id เป็น foreign key แบบ soft reference ข้าม database**

เนื่องจากแต่ละ service มี database แยกกัน จึงไม่สามารถใช้ FK constraint ข้าม DB ได้ แทนที่ด้วยการให้ทุก service อ่าน `user_id` จาก JWT payload (`sub`) และ validate ผ่าน token แทน

```
JWT payload: { sub: user.id, role: "member" }
      │
      ├──► task-service: tasks.user_id = req.user.id
      └──► user-service: user_profiles.user_id = req.user.id
```

**จุดที่ 3 — Frontend อ่าน URL จาก APP_CONFIG แทน hardcode**

Frontend ไม่ hardcode URL ของแต่ละ service ใน source code แต่อ่านจาก `window.APP_CONFIG` ที่ inject ตอน container start ทำให้ใช้ code ชุดเดียวกันได้ทั้ง local และ Railway โดยไม่ต้อง rebuild image

```
Local:    AUTH_URL=http://localhost:3001
Railway:  AUTH_URL=https://auth-service-production.up.railway.app
          → inject → window.APP_CONFIG.AUTH_URL
```
