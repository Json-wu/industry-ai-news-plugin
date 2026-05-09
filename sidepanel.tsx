import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { AppHeader } from "./components/AppHeader"
import { BottomToolbar } from "./components/BottomToolbar"
import { NewsFeed } from "./components/NewsFeed"
import { OnboardingModal } from "./components/OnboardingModal"
import {
  type SettingsSnapshot,
  SettingsModal
} from "./components/SettingsModal"
import type { NewsBrief } from "./lib/briefs"
import type { ExtensionPrefsState } from "./lib/extension-preferences-sync"
import {
  clearSensitiveLocalPrefsAfterSignOut,
  pushExtensionPreferencesAfterLocalSave,
  syncExtensionPreferencesWithSupabase
} from "./lib/extension-preferences-sync"
import { type IndustryId, isIndustryId } from "./lib/industries"
import { enrichBriefsWithAiSummaries } from "./lib/ai-summarize"
import { clearNewsCache, loadNewsForIndustries } from "./lib/news-service"
import { type ReminderMode, parseReminderMode } from "./lib/reminders"
import { STORAGE } from "./lib/storage-keys"
import { getSupabase } from "./lib/supabase"
import { applyThemeToDocument, parseUiTheme, type UiTheme } from "./lib/theme"

import "./style.css"

