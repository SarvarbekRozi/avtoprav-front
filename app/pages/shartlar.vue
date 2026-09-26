<script setup lang="ts">
// OCHIQ sahifa — auth middleware YO'Q (maxfiylik.vue dagi sabab bilan: Google
// OAuth "Production" uchun ommaviy foydalanish shartlari URL'i kerak).
//
// Matndagi da'volar kodga tayanadi — o'zgartirganda kodni ham tekshiring:
//   qurilma limiti  → config/security.php max_devices (eng eskisi chiqariladi)
//   kafolat kunlari → pages/pricing.vue GUARANTEE_DAYS
//   avto-yangilanish YO'Q — obuna bir martalik to'lov bilan muddatga beriladi
import type { LegalSection } from '~/components/LegalDoc.vue'

const i18n = useI18n()

useSeoMeta({
  title: () => i18n.t({ uz: 'Foydalanish shartlari | Avtoprav', kr: 'Фойдаланиш шартлари | Avtoprav' }),
  description: () => i18n.t({
    uz: 'Avtoprav xizmatidan foydalanish qoidalari: hisob, Premium obuna, to\'lov va kafolat shartlari.',
    kr: 'Avtoprav хизматидан фойдаланиш қоидалари: ҳисоб, Premium обуна, тўлов ва кафолат шартлари.',
  }),
})

