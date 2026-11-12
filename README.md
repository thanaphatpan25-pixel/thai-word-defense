# ซอมบี้ศัพท์ไทย: ป้อมพิทักษ์ภาษา

**Zombie Word Defense: School Last Stand** เป็นเกมเว็บ Tower Defense + Quiz สำหรับนักเรียนชั้นประถมศึกษาปีที่ 4–5 ผู้เล่นตอบคำถามภาษาไทยเพื่อรับเหรียญ ทำลายโล่ซอมบี้ และสร้างป้อมป้องกันห้องสมุดโรงเรียน เล่นได้บนคอมพิวเตอร์ แท็บเล็ต และมือถือ

## คุณสมบัติ

- โหมด Endless เล่นต่อเนื่อง ความยากเพิ่มตามเวฟ และบอสทุก 5 เวฟ
- Daily Challenge ใช้ seed ตามวันที่ประเทศไทย (Asia/Bangkok)
- Practice Mode ไม่มีแรงกดดันจากซอมบี้ และดึงข้อที่เคยตอบผิดกลับมาฝึกก่อน
- Teacher Mode ตั้งเวลา/โหมดเพิ่มเวลาคิด และส่งออกผลเป็นข้อความหรือพิมพ์/บันทึก PDF
- คลังคำถาม JSON 10 หมวด หมวดละ 30 ข้อ รวม 328 ข้อ ระดับความยาก 1–3
- คำถามมี 5 รูปแบบ: เลือกตอบ, เติมคำ, ถูก/ผิด, จับคู่ และเรียงประโยคด้วยการแตะ
- ป้อม 6 แบบ อัปเกรดได้สูงสุดระดับ 3; ซอมบี้ 7 แบบ และบอส
- Combo, เหรียญ, การ์ดอัปเกรด 1 ใน 3 หลังจบเวฟ, ภารกิจประจำวัน, ดาว, achievements และสกิน
- บันทึกคะแนนสูงสุด ความคืบหน้า สถิติรายหมวด และข้อที่ตอบผิดใน `localStorage`; ปลดล็อกและเลือกสกิน Classic/Mint/Sunset ได้จากดาวสะสม
- โหมดครูส่งออกผลเป็นข้อความ ภาพสรุป PNG หรือพิมพ์/บันทึก PDF ได้
- สกิน Classic ใช้ได้ทันที; สกิน Mint ใช้ 10 ดาว และ Sunset ใช้ 25 ดาวเพื่อปลดล็อก
- ภาพเกมใช้ CraftPix Sprite Atlas สำหรับป้อม 6 แบบและซอมบี้ 7 บทบาท พร้อมแอนิเมชัน; ฉากสนามประกอบจาก Fields Tileset และมีภาพห้องสมุดเฉพาะเกม
- รองรับเมาส์, touch, ปุ่มเลข 1–4, reduced motion และหน้าจอขนาดเล็ก

## เทคโนโลยี

- Phaser 3.90.0 (ล็อกใช้สาย Phaser 3 ตามข้อกำหนดโปรเจกต์)
- TypeScript strict mode
- Vite 8
- HTML/CSS สำหรับ HUD, เมนู, คำถาม และหน้าต่างครู
- Node.js 22+

> หมายเหตุ: Phaser 4 เป็นสายหลักที่ใหม่กว่า แต่โปรเจกต์นี้ล็อก Phaser 3.90.0 เพื่อให้ตรงกับข้อกำหนด Phaser 3 ของงานนี้

## ภาพและแอนิเมชัน

- `public/assets/art/game-atlas.webp` + `game-atlas.json` รวมเฟรมป้อมและซอมบี้ 188 เฟรม
- ป้อมแสดงสูงประมาณ 64px; ซอมบี้แต่ละประเภทแสดงสูงประมาณ 51–64px พร้อมป้ายคำศัพท์ 12px
- `public/assets/art/school-library.webp` เป็นแลนด์มาร์กห้องสมุดขนาดแสดงผลประมาณ 110×110px พร้อมพื้นที่ 2×2 ช่องที่สงวนไว้ไม่ให้วางป้อม
- `src/assets/renderTuning.ts` ควบคุมสเกลภาพทั้งหมดไว้จุดเดียว และ `src/assets/gameArt.ts` จัดการแอนิเมชัน
- ฉากสนามคงขนาด 754×464 และเส้นทางเดิม เพื่อไม่กระทบตำแหน่งซอมบี้และระบบวางป้อม
- แหล่งที่มาและข้อกำหนดการใช้ดูที่ [CREDITS.md](CREDITS.md)

