// Telegram Mini App initData'sini HTML'ning eng boshiga inline skript sifatida
// qo'yadi.
//
// NEGA SHUNDAY QILINDI (uzoq qidiruvdan keyin aniqlangan):
//   1. Telegram initData'ni URL hash'da yuboradi: #tgWebAppData=...
//   2. Vue Router boshlang'ich navigatsiyada hash'ni VAQTINCHA olib tashlaydi —
//      shuning uchun Nuxt plaginlari ishlaganda window.location.hash BO'SH.
//      (Brauzerda o'lchandi: plagin ichida hash="", konsoldan keyin o'qilsa 264 belgi.)
//   3. Rasmiy telegram-web-app.js yuklangach hash'ni butunlay tozalaydi.
// Ya'ni Nuxt ichidagi HECH BIR nuqta ishonchli emas. Yagona kafolatli joy —
// bundle yuklanishidan oldin, HTML'ning o'zida ishlaydigan skript.
//
// Natijasi window.__tgInitData ga yoziladi; uni utils/telegram.ts o'qiydi.

const SNIPPET = `<script>(function(){try{
var h=(location.hash||"").replace(/^#/,"");if(!h)return;
var v="",m=h.match(/(?:^|&)tgWebAppData=([^&]*)/);
if(m&&m[1]){try{v=decodeURIComponent(m[1])}catch(e){v=m[1]}}
if(v.indexOf("hash=")<0&&h.indexOf("hash=")>-1&&h.indexOf("auth_date=")>-1){
v=h.replace(/^tgWebAppData=/,"").split("&").filter(function(p){return !/^tgWebApp[A-Za-z]*=/.test(p)}).join("&")}
if(v.indexOf("hash=")>-1){window.__tgInitData=v}
}catch(e){}})()</script>`

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    // Eng boshiga — boshqa hamma skriptdan oldin ishlashi uchun.
    html.head.unshift(SNIPPET)
  })
})
