# INDIVIDUAL_REPORT_6743210019-5
 
---
 
## ข้อมูลผู้จัดทำ
 
| | |
|---|---|
| **ชื่อ-นามสกุล** | นายธวัชชัย สุหงษา |
| **รหัสนักศึกษา** | 6743210019-5 |
| **กลุ่ม** | TEAM8 |
| **เพื่อนร่วมกลุ่ม** | นายภาคิน กันทะวงค์ (6743210062-5) |
 
---
 
## 1. ส่วนที่รับผิดชอบ
 
รับผิดชอบด้าน **Documentation และ Quality Assurance** ของโปรเจกต์ ครอบคลุม 2 ส่วนหลัก ได้แก่
 
- **README & Screenshots** — จัดทำ `README.md` แบบ 2 ภาษา (ไทย/อังกฤษ) พร้อมถ่าย screenshots ครบทั้ง 12 ขั้นตอน ตั้งแต่ docker running จนถึง rate limit
- **Architecture Diagram** — ออกแบบ diagram แสดง request flow, JWT flow และความสัมพันธ์ระหว่าง services และ database ทั้งในรูปแบบ ASCII สำหรับ README และไฟล์ `.drawio`
 
นอกจากนี้ยังร่วมกับ Student 1 ในส่วน **Shared Responsibilities** ได้แก่ การทดสอบ end-to-end และการตรวจสอบ edge cases ร่วมกัน
 
---
 
## 2. สิ่งที่ได้ลงมือพัฒนาด้วยตนเอง
 
### ทดสอบ API ครอบคลุมทุก Endpoint
- ทดสอบ `POST /api/auth/login` และ `POST /api/auth/register` ด้วย curl และ Postman ทั้ง success case และ error case เช่น wrong password, missing fields
- ทดสอบ Task API ครบทุก method (`GET`, `POST`, `PUT`, `DELETE /api/tasks`) โดยแนบ JWT Token ที่ถูกต้อง
- ทดสอบการส่ง request โดยไม่มี JWT Token เพื่อยืนยันว่าระบบส่ง `401 Unauthorized` กลับอย่างถูกต้อง
- ทดสอบ rate limiting โดยส่ง request ซ้ำในเวลาสั้น เพื่อยืนยันพฤติกรรมของ Nginx
- ร่วมทดสอบ end-to-end flow กับ Student 1 ตั้งแต่ login → รับ token → ใช้ token เรียก task API → ตรวจสอบ log
- ตรวจสอบ edge cases ร่วมกัน เช่น expired token, missing token, invalid credentials และ rate limit exceeded
 
### ตรวจสอบ HTTPS
- เปิด browser ไปที่ `https://localhost` และยืนยันว่า self-signed certificate ทำงานได้
- บันทึกขั้นตอนการ bypass คำเตือน SSL ไว้ใน README เพื่อให้ผู้อื่นทราบ
 
### จัดเตรียม Screenshots (12 ภาพ)
- วางแผนลำดับการทดสอบให้สอดคล้องกับ 12 screenshots ที่กำหนด
- ถ่ายและตั้งชื่อไฟล์ให้ตรงกับที่ระบุใน README ทุกภาพ ตั้งแต่ `01_docker_running.png` ถึง `12_frontend_screenshot.png`
 
### จัดทำ README.md
- เขียน `README.md` แบบ 2 ภาษา (ไทย/อังกฤษ) ครอบคลุมทุก section ดังนี้
  - Architecture (ASCII diagram)
  - Project Structure (file tree)
  - Tech Stack
  - Setup & Installation (ขั้นตอนทีละขั้น)
  - API Endpoints พร้อม curl examples
  - Authentication Flow
  - Frontend usage
  - Screenshots table ครบ 12 ภาพ
  - Environment Variables
 
### จัดทำ TEAM8.md และ Architecture Diagram
- เขียน `TEAM8.md` อธิบาย Work Allocation, Reason for Work Split และ Integration Notes
- ออกแบบ Architecture Diagram แสดง routing path, JWT flow และ database connection ในรูปแบบ `.drawio` สำหรับ draw.io
 
---
 
## 3. ปัญหาที่พบและวิธีการแก้ไข
 
**ปัญหาที่ 1 — Login ด้วย seed users ไม่ได้ระหว่างทดสอบ**
 
ระหว่างทดสอบพบว่า login ด้วย username และ password จาก `db/init.sql` ไม่ผ่านทุกครั้ง ทั้งที่ข้อมูลดูถูกต้อง ประสานงานกับ Student 1 แล้วพบสาเหตุว่า password ใน init.sql เป็น plain text แต่ระบบใช้ bcrypt ตรวจสอบ แก้ไขโดยให้ Student 1 สร้าง bcrypt hash ใหม่และอัปเดตใน init.sql จากนั้นทดสอบใหม่จนผ่าน
 
