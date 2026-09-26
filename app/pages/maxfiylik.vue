<script setup lang="ts">
// OCHIQ sahifa — auth middleware YO'Q.
// Sabab: Google OAuth ilovasini "Production" ga chiqarish uchun maxfiylik
// siyosati kirishsiz ochiladigan ommaviy URL'da turishi SHART (Google Auth
// Platform → Branding). Qidiruv botlari ham ko'ra olishi uchun SSR bilan.
//
// Matndagi har bir da'vo kodga tayanadi — o'zgartirganda kodni ham tekshiring:
//   uchinchi tomonlar  → config/services.php (google, telegram, anthropic) + Payme
//   AI'ga ketadigan    → AiExplanationService: faqat savol, variantlar, javob
//   mehmon o'chirish   → users:prune-guests (--days=7, --stale=90)
//   qurilma limiti     → config/security.php max_devices
//   cookie'lar         → faqat useCookie (auth_token, locale, theme, ...), analitika yo'q
import type { LegalSection } from '~/components/LegalDoc.vue'

const i18n = useI18n()

useSeoMeta({
  title: () => i18n.t({ uz: 'Maxfiylik siyosati | Avtoprav', kr: 'Махфийлик сиёсати | Avtoprav' }),
  description: () => i18n.t({
    uz: 'Avtoprav qanday ma\'lumotlarni yig\'adi, ulardan qanday foydalanadi va ularni qanday himoya qiladi.',
    kr: 'Avtoprav қандай маълумотларни йиғади, улардан қандай фойдаланади ва уларни қандай ҳимоя қилади.',
  }),
})

