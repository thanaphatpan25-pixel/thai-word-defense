# Design: ซอมบี้ศัพท์ไทย — ป้อมพิทักษ์ภาษา

## Intent
เกมเว็บ Tower Defense + Quiz สำหรับนักเรียน ป.4–ป.5 ใช้การตอบคำถามภาษาไทยเพื่อรับเหรียญ ทำลายโล่ซอมบี้ และปกป้องห้องสมุดโรงเรียน เล่นซ้ำได้แบบ endless/roguelite บนคอมพิวเตอร์ แท็บเล็ต และมือถือ

## Goals
- เล่นเกมหลักได้ตั้งแต่เปิดเว็บ: วางป้อม 6 ประเภท, ซอมบี้ 7 ประเภท, เวฟไม่จำกัด, บอสทุก 5 เวฟ, การ์ดอัปเกรดหลังจบเวฟ
- แยกคลังคำถาม JSON 10 หมวด หมวดละอย่างน้อย 30 ข้อ มี difficulty 1–3, type, answer, explanation และ tags
- มี Endless, Daily Challenge, Practice, Teacher Mode, สถิติ, คำที่ควรทบทวน, achievements และ local save
- รองรับ keyboard, pointer, touch, reduced motion, ปิดเสียง และโหมดผ่อนเวลา
- สร้าง pixel art จากโค้ด ไม่มี asset ภายนอกที่มีสิทธิ์ไม่ชัดเจน
- build แบบ static และ deploy ผ่าน GitHub Pages Actions

## Non-goals
- ไม่ทำ multiplayer หรือ backend leaderboard ในรอบนี้
- ไม่รับรองการส่งคะแนนไป Google Sheets; ใช้ localStorage และส่งออกเป็นข้อความก่อน
- ไม่ใช้รูป/เสียงที่มีลิขสิทธิ์ภายนอก

## Approaches considered
1. Phaser 3 + TypeScript + Vite + DOM UI (เลือก): ตรงตาม stack ที่ผู้ใช้ระบุ, canvas เหมาะกับสนาม/animation และ DOM เหมาะกับภาษาไทย/จอสัมผัส
2. Phaser 4: เป็นสายหลักใหม่กว่า แต่ขัดกับข้อกำหนด Phaser 3 และมี migration surface ต่างกัน
3. HTML Canvas ล้วน: เบากว่าแต่ต้องเขียนระบบ animation/scene/input เองมากขึ้น จึงไม่คุ้มสำหรับ Tower Defense

## Architecture decisions
- Phaser 3.90.0; Vite; TypeScript strict mode; static site.
- Simulation และ economy/question/wave/save rules อยู่ใน `src/systems`; Phaser scenes เป็น renderer/controller บาง ๆ.
- DOM overlay เป็น UI หลัก; Phaser canvas วาด map, towers, zombies, projectiles และ effects.
- Procedural pixel matrix assets สร้าง texture ตอน preload; ไม่ต้อง download asset ภายนอก.
- Grid 13×8 มีเส้นทางคดเคี้ยวที่ห้ามวางป้อม; วางป้อมในช่องว่างและอัปเกรดได้ 3 ระดับ.
- localStorage บันทึกสถิติ, best score, stars, unlocked skins, category mastery, wrong-answer counts และ achievements.
- คำถามเป็น JSON แยกหมวด; types รองรับ multiple-choice, fill-blank, true-false, matching และ order.
- Daily seed เป็นวันที่ท้องถิ่น (Asia/Bangkok) และใช้ seeded RNG เพื่อให้โจทย์/รางวัลคงที่ในวันเดียวกัน.
- ค่าความยาก/เศรษฐกิจ/HP/range/fire rate อยู่ใน `src/data/balance.ts`.

## Core loop
เริ่มโหมด → ซอมบี้เกิดและเดินตามเส้นทาง → ตอบคำถามเพื่อรับเหรียญ/ทำลายโล่ → ใช้เหรียญวางหรืออัปเกรดป้อม → เคลียร์เวฟ → เลือก 1 ใน 3 การ์ด → เล่นต่อจนฐาน HP หมด → สรุปผลและคำที่ควรฝึก

## Teacher and learning UX
Teacher Mode ตั้งหมวด/ระดับ/เวลา/ความเร็วเกม และส่งออกผลเป็นข้อความ; Practice ไม่มีศัตรูและฝึกคำที่ตอบผิดก่อน; หลังตอบทุกครั้งแสดงคำอธิบาย. ข้อมูลที่ยังต้องให้ครูตรวจสอบมี TODO tag อย่างชัดเจน.

## Acceptance criteria
- `npm run build`, `npm run typecheck`, `npm test`, `npm run lint` ผ่าน
- มีอย่างน้อย 328 ข้อ และแต่ละหมวดมีอย่างน้อย 30 ข้อ ระดับ 1–3
- เปิดหน้าเว็บแล้วเริ่มเกมได้; ทดสอบวางป้อม, ตอบคำถาม, จบเวฟ, เลือกอัปเกรด, แพ้, reload แล้วข้อมูลยังอยู่
- README อธิบาย run, controls, เพิ่มคำถาม, deploy และ license/credits
