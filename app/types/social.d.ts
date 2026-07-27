// Google Identity Services va Telegram (Login Widget + Mini App) uchun
// global tiplar. Bu skriptlar sahifaga dinamik qo'shiladi, shuning uchun
// npm paketi yo'q — kerakli qismini o'zimiz e'lon qilamiz.

export {}

declare global {
  // ─── Google Identity Services ─────────────────────────────────────────────
  interface GoogleCredentialResponse {
    credential?: string
    select_by?: string
    clientId?: string
  }

  interface GoogleIdConfiguration {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    ux_mode?: 'popup' | 'redirect'
    login_uri?: string
    nonce?: string
  }

  interface GoogleButtonConfiguration {
    type?: 'standard' | 'icon'
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'small' | 'medium' | 'large'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    logo_alignment?: 'left' | 'center'
    width?: number | string
    locale?: string
  }

  interface GoogleAccountsId {
    initialize: (config: GoogleIdConfiguration) => void
    renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void
    prompt: (listener?: (notification: unknown) => void) => void
    disableAutoSelect: () => void
    cancel: () => void
  }

  interface GoogleNamespace {
    accounts?: { id?: GoogleAccountsId }
  }

  // ─── Telegram Login Widget ────────────────────────────────────────────────
  interface TelegramLoginUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
    [key: string]: unknown
  }

  interface TelegramLoginNamespace {
    auth: (
      options: { bot_id: string | number, request_access?: string | boolean, lang?: string },
      callback: (data: TelegramLoginUser | false | null) => void,
    ) => void
  }

  // ─── Telegram Mini App (WebApp) ───────────────────────────────────────────
  interface TelegramWebApp {
    initData: string
    initDataUnsafe?: Record<string, any>
    version?: string
    platform?: string
    colorScheme?: 'light' | 'dark'
    themeParams?: Record<string, string>
    isExpanded?: boolean
    ready: () => void
    expand?: () => void
    close?: () => void
    setHeaderColor?: (color: string) => void
    setBackgroundColor?: (color: string) => void
    disableVerticalSwipes?: () => void
    onEvent?: (event: string, handler: (...args: any[]) => void) => void
    offEvent?: (event: string, handler: (...args: any[]) => void) => void
    [key: string]: any
  }

  interface TelegramNamespace {
    Login?: TelegramLoginNamespace
    WebApp?: TelegramWebApp
  }

  interface Window {
    google?: GoogleNamespace
    Telegram?: TelegramNamespace
  }
}
