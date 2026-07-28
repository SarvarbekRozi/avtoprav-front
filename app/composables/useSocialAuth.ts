// Ijtimoiy kirish (Google / Telegram) uchun skript yuklash va provayder ulash.
// Hech qanday skript sahifa ochilishida yuklanmaydi — faqat kerak bo'lganda
// (login/register sahifasi ochilganda yoki Mini App aniqlanganda).

export const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client'
export const TELEGRAM_WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22'
export const TELEGRAM_WEBAPP_SRC = 'https://telegram.org/js/telegram-web-app.js'

/** Bir xil skript ikki marta yuklanmasligi uchun promise'lar keshi. */
const scriptCache = new Map<string, Promise<void>>()

/**
 * Skriptni bir marta <head>'ga qo'shadi va yuklanishini kutadi.
 * Xatoda kesh tozalanadi — foydalanuvchi qayta urinib ko'ra oladi.
 */
export function loadScript(src: string): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('loadScript: faqat brauzerda ishlaydi'))
  }

  const cached = scriptCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const onError = () => reject(new Error(`Skript yuklanmadi: ${src}`))

    // Boshqa joyda allaqachon qo'shilgan bo'lishi mumkin (masalan Mini App skripti).
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === '1') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', onError, { once: true })
      return
    }

    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.defer = true
    el.addEventListener('load', () => {
      el.dataset.loaded = '1'
      resolve()
    }, { once: true })
    el.addEventListener('error', onError, { once: true })
    document.head.appendChild(el)
  })

  // Muvaffaqiyatsiz yuklanish keshda qolib ketmasin.
  promise.catch(() => scriptCache.delete(src))
  scriptCache.set(src, promise)

  return promise
}

/** Promise'ni vaqt chegarasi bilan o'raydi (sekin/bloklangan CDN ilovani osib qo'ymasin). */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

// ─── Google Identity Services ───────────────────────────────────────────────

export interface RenderGoogleButtonOptions {
  onCredential: (idToken: string) => void
  /** Tugma kengligi (px). Google 200…400 oralig'ini qabul qiladi. */
  width?: number
}

export function useGoogleAuth() {
  const config = useRuntimeConfig()
  const clientId = String(config.public.googleClientId || '')
  const enabled = !!clientId
  const theme = useTheme()

  // initialize() global — bir marta chaqiriladi, callback esa oxirgi
  // render qilingan tugmaga yo'naltiriladi.
  let initialized = false
  let credentialHandler: ((idToken: string) => void) | null = null

  async function ensureReady() {
    if (!enabled) throw new Error('Google client id sozlanmagan')

    await loadScript(GOOGLE_GSI_SRC)

    const id = window.google?.accounts?.id
    if (!id) throw new Error('Google SDK yuklanmadi')

    if (!initialized) {
      id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) credentialHandler?.(response.credential)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup',
      })
      initialized = true
    }

    return id
  }

  /** Google'ning o'z tugmasini `el` ichiga chizadi. Mavzu o'zgarsa qayta chaqiring. */
  async function renderGoogleButton(el: HTMLElement, opts: RenderGoogleButtonOptions) {
    credentialHandler = opts.onCredential

    const id = await ensureReady()

    const measured = opts.width ?? el.clientWidth ?? 0
    const width = Math.min(400, Math.max(200, Math.round(measured) || 320))

    el.innerHTML = ''
    id.renderButton(el, {
      theme: theme.isDark.value ? 'filled_black' : 'outline',
      size: 'large',
      width,
      text: 'signin_with',
      shape: 'pill',
      locale: 'ru',
    })
  }

  return { enabled, isDark: theme.isDark, renderGoogleButton }
}

// ─── Telegram Login Widget ──────────────────────────────────────────────────

export type TelegramLoginMode = 'popup' | 'widget'

export function useTelegramAuth() {
  const config = useRuntimeConfig()
  const botName = String(config.public.telegramBotName || '')
  const botId = String(config.public.telegramBotId || '')
  const enabled = !!botName

  /**
   * Skriptni yuklab, qaysi usul ishlashini aniqlaydi:
   * `popup` — o'zimizning tugmamiz Telegram oynasini ochadi (asosiy yo'l),
   * `widget` — Telegram'ning rasmiy tugmasini joylashtiramiz (zaxira yo'l).
   */
  async function prepare(): Promise<TelegramLoginMode> {
    await loadScript(TELEGRAM_WIDGET_SRC)
    const canPopup = typeof window.Telegram?.Login?.auth === 'function' && !!botId
    return canPopup ? 'popup' : 'widget'
  }

  /**
   * Telegram oynasini ochadi. Foydalanuvchi bekor qilsa `null` qaytadi —
   * bu xato emas, jimgina e'tiborsiz qoldiriladi.
   */
  function loginViaPopup(): Promise<Record<string, any> | null> {
    return new Promise((resolve, reject) => {
      const auth = window.Telegram?.Login?.auth
      if (typeof auth !== 'function') {
        reject(new Error('Telegram Login mavjud emas'))
        return
      }
      try {
        auth({ bot_id: botId, request_access: 'write' }, (data) => {
          resolve(data && typeof data === 'object' ? data : null)
        })
      }
      catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Zaxira yo'l — Telegram'ning rasmiy tugmasini `el` ichiga joylaydi.
   * Tozalash funksiyasini qaytaradi (window'dagi callback o'chiriladi).
   */
  function mountWidget(el: HTMLElement, onAuth: (payload: Record<string, any>) => void): () => void {
    const fnName = `onTelegramAuth_${Math.random().toString(36).slice(2, 10)}`
    const w = window as unknown as Record<string, unknown>
    w[fnName] = (payload: Record<string, any>) => {
      if (payload && typeof payload === 'object') onAuth(payload)
    }

    el.innerHTML = ''
    const s = document.createElement('script')
    s.async = true
    s.src = TELEGRAM_WIDGET_SRC
    s.setAttribute('data-telegram-login', botName)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-radius', '10')
    s.setAttribute('data-request-access', 'write')
    s.setAttribute('data-onauth', `${fnName}(user)`)
    el.appendChild(s)

    return () => { delete w[fnName] }
  }

  return { enabled, botName, botId, prepare, loginViaPopup, mountWidget }
}

// ─── Telegram Mini App ──────────────────────────────────────────────────────

/**
 * Sayt Telegram Mini App sifatida ochilganini SKRIPTSIZ aniqlaydi —
 * oddiy veb foydalanuvchilar uchun narxi nolga teng.
 */
export function isTelegramWebAppContext(): boolean {
  if (typeof window === 'undefined') return false

  const w = window as any

  if (window.Telegram?.WebApp?.initData) return true
  if (window.location.hash.includes('tgWebApp')) return true

  // Telegram Mini App WebView'iga bu proksilarni kiritadi (Android/iOS/desktop).
  // Skript yuklanmasdan ham ishonchli signal.
  if (w.TelegramWebviewProxy || w.TelegramWebviewProxyProto || w.external?.notify) return true

  // Telegram sahifa yuklanganda init parametrlarini shu kalitda saqlaydi —
  // sahifa qayta yuklanganda hash yo'qolsa ham shu qoladi.
  try {
    if (window.sessionStorage?.getItem('__telegram__initParams')) return true
  }
  catch { /* privacy rejimida sessionStorage yopiq bo'lishi mumkin */ }

  return /Telegram/i.test(navigator.userAgent || '')
}

/** Mini App obyekti (agar mavjud bo'lsa). SSR'da har doim null. */
export function useTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}
