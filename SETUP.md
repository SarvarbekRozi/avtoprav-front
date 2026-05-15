# AutoTest — sozlash yo'riqnomasi

Loyihada **2 ta katalog**:
- **Frontend** (Nuxt 4): `D:\loyiha\autotest-front` — foydalanuvchi sayti
- **Backend** (Laravel 13): `D:\loyiha\autotest-backend` — API + admin paneli

---

## 1. Backend muhiti (BIR MARTALIK)

Laravel 13 **PHP 8.3+** talab qiladi. Hozir `D:\OSPanel`da faqat PHP 8.1 bor.

### Tavsiya: Laravel Herd o'rnatish (eng oson)

1. <https://herd.laravel.com/windows> — bepul yuklab oling
2. O'rnating (avtomatik PHP 8.3, 8.4, Composer, Nginx)
3. Herd'da `D:\loyiha\autotest-backend`'ni "Sites"ga qo'shing
4. Herd PATH'ga `php`, `composer`'ni avtomatik qo'shadi → terminalda ishlaydi

### Yoki: OSPanelda PHP 8.3 modulini qo'shish

1. <https://ospanel.io/download/> — PHP 8.3 modulini yuklab `D:\OSPanel\modules\php\PHP_8.3` ichiga joylang
2. OSPanel "Domains" → "autotest-backend" → PHP versiyani 8.3 qiling
3. Composer'ni alohida o'rnating: <https://getcomposer.org/Composer-Setup.exe>

PHP 8.3 ishlayotganini tekshiring (yangi terminal oching):
```powershell
php -v
composer -V
```

---

## 2. Backend sozlash (PHP 8.3 tayyor bo'lgach)

```powershell
cd D:\loyiha\autotest-backend

# Yangi paketlarni o'rnatish (sanctum, intervention/image)
composer install

# Bazani tozalab qaytadan yaratish (boshlang'ich seeders bilan)
php artisan migrate:fresh --seed

# Rasm yuklash uchun symlink
php artisan storage:link

# Backend ishga tushirish (port 8000)
php artisan serve
```

**Default admin:**
- Login: `admin`
- Parol: `admin123`

Admin paneli: <http://localhost:8000/admin/login>

---

## 3. Frontend ishga tushirish

```powershell
cd D:\loyiha\autotest-front

# Birinchi marta:
npm install

# Har safar:
npm run dev
```

Sayt: <http://localhost:3000>

> Agar 3000 band bo'lsa, Nuxt avtomatik 3001'ga o'tadi — terminalda ko'ring.

---

## Loyiha tuzilmasi

### Backend (Laravel)

| Joy | Nima |
|-----|------|
| `app/Models/` | Eloquent modellar: User, Category, Topic, Question, Option, Attempt, AttemptAnswer, UserQuestionStat, Bookmark |
| `app/Http/Controllers/Admin/` | Blade admin: auth, dashboard, categories, topics, questions, users |
| `app/Http/Controllers/Api/` | API: auth, catalog, test, me |
| `app/Services/TestSessionService.php` | Test boshlash/javob qabul qilish/yakunlash logikasi |
| `resources/views/admin/` | Admin paneli Blade shablonlari |
| `routes/web.php` | `/admin/*` marshrutlar |
| `routes/api.php` | `/api/*` marshrutlar (Sanctum tokenlari) |
| `database/migrations/` | DB sxemasi |
| `database/seeders/DatabaseSeeder.php` | Default admin + 6 toifa + 12 mavzu |

### Frontend (Nuxt 4)

| Joy | Nima |
|-----|------|
| `app/app.vue` | Asosiy entry |
| `app/layouts/default.vue` | Header + footer + til almashtirgich |
| `app/layouts/test.vue` | Test rejimi uchun toza layout (taymer bilan) |
| `app/pages/index.vue` | Bosh sahifa, rejim tanlash |
| `app/pages/login.vue` `register.vue` | Auth sahifalar |
| `app/pages/topics/index.vue` | Mavzular ro'yxati |
| `app/pages/test/start/[mode].vue` | Test boshlash (mode = exam/random/topic/mistakes...) |
| `app/pages/test/play/[attemptId].vue` | Test ishlash (savol, variant, taymer, izoh) |
| `app/pages/test/result/[attemptId].vue` | Natija ekrani |
| `app/pages/me/stats.vue` `mistakes.vue` `bookmarks.vue` | Foydalanuvchi paneli |
| `app/stores/auth.ts` | Pinia auth store (token, user) |
| `app/composables/useApi.ts` | API client |
| `app/composables/useI18n.ts` | uz_latn / uz_cyrl tillari |
| `app/middleware/auth.ts` `guest.ts` | Sahifa himoyasi |

---

## Test rejimlari (mavjud)

| Rejim | Tavsif | URL |
|------|--------|-----|
| `ticket` | Rasmiy bilet (1-100, 20 savol, 25 daq) | `/tickets` → bilet tanlanadi |
| `exam` | 20 tasodifiy savol, 25 daq, 2 xato ruxsat | `/test/start/exam` |
| `random` | Tasodifiy 20 ta | `/test/start/random` |
| `topic` | Mavzu bo'yicha | `/test/start/topic?topic_id=N` |
| `category` | Toifa bo'yicha (A/B/C/D) | `/test/start/category?category_id=N` |
| `mistakes` | Faqat xato qilgan savollar | `/test/start/mistakes` |
| `marathon` | 200 savol ketma-ket | `/test/start/marathon` |
| `memorize` | Javob+izoh ko'rinib turadi | `/test/start/memorize` |

## Motivatsiya tizimi (Duolingo uslubi)

- **🔥 Streak (seriya)**: Foydalanuvchi kunlik maqsadini bajarsa, ketma-ket kunlar oshib boradi. Maqsad bajarilmasa — seriya 0 ga tushadi.
- **🎯 Kunlik maqsad**: Default 20 savol. Foydalanuvchi profil sahifasida o'zgartira oladi (5-100).
- **📅 So'nggi 7 kun**: Bosh sahifa va profilda kunlik faollik kvadratchalari (yashil = maqsad bajarilgan, sariq = qisman).
- Header'da har doim 🔥 N kun ko'rinadi.

## Mobil qurilmalar / PWA

- Sayt **PWA**'ga moslangan: foydalanuvchi telefon brauzerida "Add to Home Screen" qila oladi.
- Mobil ekranda test rejimida tugma pastda yopishqoq joylashadi (oson barmoq bilan bosish uchun).
- Manifest: `/manifest.webmanifest`, ikonalar: `/icon-192.svg`, `/icon-512.svg`.

---

## Premium (kelajakda)

Schema tayyor:
- `topics.is_premium` — butun mavzuni qulflash
- `questions.is_premium` — bitta savolni qulflash
- `users.is_premium` + `users.premium_until` — foydalanuvchining obunasi

API allaqachon `is_premium` foydalanuvchilarga premium savollarni qaytaradi, qolganlariga **avtomatik** filterlaydi.

Keyin to'lov tizimi (Payme/Click) integratsiyasi qo'shilishi kerak — alohida modul.

---

## Tezkor sozlash skripti

`D:\loyiha\autotest-front\start-all.bat` faylini yarating (ikkala serverni birga ishga tushirish uchun):

```bat
@echo off
start "Backend" cmd /k "cd /d D:\loyiha\autotest-backend && php artisan serve"
start "Frontend" cmd /k "cd /d D:\loyiha\autotest-front && npm run dev"
```
