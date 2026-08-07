/**
 * Robot renderlaridan ko'k fonni kesib olish (chroma key).
 *
 * Ishlatish:
 *   node scripts/robot-cutout.mjs
 *
 * Kirish : public/robot/src/*.png  (ko'k fonli original renderlar)
 * Chiqish: public/robot/<nom>.png  (shaffof fonli, kesilgan, 640px)
 *
 * NEGA maxsus skript (Photoshop emas): kesish qoidasi bu personajga moslangan.
 * Fon — TO'YINGAN ko'k (B kanali R va G dan ancha yuqori), robotning o'zi esa
 * oq/kulrang va PASTEL ko'k. Pastel ko'kda B va G bir-biriga yaqin, shuning
 * uchun "B − G" farqi ikkisini ishonchli ajratadi — oddiy "ko'kni o'chir"
 * usuli robotning ko'k detallarini ham yeb qo'yardi.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'

/** Kirish PNG ham, JPG ham bo'lishi mumkin — ikkalasi ham RGBA rasterga keltiriladi */
function readImage(path) {
  const buf = readFileSync(path)
  if (/\.png$/i.test(path)) return PNG.sync.read(buf)
  const raw = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true })
  const png = new PNG({ width: raw.width, height: raw.height })
  png.data.set(raw.data)
  return png
}

const SRC_DIR = 'public/robot/src'
const OUT_DIR = 'public/robot'
const MAX_SIZE = 380        // ekranda 128–158px chiqadi → 2.4x zaxira, fayl yengil
const PAD = 0.03            // atrofdagi bo'shliq (kesilgandan keyin)

/**
 * Fon ehtimoli: 0 = aniq robot, 1 = aniq fon.
 *
 * Chegaralar shu personajga qarab tanlangan (haqiqiy piksellardan o'lchangan):
 *   fon ko'k    #2f6ff8 → B−G=137, B−R=201   → score 1.25  (o'chadi)
 *   BINAFSHA    #8b7fc4 → B−G= 69, B−R= 57   → score 0.38  (qoladi)
 *   pastel ko'k #9ecfe0 → B−G= 17, B−R= 66   → score 0.15  (qoladi)
 *
 * Binafsha (beret, jahl belgilari) eng nozik joyi: unda ham B kanali yuqori,
 * lekin B−R farqi fonникidan 3.5 barobar kichik. Aynan shu farq ajratadi.
 */
function bgScore(r, g, b) {
  const dG = b - g
  const dR = b - r
  const dP = g - r        // BINAFSHANI himoya qiladi: ko'kda G>R, binafshada G<R
  if (dG <= 0 || dR <= 0 || dP <= 0) return 0
  return Math.min(dG / 110, dR / 150, dP / 40, 1)
}

// Chegaralar originallardan O'LCHANGAN, taxmin emas:
//   fon        : eng past 0.77, odatda 0.86–1.00
//   robot      : 0.00–0.50 (binafsha 0 ga tushadi, dP sababli)
// Orada 0.27 lik bo'sh oraliq bor — 0.70 xavfsiz kesim.
const SEED = 0.85   // to'lqin faqat shundan boshlanadi
const GROW = 0.70   // to'lqin shu darajagacha tarqaladi


function cutout(png) {
  const { width: w, height: h, data } = png
  const score = new Float32Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    score[p] = bgScore(data[i], data[i + 1], data[i + 2])
  }

  // Chetdan ichkariga to'lqin (gisterezis): boshlanish nuqtasi faqat ANIQ fon
  // (SEED), keyin bo'shroq chegara (GROW) bilan tarqaladi. Robot ichidagi
  // ko'kish piksel (ko'z aksi, kombinezon) chetga ulanmagani uchun tegilmaydi.
  const isBg = new Uint8Array(w * h)
  const stack = []
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const p = y * w + x
    if (isBg[p] || score[p] < SEED) return
    isBg[p] = 1; stack.push(p)
  }
  const grow = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const p = y * w + x
    if (isBg[p] || score[p] < GROW) return
    isBg[p] = 1; stack.push(p)
  }
  // Boshlanish nuqtalari BUTUN rasmdan, faqat chetdan emas: qo'l bilan tana
  // orasi va oyoqlar orasi kabi YOPIQ fon joylari chetga ulanmagan bo'ladi va
  // aks holda ko'k dog' bo'lib qolardi. Bu xavfsiz, chunki robotning eng
  // "ko'k" piksel skori ~0.5, SEED esa 0.85.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) seed(x, y)
  while (stack.length) {
    const p = stack.pop()
    const x = p % w, y = (p - x) / w
    grow(x + 1, y); grow(x - 1, y); grow(x, y + 1); grow(x, y - 1)
  }

  // To'liq o'lchamda QAT'IY maska. Silliq chetlarni keyingi kichraytirish
  // (box-filter) hosil qiladi — bu chekkada kulrang-ko'k halqa qoldirmaydi.
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    data[i + 3] = isBg[p] ? 0 : 255
  }

  // Despill: fon bilan chegaradosh 2px robotda ko'k aks qolishi mumkin
  // (JPEG artefakti + haqiqiy anti-aliasing). Ortiqcha ko'kni bosamiz.
  const near = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (isBg[p]) continue
      for (let dy = -2; dy <= 2 && !near[p]; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          if (isBg[ny * w + nx]) { near[p] = 1; break }
        }
      }
    }
  }
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (!near[p]) continue
    const cap = Math.max(data[i], data[i + 1])
    const over = data[i + 2] - cap
    if (over > 0) data[i + 2] = Math.round(data[i + 2] - over * 0.7)
  }
  return png
}

