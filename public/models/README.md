# 3D mashina modellari

`car.glb` — sayt bo'ylab ishlatiladigan 3D mashina modeli (hero animatsiyasi + `/poligon` o'yini).

## O'z mashinangizni qo'yish (masalan, Cobalt)

1. `.glb` (yoki `.gltf`) formatdagi mashina modelini toping.
2. Uni shu papkaga **`car.glb`** nomi bilan joylang (eskisini almashtiring).
3. Tamom — sayt avtomatik yuklaydi.

Tizim modelni **avtomatik moslaydi**: markazlaydi, kerakli o'lchamga keltiradi (`loadCarModel`, `app/composables/useGltfCar.ts`), yerga qo'yadi va uzunligini harakat yo'nalishiga to'g'rilaydi. Shuning uchun deyarli har qanday model "shundoq ishlaydi".

> Agar mashina teskari (orqasi bilan) yursa — `useGltfCar.ts` da yo'nalishni 180° (`Math.PI`) ga to'g'rilang. Model bo'lmasa/yuklanmasa, kod o'rnatilgan prosedural mashinaga qaytadi.

## Bepul, litsenziyasiz (CC0) manbalar
- **Sketchfab** — Downloadable + CC0 filtri (sketchfab.com)
- **Poly Pizza** — poly.pizza (CC0)
- **Kenney Car Kit** — kenney.nl (CC0, low-poly)
- **Khronos glTF Sample Models** — hozirgi default (ToyCar) shu yerdan

Eslatma: tijoriy ishlatishda model litsenziyasini tekshiring.