const sections: LegalSection[] = [
  {
    title: { uz: 'Xizmat haqida', kr: 'Хизмат ҳақида' },
    body: [{
      uz: 'Avtoprav — yo\'l harakati qoidalari bo\'yicha test savollari, imtihon simulyatsiyasi, yo\'l belgilari ma\'lumotnomasi va o\'qish statistikasi orqali haydovchilik guvohnomasi imtihoniga tayyorlanish vositasi. Avtoprav davlat organi emas va rasmiy imtihon o\'tkazmaydi.',
      kr: 'Avtoprav — йўл ҳаракати қоидалари бўйича тест саволлари, имтиҳон симуляцияси, йўл белгилари маълумотномаси ва ўқиш статистикаси орқали ҳайдовчилик гувоҳномаси имтиҳонига тайёрланиш воситаси. Avtoprav давлат органи эмас ва расмий имтиҳон ўтказмайди.',
    }],
  },
  {
    title: { uz: 'Hisob', kr: 'Ҳисоб' },
    body: [{ list: [
      {
        uz: 'Ro\'yxatdan o\'tishda to\'g\'ri ma\'lumot kiriting va parolingizni hech kimga bermang.',
        kr: 'Рўйхатдан ўтишда тўғри маълумот киритинг ва паролингизни ҳеч кимга берманг.',
      },
      {
        uz: 'Hisob shaxsiy — uni boshqalar bilan bo\'lishish mumkin emas. Bir vaqtda ko\'pi bilan 2 ta qurilmada kirish mumkin; yangi qurilmadan kirilsa, eng uzoq ishlatilmagan qurilmadagi seans yopiladi.',
        kr: 'Ҳисоб шахсий — уни бошқалар билан бўлишиш мумкин эмас. Бир вақтда кўпи билан 2 та қурилмада кириш мумкин; янги қурилмадан кирилса, энг узоқ ишлатилмаган қурилмадаги сеанс ёпилади.',
      },
      {
        uz: 'Hisobingiz orqali amalga oshirilgan harakatlar uchun o\'zingiz javobgarsiz.',
        kr: 'Ҳисобингиз орқали амалга оширилган ҳаракатлар учун ўзингиз жавобгарсиз.',
      },
    ] }],
  },
  {
    title: { uz: 'Taqiqlangan harakatlar', kr: 'Тақиқланган ҳаракатлар' },
    body: [{ list: [
      {
        uz: 'Savollar, rasmlar va boshqa kontentni avtomatik yig\'ib olish (skreyping), ommaga tarqatish yoki sotish.',
        kr: 'Саволлар, расмлар ва бошқа контентни автоматик йиғиб олиш (скрейпинг), оммага тарқатиш ёки сотиш.',
      },
      {
        uz: 'Bot, skript yoki boshqa usullar bilan ball va reytingni soxtalashtirish, xizmatga sun\'iy yuklama berish.',
        kr: 'Бот, скрипт ёки бошқа усуллар билан балл ва рейтингни сохталаштириш, хизматга сунъий юклама бериш.',
      },
      {
        uz: 'Xizmat xavfsizligini buzishga yoki boshqa foydalanuvchi hisobiga kirishga urinish.',
        kr: 'Хизмат хавфсизлигини бузишга ёки бошқа фойдаланувчи ҳисобига киришга уриниш.',
      },
      {
        uz: 'Telegram guruhida haqorat, spam va reklama tarqatish.',
        kr: 'Telegram гуруҳида ҳақорат, спам ва реклама тарқатиш.',
      },
    ] }],
  },
  {
    title: { uz: 'Premium obuna va to\'lovlar', kr: 'Premium обуна ва тўловлар' },
    body: [{ list: [
      {
        uz: 'Asosiy imkoniyatlar bepul. Premium qo\'shimcha imkoniyatlarni ochadi; amaldagi tariflar va narxlar «Tariflar» sahifasida ko\'rsatiladi.',
        kr: 'Асосий имкониятлар бепул. Premium қўшимча имкониятларни очади; амалдаги тарифлар ва нархлар «Тарифлар» саҳифасида кўрсатилади.',
      },
      {
        uz: 'To\'lov Payme orqali yoki karta o\'tkazmasi bilan qabul qilinadi. Karta o\'tkazmasi administrator tekshirganidan keyin faollashadi.',
        kr: 'Тўлов Payme орқали ёки карта ўтказмаси билан қабул қилинади. Карта ўтказмаси администратор текширганидан кейин фаоллашади.',
      },
      {
        uz: 'Obuna tanlangan muddat davomida amal qiladi va avtomatik yangilanmaydi — kartangizdan o\'z-o\'zidan pul yechilmaydi.',
        kr: 'Обуна танланган муддат давомида амал қилади ва автоматик янгиланмайди — картангиздан ўз-ўзидан пул ечилмайди.',
      },
      {
        uz: 'Kafolat: Premium sizga yoqmasa, to\'lovdan keyin 7 kun ichida bizga yozing — pulingiz qaytariladi.',
        kr: 'Кафолат: Premium сизга ёқмаса, тўловдан кейин 7 кун ичида бизга ёзинг — пулингиз қайтарилади.',
      },
    ] }],
  },
  {
    title: { uz: 'Kontent', kr: 'Контент' },
    body: [
      {
        uz: 'Savollar va izohlar amaldagi yo\'l harakati qoidalari asosida tayyorlanadi, ammo ularda xato yoki eskirgan ma\'lumot bo\'lishi mumkin — bunday holatda rasmiy qoidalar ustuvor. Sun\'iy intellekt izohlari yordamchi xarakterda va xato bo\'lishi mumkin. Avtoprav imtihondan o\'tishingizga kafolat bermaydi.',
        kr: 'Саволлар ва изоҳлар амалдаги йўл ҳаракати қоидалари асосида тайёрланади, аммо уларда хато ёки эскирган маълумот бўлиши мумкин — бундай ҳолатда расмий қоидалар устувор. Сунъий интеллект изоҳлари ёрдамчи характерда ва хато бўлиши мумкин. Avtoprav имтиҳондан ўтишингизга кафолат бермайди.',
      },
      {
        uz: 'Sayt dizayni, dasturi va biz tayyorlagan materiallar Avtoprav\'ga tegishli. Yo\'l belgilari rasmlari tegishli litsenziyalar asosida ishlatiladi — manbalar «Yo\'l belgilari» sahifasida ko\'rsatilgan.',
        kr: 'Сайт дизайни, дастури ва биз тайёрлаган материаллар Avtoprav\'га тегишли. Йўл белгилари расмлари тегишли лицензиялар асосида ишлатилади — манбалар «Йўл белгилари» саҳифасида кўрсатилган.',
      },
    ],
  },
  {
    title: { uz: 'Hisobni cheklash va o\'chirish', kr: 'Ҳисобни чеклаш ва ўчириш' },
    body: [{
      uz: 'Ushbu shartlar buzilsa, hisobni cheklash yoki bloklash huquqini o\'zimizda saqlaymiz. Siz istalgan vaqtda hisobingizni o\'chirishni so\'rashingiz mumkin — batafsil Maxfiylik siyosatida.',
      kr: 'Ушбу шартлар бузилса, ҳисобни чеклаш ёки блоклаш ҳуқуқини ўзимизда сақлаймиз. Сиз исталган вақтда ҳисобингизни ўчиришни сўрашингиз мумкин — батафсил Махфийлик сиёсатида.',
    }],
  },
  {
    title: { uz: 'Javobgarlikni cheklash', kr: 'Жавобгарликни чеклаш' },
    body: [{
      uz: 'Xizmat «boricha» taqdim etiladi. Uzluksiz va xatosiz ishlashiga harakat qilamiz, lekin texnik uzilishlar bo\'lishi mumkin. Qonun ruxsat bergan darajada, xizmatdan foydalanish natijasidagi bilvosita zararlar uchun javobgar emasmiz.',
      kr: 'Хизмат «борича» тақдим этилади. Узлуксиз ва хатосиз ишлашига ҳаракат қиламиз, лекин техник узилишлар бўлиши мумкин. Қонун рухсат берган даражада, хизматдан фойдаланиш натижасидаги билвосита зарарлар учун жавобгар эмасмиз.',
    }],
  },
  {
    title: { uz: 'O\'zgarishlar va qo\'llaniladigan qonun', kr: 'Ўзгаришлар ва қўлланиладиган қонун' },
    body: [{
      uz: 'Shartlar yangilanishi mumkin; yangilangandan keyin xizmatdan foydalanishni davom ettirish yangi shartlarga rozilikni bildiradi. Ushbu shartlar O\'zbekiston Respublikasi qonunchiligiga muvofiq talqin qilinadi.',
      kr: 'Шартлар янгиланиши мумкин; янгилангандан кейин хизматдан фойдаланишни давом эттириш янги шартларга розиликни билдиради. Ушбу шартлар Ўзбекистон Республикаси қонунчилигига мувофиқ талқин қилинади.',
    }],
  },
  {
    title: { uz: 'Aloqa', kr: 'Алоқа' },
    body: [{
      uz: 'Savol va murojaatlar uchun: elektron pochta — sarvarbekrozim@gmail.com, Telegram — @avtoprav_admin.',
      kr: 'Савол ва мурожаатлар учун: электрон почта — sarvarbekrozim@gmail.com, Telegram — @avtoprav_admin.',
    }],
  },
]
</script>

<template>
  <LegalDoc
    :eyebrow="{ uz: 'Huquqiy ma\'lumot', kr: 'Ҳуқуқий маълумот' }"
    :title="{ uz: 'Foydalanish shartlari', kr: 'Фойдаланиш шартлари' }"
    :updated="{ uz: 'Oxirgi yangilanish: 2026-yil 26-sentabr', kr: 'Охирги янгиланиш: 2026 йил 26 сентябр' }"
    :intro="{
      uz: 'Ushbu shartlar Avtoprav xizmatidan (avtoprav.uz sayti, Android ilovasi va Telegram bot) foydalanish qoidalarini belgilaydi. Ro\'yxatdan o\'tish yoki xizmatdan foydalanish orqali siz ushbu shartlarga va Maxfiylik siyosatiga rozilik bildirasiz.',
      kr: 'Ушбу шартлар Avtoprav хизматидан (avtoprav.uz сайти, Android иловаси ва Telegram бот) фойдаланиш қоидаларини белгилайди. Рўйхатдан ўтиш ёки хизматдан фойдаланиш орқали сиз ушбу шартларга ва Махфийлик сиёсатига розилик билдирасиз.',
    }"
    :sections="sections"
  />
</template>
