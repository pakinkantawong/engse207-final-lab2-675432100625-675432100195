# TEAM_SPLIT.md

## ข้อมูลกลุ่ม
- กลุ่มที่: 8
- รายวิชา: ENGSE207 Software Architecture

## Team Members

| รหัสนักศึกษา | ชื่อ-นามสกุล |
|---|---|
| 6743210062-5 | นายภาคิน กันทะวงค์ |
| 6743210019-5 | นายธวัชชัย สุหงษา |

---

## Work Allocation

### Student 1: นายภาคิน กันทะวงค์
รับผิดชอบด้าน Backend และ Infrastructure ทั้งหมด ครอบคลุม:

- **Auth Service** — พัฒนา API สำหรับ register และ login รวมถึงการออก JWT Token และจัดการ password hashing
- **JWT Login Flow** — ออกแบบและ implement การ sign/verify Token ผ่าน `jwtUtils.js` ที่ใช้ร่วมกันระหว่าง Auth Service และ Task Service
- **HTTPS Certificate & Nginx** — สร้าง self-signed certificate ด้วย `gen-certs.sh` และตั้งค่า `nginx.conf` ให้รองรับ SSL termination, reverse proxy routing และ rate limiting
- **Task Service** — พัฒนา CRUD API สำหรับจัดการ Task และ implement `authMiddleware.js` เพื่อป้องกัน endpoint ด้วย JWT
- **Log Service** — พัฒนา service สำหรับรวบรวมและ expose log การใช้งาน API ผ่าน `GET /api/logs`
- **Frontend & Docker Compose** — พัฒนา `index.html` (Task Board + JWT Inspector) และ `logs.html` รวมถึงเขียน `docker-compose.yml` เพื่อ orchestrate ทุก container ให้ทำงานร่วมกัน

### Student 2: นายธวัชชัย สุหงษา
รับผิดชอบด้าน Documentation และ Quality Assurance ครอบคลุม:

- **README & Screenshots** — จัดทำ README.md แบบ 2 ภาษา (ไทย/อังกฤษ) พร้อมถ่าย screenshots ครบทั้ง 12 ขั้นตอน ตั้งแต่ docker running จนถึง rate limit
- **Architecture Diagram** — ออกแบบ diagram แสดง request flow, JWT flow และความสัมพันธ์ระหว่าง services และ database

---

## Shared Responsibilities

- ทดสอบ end-to-end ร่วมกัน โดยรัน `docker compose up` แล้วทดสอบทุก endpoint ตั้งแต่ login → รับ token → ใช้ token เรียก task API → ตรวจสอบ log
- ตรวจสอบ edge cases ร่วมกัน เช่น expired token, missing token, invalid credentials และ rate limit exceeded

---

## Reason for Work Split

แบ่งงานตาม **technical responsibility boundary** โดยแยกระหว่างผู้สร้างระบบและผู้ตรวจสอบและเผยแพร่ระบบ

**Student 1** รับผิดชอบทุกส่วนที่ต้องเขียนโค้ดและตั้งค่าระบบ ซึ่งมีความเชื่อมโยงกันสูงมาก เช่น Auth Service ต้องออก JWT ที่ Task Service นำไปตรวจสอบ, Nginx ต้องรู้จัก port ของทุก service, และ Docker Compose ต้องเชื่อมทุกอย่างเข้าด้วยกัน การให้คนเดียวดูแลทั้งหมดช่วยลดปัญหา integration ที่อาจเกิดจากความเข้าใจที่ไม่ตรงกัน

**Student 2** รับผิดชอบงานที่ต้องเข้าใจภาพรวมของระบบทั้งหมด เพื่อสามารถสื่อสารการทำงานของระบบออกมาเป็น documentation และ diagram ที่ถูกต้องและครบถ้วน การที่ Student 2 ทำ README และ diagram ยังช่วยเป็น peer review อีกชั้นหนึ่ง เพราะหากอธิบายการทำงานไม่ได้แสดงว่ายังเข้าใจระบบไม่ครบ

---

## Integration Notes

งานของทั้งสองคนเชื่อมต่อกันใน 2 จุดหลัก:

**จุดที่ 1 — JWT Secret เป็น shared contract ระหว่าง services**

Auth Service และ Task Service ต้องใช้ `JWT_SECRET` ค่าเดียวกัน ซึ่งเก็บไว้ใน `.env` และส่งผ่าน `docker-compose.yml` เป็น environment variable ให้ทั้งสอง container ทำให้ Token ที่ Auth Service ออกสามารถถูก verify โดย Task Service ได้อย่างถูกต้อง

```
Auth Service (sign)                Task Service (verify)
     │                                    │
     └── JWT_SECRET (from .env) ──────────┘
             shared via docker-compose.yml
```

**จุดที่ 2 — Nginx เป็น single entry point ที่เชื่อม frontend กับทุก service**

Frontend ที่ Student 1 พัฒนา (`index.html`, `logs.html`) ส่ง HTTP request ไปยัง path ต่างๆ บน origin เดียวกัน (`https://localhost`) โดย Nginx ทำหน้าที่ route request ไปยัง service ที่ถูกต้องตาม path prefix

```
https://localhost/              → frontend (index.html, logs.html)
https://localhost/api/auth/*    → auth-service:3001
https://localhost/api/tasks/*   → task-service:3002
https://localhost/api/logs/*    → log-service:3003
```

ทำให้ frontend ไม่ต้องรู้ port ของแต่ละ service และยังได้ประโยชน์จาก SSL termination และ rate limiting ของ Nginx ในทุก request โดยอัตโนมัติ

**จุดที่ 3 — Documentation สะท้อนการทำงานจริงของระบบ**

Architecture diagram และ README ที่ Student 2 จัดทำต้องสอดคล้องกับโค้ดและ config จริงที่ Student 1 เขียน ทั้งสองจึงต้องทำงานร่วมกันในขั้นตอน end-to-end testing เพื่อให้แน่ใจว่า screenshots และคำอธิบายใน README ตรงกับพฤติกรรมจริงของระบบ