## เริ่มเล่นในเครื่อง

1. ติดตั้ง Node.js 22 หรือใหม่กว่า
2. แตกไฟล์โปรเจกต์ แล้วเปิด terminal ที่โฟลเดอร์ `thai-word-defense`
3. ติดตั้ง dependencies และเริ่มเซิร์ฟเวอร์

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง (โดยปกติ `http://localhost:5173`) จากนั้นเลือกโหมดและกดเริ่มเกม

### คำสั่งที่ใช้บ่อย

```bash
npm run dev                 # เปิดเซิร์ฟเวอร์พัฒนา
npm run typecheck           # ตรวจ TypeScript strict mode
npm test                    # รันทดสอบระบบเกม
npm run validate:questions  # ตรวจจำนวน/รูปแบบ/เฉลยในคลังคำถาม
npm run lint                # ตรวจโค้ดด้วย ESLint
npm run build               # สร้างไฟล์สำหรับเผยแพร่ใน dist/
npm run preview             # ดู build ที่สร้างแล้ว
```

## วิธีเล่น

1. เลือกโหมด Endless, Daily Challenge หรือ Practice
2. เลือกหมวดภาษาไทยและระดับความยาก หรือเลือกผสมทุกหมวด
3. ตอบคำถามให้ถูกเพื่อรับเหรียญและลดโล่ของซอมบี้
4. เลือกป้อมจากแผงด้านขวา แล้วแตะ/คลิกช่องว่างบนตารางเพื่อวาง
5. แตะป้อมที่วางแล้วเพื่อเลือก จากนั้นกดอัปเกรด (สูงสุด Lv.3)
6. เมื่อผ่านเวฟ เลือกการ์ดอัปเกรด 1 ใบจาก 3 ใบ
7. ป้องกันฐานให้ได้นานที่สุด หาก HP ฐานหมด เกมจะแสดงคะแนน เวฟ ความแม่นยำ และคำที่ควรทบทวน

**คีย์บอร์ด:** กด `1`, `2`, `3`, `4` เพื่อเลือกคำตอบตัวเลือกที่ตรงกัน

**มือถือ/แท็บเล็ต:** แตะตัวเลือกคำตอบ, เลือกป้อม และแตะช่องว่างเพื่อวางได้โดยตรง

## วิธีเพิ่มหรือแก้ไขโจทย์

แก้ไขไฟล์ JSON ใน `src/data/questions/` โดยไม่ต้องแก้ระบบเกม ตัวอย่าง:

```json
{
  "id": "spelling-031",
  "category": "spelling",
  "difficulty": 2,
  "type": "multiple-choice",
  "question": "คำใดสะกดถูกต้อง",
  "choices": ["อนุญาต", "อนุญาติ", "อนุญาด", "อนุญาตร์"],
  "answer": "อนุญาต",
  "explanation": "อนุญาต ไม่มีสระอิท้ายคำ",
  "tags": ["spelling", "ป4", "ป5"]
}
```

ข้อกำหนดข้อมูล:

- `id` ต้องไม่ซ้ำกันทั้งคลัง
- `category` ต้องเป็นหนึ่งใน 10 หมวดที่ประกาศใน `src/data/questionTypes.ts`
- `difficulty` เป็น 1, 2 หรือ 3
- `type` เป็น `multiple-choice`, `fill-blank`, `true-false`, `matching` หรือ `order`
- `choices` ต้องมีอย่างน้อย 2 ตัวเลือก
- คำตอบของโจทย์ทั่วไปต้องตรงกับข้อความใน `choices`
- สำหรับ `order` ให้แยกคำตอบด้วย `|` เช่น `เด็ก|อ่าน|หนังสือ` และให้แต่ละคำอยู่ใน `choices`
- ทุกข้อควรมี `explanation` สั้น ๆ อธิบายหลักภาษา ไม่ใช่เพียงบอกว่าถูกหรือผิด
- เมื่อมีข้อที่ยังไม่แน่ใจ ให้เพิ่ม `todo` เช่น `TODO: ครูภาษาไทยตรวจทานก่อนนำไปใช้จริง`