const sections: LegalSection[] = [
  {
    title: { uz: 'Qanday ma\'lumotlarni yig\'amiz', kr: 'Қандай маълумотларни йиғамиз' },
    body: [{ list: [
      {
        uz: 'Hisob ma\'lumotlari: login, ism, elektron pochta, telefon raqami (agar kiritsangiz), profil rasmi va parolning shifrlangan (xeshlangan) ko\'rinishi.',
        kr: 'Ҳисоб маълумотлари: логин, исм, электрон почта, телефон рақами (агар киритсангиз), профил расми ва паролнинг шифрланган (хешланган) кўриниши.',
      },
      {
        uz: 'Google orqali kirsangiz: Google hisobingizdagi ism, elektron pochta, profil rasmi va Google identifikatori. Google parolingiz bizga hech qachon berilmaydi.',
        kr: 'Google орқали кирсангиз: Google ҳисобингиздаги исм, электрон почта, профил расми ва Google идентификатори. Google паролингиз бизга ҳеч қачон берилмайди.',
      },
      {
        uz: 'Telegram orqali kirsangiz: Telegram ID, foydalanuvchi nomi, ism va profil rasmi; botda o\'zingiz ulashsangiz — telefon raqami.',
        kr: 'Telegram орқали кирсангиз: Telegram ID, фойдаланувчи номи, исм ва профил расми; ботда ўзингиз улашсангиз — телефон рақами.',
      },
      {
        uz: 'O\'qish faoliyati: test natijalari, javoblaringiz, ballar va tajriba (XP), ketma-ket kunlar, maqsadlar va imtihon sanasi.',
        kr: 'Ўқиш фаолияти: тест натижалари, жавобларингиз, баллар ва тажриба (XP), кетма-кет кунлар, мақсадлар ва имтиҳон санаси.',
      },
      {
        uz: 'To\'lovlar: tanlangan tarif, summa, sana va to\'lov holati. Karta raqamingizni saqlamaymiz — Payme orqali to\'lovda karta ma\'lumotlari faqat Payme tomonida qayta ishlanadi.',
        kr: 'Тўловлар: танланган тариф, сумма, сана ва тўлов ҳолати. Карта рақамингизни сақламаймиз — Payme орқали тўловда карта маълумотлари фақат Payme томонида қайта ишланади.',
      },
      {
        uz: 'Texnik ma\'lumotlar: IP manzil, brauzer yoki qurilma turi va faol seanslar — hisobni himoya qilish uchun.',
        kr: 'Техник маълумотлар: IP манзил, браузер ёки қурилма тури ва фаол сеанслар — ҳисобни ҳимоя қилиш учун.',
      },
      {
        uz: '«Taklif va izohlar» formasi orqali yuborgan matningiz va (xohlasangiz) aloqa uchun qoldirgan ma\'lumotingiz.',
        kr: '«Таклиф ва изоҳлар» формаси орқали юборган матнингиз ва (хоҳласангиз) алоқа учун қолдирган маълумотингиз.',
      },
    ] }],
  },
  {
    title: { uz: 'Ma\'lumotlardan qanday foydalanamiz', kr: 'Маълумотлардан қандай фойдаланамиз' },
    body: [
      { list: [
        { uz: 'Hisobingizga kirish va uni boshqarish.', kr: 'Ҳисобингизга кириш ва уни бошқариш.' },
        { uz: 'Test natijalari, statistika, xatolar ro\'yxati va shaxsiy tavsiyalarni ko\'rsatish.', kr: 'Тест натижалари, статистика, хатолар рўйхати ва шахсий тавсияларни кўрсатиш.' },
        { uz: 'Premium obunani faollashtirish va to\'lovlarni tasdiqlash.', kr: 'Premium обунани фаоллаштириш ва тўловларни тасдиқлаш.' },
        { uz: 'Hisobni ruxsatsiz kirish va suiiste\'moldan himoya qilish.', kr: 'Ҳисобни рухсатсиз кириш ва суиистеъмолдан ҳимоя қилиш.' },
        { uz: 'Murojaatlaringizga javob berish, xizmatni yaxshilash va xatolarni tuzatish.', kr: 'Мурожаатларингизга жавоб бериш, хизматни яхшилаш ва хатоларни тузатиш.' },
      ] },
      {
        uz: 'Ma\'lumotlaringizni sotmaymiz va reklama maqsadida foydalanmaymiz.',
        kr: 'Маълумотларингизни сотмаймиз ва реклама мақсадида фойдаланмаймиз.',
      },
    ],
  },
  {
    title: { uz: 'Uchinchi tomon xizmatlari', kr: 'Учинчи томон хизматлари' },
    body: [
      { list: [
        { uz: 'Google — Google hisobi orqali kirish uchun.', kr: 'Google — Google ҳисоби орқали кириш учун.' },
        { uz: 'Telegram — Telegram orqali kirish, bot va guruhdagi kunlik test uchun.', kr: 'Telegram — Telegram орқали кириш, бот ва гуруҳдаги кунлик тест учун.' },
        { uz: 'Payme — onlayn to\'lovni qabul qilish uchun.', kr: 'Payme — онлайн тўловни қабул қилиш учун.' },
        {
          uz: 'Anthropic (Claude) — savollarga sun\'iy intellekt izohini tayyorlash uchun. Unga faqat savol matni, javob variantlari va to\'g\'ri javob yuboriladi — shaxsiy ma\'lumotlaringiz yuborilmaydi.',
          kr: 'Anthropic (Claude) — саволларга сунъий интеллект изоҳини тайёрлаш учун. Унга фақат савол матни, жавоб вариантлари ва тўғри жавоб юборилади — шахсий маълумотларингиз юборилмайди.',
        },
      ] },
      {
        uz: 'Bu xizmatlar ma\'lumotlarni o\'z maxfiylik siyosatlari asosida qayta ishlaydi. Qonun talab qilgan holatlardan tashqari ma\'lumotlaringizni boshqa hech kimga bermaymiz.',
        kr: 'Бу хизматлар маълумотларни ўз махфийлик сиёсатлари асосида қайта ишлайди. Қонун талаб қилган ҳолатлардан ташқари маълумотларингизни бошқа ҳеч кимга бермаймиз.',
      },
    ],
  },
  {
    title: { uz: 'Boshqalarga nima ko\'rinadi', kr: 'Бошқаларга нима кўринади' },
    body: [
      { list: [
        {
          uz: 'Reyting jadvallarida — loginingiz, ismingiz, profil rasmingiz, ballaringiz va ketma-ket kunlaringiz.',
          kr: 'Рейтинг жадвалларида — логинингиз, исмингиз, профил расмингиз, балларингиз ва кетма-кет кунларингиз.',
        },
        {
          uz: 'Telegram guruhidagi kunlik testda — Telegram\'dagi ismingiz va natijangiz.',
          kr: 'Telegram гуруҳидаги кунлик тестда — Telegram\'даги исмингиз ва натижангиз.',
        },
      ] },
      {
        uz: 'Elektron pochta, telefon raqami va to\'lov ma\'lumotlari hech qachon boshqa foydalanuvchilarga ko\'rsatilmaydi.',
        kr: 'Электрон почта, телефон рақами ва тўлов маълумотлари ҳеч қачон бошқа фойдаланувчиларга кўрсатилмайди.',
      },
    ],
  },
  {
    title: { uz: 'Cookie fayllar', kr: 'Cookie файллар' },
    body: [{
      uz: 'Faqat xizmat ishlashi uchun zarur cookie\'lardan foydalanamiz: kirish tokeni, tanlangan til, mavzu (yorug\'/qorong\'i) va interfeys sozlamalari. Reklama yoki kuzatuv (analitika) cookie\'lari ishlatilmaydi.',
      kr: 'Фақат хизмат ишлаши учун зарур cookie\'лардан фойдаланамиз: кириш токени, танланган тил, мавзу (ёруғ/қоронғи) ва интерфейс созламалари. Реклама ёки кузатув (аналитика) cookie\'лари ишлатилмайди.',
    }],
  },
  {
    title: { uz: 'Saqlash muddati', kr: 'Сақлаш муддати' },
    body: [{ list: [
      {
        uz: 'Ro\'yxatdan o\'tgan hisob ma\'lumotlari hisob mavjud ekan saqlanadi.',
        kr: 'Рўйхатдан ўтган ҳисоб маълумотлари ҳисоб мавжуд экан сақланади.',
      },
      {
        uz: 'Ro\'yxatdan o\'tmagan (mehmon) hisoblar avtomatik o\'chiriladi: hech qanday test yechilmagan bo\'lsa — 7 kundan keyin, 90 kun faoliyat bo\'lmasa — undan keyin.',
        kr: 'Рўйхатдан ўтмаган (меҳмон) ҳисоблар автоматик ўчирилади: ҳеч қандай тест ечилмаган бўлса — 7 кундан кейин, 90 кун фаолият бўлмаса — ундан кейин.',
      },
      {
        uz: 'Hisob o\'chirilganda unga bog\'liq ma\'lumotlar ham o\'chiriladi. To\'lov yozuvlari qonun talab qilgan muddatgacha saqlanishi mumkin.',
        kr: 'Ҳисоб ўчирилганда унга боғлиқ маълумотлар ҳам ўчирилади. Тўлов ёзувлари қонун талаб қилган муддатгача сақланиши мумкин.',
      },
    ] }],
  },
  {
    title: { uz: 'Sizning huquqlaringiz', kr: 'Сизнинг ҳуқуқларингиз' },
    body: [{ list: [
      {
        uz: 'Profil sahifasida ma\'lumotlaringizni ko\'rish, profil rasmi, kunlik maqsad va imtihon sanasini o\'zgartirish. Boshqa ma\'lumotlarni tuzatish yoki ularning nusxasini olish uchun bizga yozing.',
        kr: 'Профил саҳифасида маълумотларингизни кўриш, профил расми, кунлик мақсад ва имтиҳон санасини ўзгартириш. Бошқа маълумотларни тузатиш ёки уларнинг нусхасини олиш учун бизга ёзинг.',
      },
      {
        uz: 'Hisobingiz va unga tegishli barcha ma\'lumotlarni o\'chirishni so\'rash — pastdagi aloqa manzillariga yozing, so\'rov 30 kun ichida bajariladi.',
        kr: 'Ҳисобингиз ва унга тегишли барча маълумотларни ўчиришни сўраш — пастдаги алоқа манзилларига ёзинг, сўров 30 кун ичида бажарилади.',
      },
      {
        uz: 'Google hisobingizdan Avtoprav\'ga berilgan ruxsatni istalgan vaqtda myaccount.google.com/permissions sahifasida bekor qilish.',
        kr: 'Google ҳисобингиздан Avtoprav\'га берилган рухсатни исталган вақтда myaccount.google.com/permissions саҳифасида бекор қилиш.',
      },
    ] }],
  },
  {
    title: { uz: 'Xavfsizlik', kr: 'Хавфсизлик' },
    body: [{
      uz: 'Parollar faqat shifrlangan (xeshlangan) holda saqlanadi, sayt bilan aloqa HTTPS orqali shifrlanadi, bitta hisobda bir vaqtda ko\'pi bilan 2 ta qurilma faol bo\'la oladi. Shunga qaramay, internet orqali uzatishning hech bir usuli mutlaq xavfsiz emas — parolingizni hech kimga bermang.',
      kr: 'Пароллар фақат шифрланган (хешланган) ҳолда сақланади, сайт билан алоқа HTTPS орқали шифрланади, битта ҳисобда бир вақтда кўпи билан 2 та қурилма фаол бўла олади. Шунга қарамай, интернет орқали узатишнинг ҳеч бир усули мутлақ хавфсиз эмас — паролингизни ҳеч кимга берманг.',
    }],
  },
  {
    title: { uz: 'O\'zgarishlar', kr: 'Ўзгаришлар' },
    body: [{
      uz: 'Ushbu siyosat yangilanishi mumkin. Muhim o\'zgarishlar haqida saytda xabar beramiz; yuqoridagi sana oxirgi tahrir sanasini bildiradi.',
      kr: 'Ушбу сиёсат янгиланиши мумкин. Муҳим ўзгаришлар ҳақида сайтда хабар берамиз; юқоридаги сана охирги таҳрир санасини билдиради.',
    }],
  },
  {
    title: { uz: 'Aloqa', kr: 'Алоқа' },
    body: [{
      uz: 'Savol va so\'rovlar uchun: elektron pochta — sarvarbekrozim@gmail.com, Telegram — @avtoprav_admin.',
      kr: 'Савол ва сўровлар учун: электрон почта — sarvarbekrozim@gmail.com, Telegram — @avtoprav_admin.',
    }],
  },
]
</script>

<template>
  <LegalDoc
    :eyebrow="{ uz: 'Huquqiy ma\'lumot', kr: 'Ҳуқуқий маълумот' }"
    :title="{ uz: 'Maxfiylik siyosati', kr: 'Махфийлик сиёсати' }"
    :updated="{ uz: 'Oxirgi yangilanish: 2026-yil 26-sentabr', kr: 'Охирги янгиланиш: 2026 йил 26 сентябр' }"
    :intro="{
      uz: 'Avtoprav — haydovchilik guvohnomasi imtihoniga tayyorlanish xizmati (avtoprav.uz sayti, Android ilovasi va Telegram bot). Ushbu siyosat qanday ma\'lumotlarni yig\'ishimiz, ulardan nima uchun foydalanishimiz va ularni qanday himoya qilishimizni tushuntiradi.',
      kr: 'Avtoprav — ҳайдовчилик гувоҳномаси имтиҳонига тайёрланиш хизмати (avtoprav.uz сайти, Android иловаси ва Telegram бот). Ушбу сиёсат қандай маълумотларни йиғишимиз, улардан нима учун фойдаланишимиз ва уларни қандай ҳимоя қилишимизни тушунтиради.',
    }"
    :sections="sections"
  />
</template>