**ปัญหาที่ 2 — Browser แจ้งเตือน SSL Certificate ทุกครั้ง**
 
เนื่องจากใช้ self-signed certificate browser แจ้งเตือน "Your connection is not private" ทุกครั้งที่เปิด แก้ไขโดยคลิก Advanced → Proceed to localhost และเพิ่มขั้นตอนนี้ไว้ใน README ส่วน Notes เพื่อให้ผู้อ่านทราบว่าเป็นพฤติกรรมปกติสำหรับ development environment
 
**ปัญหาที่ 3 — Screenshots ถ่ายไม่ครบและลำดับไม่ตรง**
 
ช่วงแรกถ่าย screenshots ไม่ครบและลำดับไม่ตรงกับที่กำหนด แก้ไขโดยวางแผนลำดับการทดสอบใหม่ให้ครบทั้ง 12 ภาพ แล้วถ่ายใหม่ทั้งหมดพร้อมตรวจสอบชื่อไฟล์ให้ตรงกับที่ระบุใน README ก่อน submit
 
**ปัญหาที่ 4 — Architecture Diagram แสดง routing ไม่ชัดเจน**
 
Diagram เวอร์ชันแรกไม่ได้แสดง path prefix ของแต่ละ route อย่างชัดเจน ทำให้อ่านแล้วไม่เข้าใจว่า request แต่ละประเภทไปที่ service ใด แก้ไขโดยเพิ่ม label `/api/auth`, `/api/tasks`, `/api/logs` บนเส้นลูกศรจาก Nginx และเปลี่ยนสีลูกศรให้แตกต่างกันแต่ละ service
 
---
 
## 4. สิ่งที่ได้เรียนรู้จากงานนี้
 
- **Microservices Architecture** — เข้าใจการที่ระบบหนึ่งแบ่งออกเป็นหลาย service ที่ทำงานอิสระ และเห็นภาพชัดเจนว่า request เดินทางจาก browser ผ่าน Nginx ไปยัง service ต่างๆ อย่างไร
- **JWT Authentication** — เข้าใจ flow ตั้งแต่การ login รับ token จนถึงการนำ token ไปใช้ใน Authorization header และเหตุใด token จึงหมดอายุและต้องขอใหม่
- **Nginx Routing** — เข้าใจว่า path prefix เช่น `/api/auth` และ `/api/tasks` เป็นตัวกำหนดว่า request จะถูกส่งไปยัง service ใด ทำให้ frontend ใช้ origin เดียวโดยไม่ต้องรู้ port ของแต่ละ service
- **Docker และ Container** — เรียนรู้การใช้ `docker compose ps` และ `docker compose logs` ตรวจสอบสถานะและ error ของแต่ละ container ระหว่างการทดสอบ
- **API Testing อย่างเป็นระบบ** — ฝึกการทดสอบ API ด้วย curl ทั้ง happy path และ error case รวมถึงการทดสอบ edge cases เช่น missing token, expired token และ rate limit
 
---
 
## 5. แนวทางที่ต้องการพัฒนาต่อใน Set 2
 
- **เพิ่ม Register API ใน Frontend** — ปัจจุบัน `index.html` รองรับแค่ Login หากเพิ่มหน้า Register จะทำให้ทดสอบการสมัครสมาชิกใหม่ผ่าน UI ได้โดยไม่ต้องใช้ curl
- **ปรับปรุง Log Dashboard** — เพิ่มการกรอง log ตาม service หรือ time range และทำให้ `logs.html` รีเฟรชข้อมูลแบบ real-time แทนการโหลดครั้งเดียว
- **เพิ่ม Automated Testing** — เขียน test script สำหรับทดสอบ API ทุก endpoint อัตโนมัติ เพื่อลดเวลาที่ต้องทดสอบด้วยมือทุกครั้งที่มีการเปลี่ยนแปลงโค้ด
- **ปรับปรุง Documentation** — เพิ่ม API documentation ในรูปแบบ Swagger/OpenAPI เพื่อให้ผู้อื่นทดสอบ API ได้สะดวกขึ้นโดยไม่ต้องเขียน curl เอง
- **Deploy บน Cloud** — ศึกษาการนำระบบไป deploy บน cloud platform เพื่อให้เข้าถึงได้จากภายนอก และเปลี่ยนจาก self-signed certificate เป็น Let's Encrypt