ตรวจคลังคำถามหลังแก้ไข:

```bash
npm run validate:questions
```

ไฟล์ตัวช่วยสร้างคลัง 328 ข้อเริ่มต้นอยู่ที่ `scripts/generate-question-banks.mjs` หากต้องการสร้างไฟล์ JSON ใหม่ทั้งหมดให้รัน:

```bash
node scripts/generate-question-banks.mjs
```

## โครงสร้างโปรเจกต์

```text
thai-word-defense/
├── .github/workflows/deploy.yml
├── docs/
│   ├── QUESTION_AUTHORING.md
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── public/assets/{audio,fonts,images}/
├── scripts/
│   ├── generate-question-banks.mjs
│   ├── run-tests.cjs
│   └── validate-question-banks.mjs
├── src/
│   ├── data/
│   │   ├── questions/*.json
│   │   ├── balance.ts
│   │   ├── cards.ts
│   │   ├── questionBank.ts
│   │   ├── questionTypes.ts
│   │   ├── towers.ts
│   │   └── zombies.ts
│   ├── entities/{Boss,Projectile,Tower,Zombie}.ts
│   ├── scenes/{Boot,Preload,Menu,Game,UIScene,GameOver,Settings}Scene.ts
│   ├── systems/{AudioManager,DailyChallenge,EconomySystem,GameSimulation,GridSystem,ObjectPool,QuestionManager,SaveSystem,WaveManager}.ts
│   ├── ui/GameUI.ts
│   ├── utils/{PixelArtFactory,seededRandom}.ts
│   ├── main.ts
│   └── style.css
├── tests/*.test.ts
├── CREDITS.md
├── LICENSE
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Deploy ไป GitHub Pages

โปรเจกต์ตั้ง `base` เป็น `/thai-word-defense/` ใน `vite.config.ts` และมี workflow ที่ `.github/workflows/deploy.yml` แล้ว

### สร้าง repository และ push (ครั้งแรก)

1. สร้าง repository ชื่อ `thai-word-defense` บน GitHub (เลือกสร้างแบบว่าง ไม่ต้องเพิ่ม README ซ้ำ)
2. เปิด terminal ในโฟลเดอร์โปรเจกต์ แล้วรัน:

```bash
git init
git add .
git commit -m "Initial Thai Word Defense game"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/thai-word-defense.git
git push -u origin main
```

3. ใน GitHub ไปที่ **Settings → Pages** แล้วตั้ง **Build and deployment → Source = GitHub Actions**
4. ไปที่ **Actions** เพื่อตรวจ workflow `Deploy to GitHub Pages` เมื่อ push ไป branch `main` ระบบจะตรวจ typecheck/test/lint/question bank แล้ว build และ deploy ให้อัตโนมัติ
5. URL จะอยู่ในหน้า workflow deployment หรือ Settings → Pages โดยทั่วไปเป็น `https://<YOUR_USERNAME>.github.io/thai-word-defense/`

ทุกครั้งที่ push commit ใหม่ workflow จะ deploy เวอร์ชันล่าสุดให้อัตโนมัติ

## สิทธิ์และแหล่งที่มา

ดูรายละเอียดใน [`CREDITS.md`](CREDITS.md) และเงื่อนไขการใช้ใน [`LICENSE`](LICENSE)

## ขอบเขตรุ่นเริ่มต้น

- คะแนนและสถิติอยู่ในเครื่องผู้เล่น (`localStorage`) ยังไม่มี backend leaderboard หรือการรวมคะแนนข้ามเครื่อง
- รายงานครูส่งออกเป็นข้อความ ภาพสรุป PNG และพิมพ์/บันทึก PDF จากเบราว์เซอร์ ยังไม่มีการส่งข้อมูลไป Google Sheets
- คลังคำถามเป็นชุดเริ่มต้นเพื่อใช้สอนและฝึก ควรให้ครูภาษาไทยทบทวนคำอธิบาย/บริบทก่อนนำไปใช้ประเมินผลจริง โดยเฉพาะข้อที่มี `todo`