/** Shaffof bo'lmagan qismga qirqish + bir oz bo'shliq */
function trim(png) {
  const { width: w, height: h, data } = png
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return png
  const bw = maxX - minX + 1, bh = maxY - minY + 1
  const side = Math.round(Math.max(bw, bh) * (1 + PAD * 2))
  const out = new PNG({ width: side, height: side })
  out.data.fill(0)
  const ox = Math.round((side - bw) / 2 - minX)
  const oy = Math.round((side - bh) / 2 - minY)
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const s = (y * w + x) * 4
      const dx = x + ox, dy = y + oy
      if (dx < 0 || dy < 0 || dx >= side || dy >= side) continue
      const d = (dy * side + dx) * 4
      out.data[d] = data[s]; out.data[d + 1] = data[s + 1]
      out.data[d + 2] = data[s + 2]; out.data[d + 3] = data[s + 3]
    }
  }
  return out
}

/** Box-filter kichraytirish (alfani hisobga olgan holda) */
function resize(png, size) {
  const { width: w, height: h, data } = png
  if (w <= size) return png
  const out = new PNG({ width: size, height: size })
  const k = w / size
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * k), x1 = Math.min(w, Math.ceil((x + 1) * k))
      const y0 = Math.floor(y * k), y1 = Math.min(h, Math.ceil((y + 1) * k))
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const s = (yy * w + xx) * 4
          const al = data[s + 3] / 255
          r += data[s] * al; g += data[s + 1] * al; b += data[s + 2] * al
          a += data[s + 3]; n++
        }
      }
      const d = (y * size + x) * 4
      const aa = a / n
      const wgt = aa / 255 * n || 1
      out.data[d] = Math.round(r / wgt); out.data[d + 1] = Math.round(g / wgt)
      out.data[d + 2] = Math.round(b / wgt); out.data[d + 3] = Math.round(aa)
    }
  }
  return out
}

if (!existsSync(SRC_DIR)) {
  console.error(`\n  ${SRC_DIR} topilmadi.\n  Original renderlarni shu papkaga qo'ying va qayta ishga tushiring.\n`)
  process.exit(1)
}
mkdirSync(OUT_DIR, { recursive: true })

const files = readdirSync(SRC_DIR).filter(f => /\.(png|jpe?g)$/i.test(f))
if (!files.length) { console.error(`  ${SRC_DIR} bo'sh (.png yoki .jpg kerak)`); process.exit(1) }

/** Rasmda allaqachon shaffoflik bormi? (>2% piksel shaffof bo'lsa — ha) */
function hasAlpha(png) {
  let clear = 0
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < 8) clear++
  return clear > png.width * png.height * 0.02
}

for (const f of files) {
  const png = readImage(join(SRC_DIR, f))
  // Fon allaqachon olib tashlangan bo'lsa chroma-key SHART EMAS — uni qayta
  // qo'llash tayyor chetlarni buzardi. Faqat qirqamiz va kichraytiramiz.
  const keyed = hasAlpha(png) ? png : cutout(png)
  const out = resize(trim(keyed), MAX_SIZE)
  const name = basename(f, extname(f)) + '.png'
  writeFileSync(join(OUT_DIR, name), PNG.sync.write(out))
  console.log(`  ✔ ${f}  →  ${OUT_DIR}/${name}  (${out.width}×${out.height})`)
}
console.log('\n  Tayyor.\n')