function SidePanel() {
  const [ready, setReady] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(true)
  const [selected, setSelected] = useState<IndustryId[]>([])
  const [isPro, setIsPro] = useState(false)
  const [reminderMode, setReminderMode] = useState(
    parseReminderMode(undefined)
  )
  const [email, setEmail] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uiTheme, setUiTheme] = useState<UiTheme>(parseUiTheme(undefined))
  const [newsItems, setNewsItems] = useState<NewsBrief[]>([])
  const [newsLoad, setNewsLoad] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle")
  const [newsSource, setNewsSource] = useState<"live" | "mock">("live")
  const [newsError, setNewsError] = useState<string | undefined>(undefined)
  const [newsMockOnly, setNewsMockOnly] = useState(false)
  const [digestFocusNewsId, setDigestFocusNewsId] = useState<string | null>(
    null
  )
  const [emailDigestOptOut, setEmailDigestOptOut] = useState(false)
  const newsMockOnlyRef = useRef(newsMockOnly)
  newsMockOnlyRef.current = newsMockOnly

  const selectedKey = useMemo(
    () => [...selected].sort().join(","),
    [selected]
  )

  const buildPrefsState = useCallback(
    (patch: Partial<ExtensionPrefsState> = {}): ExtensionPrefsState => ({
      onboardingComplete: patch.onboardingComplete ?? onboardingComplete,
      industrySelectionIds:
        patch.industrySelectionIds ?? selected,
      isPro: patch.isPro ?? isPro,
      reminderMode: patch.reminderMode ?? reminderMode,
      reminderEmail: patch.reminderEmail ?? email,
      newsMockOnly: patch.newsMockOnly ?? newsMockOnly,
      uiTheme: patch.uiTheme ?? uiTheme,
      emailDigestOptOut: patch.emailDigestOptOut ?? emailDigestOptOut
    }),
    [
      onboardingComplete,
      selected,
      isPro,
      reminderMode,
      email,
      newsMockOnly,
      uiTheme,
      emailDigestOptOut
    ]
  )

  const applySyncedPrefs = useCallback((s: ExtensionPrefsState) => {
    const prevMock = newsMockOnlyRef.current
    const ob = s.onboardingComplete
    setOnboardingComplete(ob)
    setSelected(s.industrySelectionIds)
    setIsPro(s.isPro)
    setReminderMode(s.reminderMode)
    setEmail(s.reminderEmail)
    setNewsMockOnly(s.newsMockOnly)
    setEmailDigestOptOut(s.emailDigestOptOut)
    setUiTheme(s.uiTheme)
    if (s.newsMockOnly !== prevMock) {
      clearNewsCache()
    }
    applyThemeToDocument(s.uiTheme)
  }, [])

  useLayoutEffect(() => {
    applyThemeToDocument(uiTheme)
  }, [uiTheme])

  useEffect(() => {
    void chrome.storage.local.get(STORAGE.pendingDigestFocusNewsId, (r) => {
      const v = r[STORAGE.pendingDigestFocusNewsId]
      if (typeof v === "string" && v.length > 0) {
        setDigestFocusNewsId(v)
      }
    })
  }, [])

  useEffect(() => {
    const onStorageLocal = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local") {
        return
      }
      const ch = changes[STORAGE.pendingDigestFocusNewsId]
      if (
        ch?.newValue !== undefined &&
        typeof ch.newValue === "string" &&
        ch.newValue.length > 0
      ) {
        setDigestFocusNewsId(ch.newValue)
      }
    }
    chrome.storage.onChanged.addListener(onStorageLocal)
    return () => chrome.storage.onChanged.removeListener(onStorageLocal)
  }, [])

  const clearDigestFocus = useCallback(() => {
    setDigestFocusNewsId(null)
    void chrome.storage.local.remove(STORAGE.pendingDigestFocusNewsId)
  }, [])

  useEffect(() => {
    void chrome.storage.sync.get(
      [
        STORAGE.onboardingComplete,
        STORAGE.industrySelectionIds,
        STORAGE.isPro,
        STORAGE.reminderMode,
        STORAGE.reminderEmail,
        STORAGE.uiTheme,
        STORAGE.newsMockOnly,
        STORAGE.emailDigestOptOut,
        STORAGE.prefsLastLocalWriteAt
      ],
      (r: Record<string, unknown>) => {
        const ob = r[STORAGE.onboardingComplete]
        const raw = r[STORAGE.industrySelectionIds]
        const hadIndustries =
          Array.isArray(raw) &&
          raw.some((x) => typeof x === "string" && isIndustryId(x))
        if (ob === true || hadIndustries) {
          setOnboardingComplete(true)
        } else {
          setOnboardingComplete(false)
        }
        if (Array.isArray(raw)) {
          setSelected(
            raw.filter(
              (x): x is IndustryId => typeof x === "string" && isIndustryId(x)
            )
          )
        }
        if (typeof r[STORAGE.isPro] === "boolean") {
          setIsPro(r[STORAGE.isPro] as boolean)
        }
        setReminderMode(parseReminderMode(r[STORAGE.reminderMode]))
        if (typeof r[STORAGE.reminderEmail] === "string") {
          setEmail(r[STORAGE.reminderEmail] as string)
        }
        setUiTheme(parseUiTheme(r[STORAGE.uiTheme]))
        setNewsMockOnly(r[STORAGE.newsMockOnly] === true)
        setEmailDigestOptOut(r[STORAGE.emailDigestOptOut] === true)
        setReady(true)
      }
    )
  }, [])

  useEffect(() => {
    if (!ready) {
      return
    }
    const supabase = getSupabase()
    if (!supabase) {
      return
    }
    void syncExtensionPreferencesWithSupabase(supabase).then((res) => {
      if (!res || res.source === "unchanged") {
        return
      }
      applySyncedPrefs(res.state)
    })
  }, [ready, applySyncedPrefs])

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      return
    }
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session
      ) {
        void syncExtensionPreferencesWithSupabase(supabase).then((res) => {
          if (!res || res.source === "unchanged") {
            return
          }
          applySyncedPrefs(res.state)
        })
      }
      if (event === "SIGNED_OUT") {
        void clearSensitiveLocalPrefsAfterSignOut().then(() => {
          setEmail("")
        })
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [applySyncedPrefs])

  useLayoutEffect(() => {
    if (!ready) {
      return
    }
    if (!onboardingComplete) {
      setNewsItems([])
      setNewsLoad("idle")
      setNewsError(undefined)
      return
    }
    if (selected.length === 0) {
      setNewsItems([])
      setNewsLoad("ok")
      setNewsError(undefined)
      return
    }
    setNewsLoad("loading")
  }, [ready, onboardingComplete, selectedKey, selected.length])

  useEffect(() => {
    if (!ready || !onboardingComplete) {
      return
    }
    if (selected.length === 0) {
      return
    }
    let cancelled = false
    void loadNewsForIndustries(selected, {
      mockOnly: newsMockOnly
    }).then((r) => {
      if (cancelled) {
        return
      }
      setNewsItems(r.items)
      setNewsSource(r.source)
      setNewsError(r.error)
      setNewsLoad("ok")
      if (cancelled || r.source !== "live") {
        return
      }
      const client = getSupabase()
      if (!client) {
        return
      }
      void enrichBriefsWithAiSummaries(client, r.items).then((enriched) => {
        if (cancelled) {
          return
        }
        setNewsItems(enriched)
      })
    })
    return () => {
      cancelled = true
    }
  }, [ready, onboardingComplete, selectedKey, selected, newsMockOnly])

  const persistAll = useCallback(
    (snap: {
      industries: IndustryId[]
      isPro: boolean
      reminderMode: ReminderMode
      email: string
      newsMockOnly: boolean
      emailDigestOptOut: boolean
    }) => {
      const iso = new Date().toISOString()
      void chrome.storage.sync.set({
        [STORAGE.industrySelectionIds]: snap.industries,
        [STORAGE.isPro]: snap.isPro,
        [STORAGE.reminderMode]: snap.reminderMode,
        [STORAGE.reminderEmail]: snap.email,
        [STORAGE.newsMockOnly]: snap.newsMockOnly,
        [STORAGE.emailDigestOptOut]: snap.emailDigestOptOut,
        [STORAGE.prefsLastLocalWriteAt]: iso
      })
    },
    []
  )

  const onThemeChange = useCallback((t: UiTheme) => {
    setUiTheme(t)
    const iso = new Date().toISOString()
    void chrome.storage.sync.set({
      [STORAGE.uiTheme]: t,
      [STORAGE.prefsLastLocalWriteAt]: iso
    })
    const supabase = getSupabase()
    if (supabase) {
      void pushExtensionPreferencesAfterLocalSave(
        supabase,
        buildPrefsState({ uiTheme: t })
      )
    }
  }, [buildPrefsState])

  const onOnboardingComplete = useCallback(
    (industries: IndustryId[]) => {
      setSelected(industries)
      setOnboardingComplete(true)
      const iso = new Date().toISOString()
      void chrome.storage.sync.set({
        [STORAGE.onboardingComplete]: true,
        [STORAGE.industrySelectionIds]: industries,
        [STORAGE.prefsLastLocalWriteAt]: iso
      })
      const supabase = getSupabase()
      if (supabase) {
        void pushExtensionPreferencesAfterLocalSave(
          supabase,
          buildPrefsState({
            onboardingComplete: true,
            industrySelectionIds: industries
          })
        )
      }
    },
    [buildPrefsState]
  )

  const settingsInitial = useMemo<SettingsSnapshot>(
    () => ({
      industries: selected,
      isPro,
      reminderMode,
      email,
      newsMockOnly,
      emailDigestOptOut
    }),
    [selected, isPro, reminderMode, email, newsMockOnly, emailDigestOptOut]
  )

  const onSettingsSave = useCallback(
    (next: SettingsSnapshot) => {
      if (next.newsMockOnly !== newsMockOnly) {
        clearNewsCache()
      }
      setSelected(next.industries)
      setIsPro(next.isPro)
      setReminderMode(next.reminderMode)
      setEmail(next.email)
      setNewsMockOnly(next.newsMockOnly)
      setEmailDigestOptOut(next.emailDigestOptOut)
      persistAll(next)
      const supabase = getSupabase()
      if (supabase) {
        void pushExtensionPreferencesAfterLocalSave(
          supabase,
          buildPrefsState({
            industrySelectionIds: next.industries,
            isPro: next.isPro,
            reminderMode: next.reminderMode,
            reminderEmail: next.email,
            newsMockOnly: next.newsMockOnly,
            emailDigestOptOut: next.emailDigestOptOut
          })
        )
      }
    },
    [newsMockOnly, persistAll, buildPrefsState]
  )

  const openInTab = useCallback((url: string) => {
    void chrome.tabs.create({ url, active: true })
  }, [])

  if (!ready) {
    return (
      <div className="flex h-screen w-full min-w-[260px] items-center justify-center bg-slate-50 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        加载中…
      </div>
    )
  }

  return (
    <div className="box-border flex h-screen min-h-0 w-full min-w-[260px] max-w-full flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader
        theme={uiTheme}
        onThemeChange={onThemeChange}
        onOpenMenu={() => setSettingsOpen(true)}
      />

      <NewsFeed
        items={newsItems}
        loadState={newsLoad}
        dataSource={newsSource}
        loadError={newsError}
        userChoseMockOnly={newsMockOnly}
        digestFocusNewsId={digestFocusNewsId}
        onDigestFocusConsumed={clearDigestFocus}
        onOpenUrl={openInTab}
      />

      <BottomToolbar onOpenSettings={() => setSettingsOpen(true)} />

      {!onboardingComplete ? (
        <OnboardingModal isPro={isPro} onComplete={onOnboardingComplete} />
      ) : null}

      <SettingsModal
        open={settingsOpen}
        initial={settingsInitial}
        onClose={() => setSettingsOpen(false)}
        onSave={onSettingsSave}
        onAfterSignOut={() => {
          setEmail("")
        }}
      />
    </div>
  )
}

export default SidePanel
