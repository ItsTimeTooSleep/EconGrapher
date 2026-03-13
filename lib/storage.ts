import type { Session, Message, ApiSettings, ApiParameters } from './types'
import { DEFAULT_PARAMETERS } from './types'

const DB_NAME = 'econchart_db'
const DB_VERSION = 1
const SESSIONS_STORE = 'sessions'
const MESSAGES_STORE = 'messages'

let db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
        const ss = database.createObjectStore(SESSIONS_STORE, { keyPath: 'id' })
        ss.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
        const ms = database.createObjectStore(MESSAGES_STORE, { keyPath: 'id' })
        ms.createIndex('sessionId', 'sessionId', { unique: false })
        ms.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    req.onsuccess = (e) => { db = (e.target as IDBOpenDBRequest).result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

function txGet<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  }))
}

function txPut(store: string, value: unknown): Promise<void> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

function txDelete(store: string, key: string): Promise<void> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

function txGetAll<T>(store: string): Promise<T[]> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  }))
}

function txGetByIndex<T>(store: string, index: string, value: string): Promise<T[]> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly')
    const req = tx.objectStore(store).index(index).getAll(value)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  }))
}

function txClear(store: string): Promise<void> {
  return openDB().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite')
    const req = tx.objectStore(store).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

// Sessions
export async function getSessions(): Promise<Session[]> {
  const all = await txGetAll<Session>(SESSIONS_STORE)
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}
export const saveSession = (s: Session) => txPut(SESSIONS_STORE, s)
export const deleteSession = (id: string) => txDelete(SESSIONS_STORE, id)
export async function clearAllSessions() {
  await txClear(SESSIONS_STORE)
  await txClear(MESSAGES_STORE)
}

// Messages
export async function getMessages(sessionId: string): Promise<Message[]> {
  const msgs = await txGetByIndex<Message>(MESSAGES_STORE, 'sessionId', sessionId)
  return msgs.sort((a, b) => a.timestamp - b.timestamp)
}
export const saveMessage = (m: Message) => txPut(MESSAGES_STORE, m)
export async function deleteSessionMessages(sessionId: string) {
  const msgs = await getMessages(sessionId)
  for (const m of msgs) await txDelete(MESSAGES_STORE, m.id)
}

// API Settings (localStorage with simple obfuscation)
const API_SETTINGS_KEY = 'econchart_api_settings'

/**
 * 获取 API 设置
 * @returns API 设置对象，如果不存在则返回 null
 */
export function getApiSettings(): ApiSettings | null {
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY)
    if (!raw) return null
    const settings = JSON.parse(atob(raw)) as ApiSettings
    
    if (!settings.parameters) {
      settings.parameters = { ...DEFAULT_PARAMETERS }
    } else {
      settings.parameters = {
        ...DEFAULT_PARAMETERS,
        ...settings.parameters
      }
    }
    
    return settings
  } catch { return null }
}

/**
 * 保存 API 设置
 * @param settings - API 设置对象
 */
export function saveApiSettings(settings: ApiSettings): void {
  const settingsToSave: ApiSettings = {
    ...settings,
    parameters: {
      ...DEFAULT_PARAMETERS,
      ...settings.parameters
    }
  }
  localStorage.setItem(API_SETTINGS_KEY, btoa(JSON.stringify(settingsToSave)))
}

/**
 * 清除 API 设置
 */
export function clearApiSettings(): void {
  localStorage.removeItem(API_SETTINGS_KEY)
}

/**
 * 重置 API 参数为默认值
 * @param settings - 当前 API 设置
 * @returns 重置参数后的设置
 */
export function resetApiParameters(settings: ApiSettings): ApiSettings {
  return {
    ...settings,
    parameters: { ...DEFAULT_PARAMETERS }
  }
}

/**
 * 更新 API 参数
 * @param settings - 当前 API 设置
 * @param params - 要更新的参数
 * @returns 更新后的设置
 */
export function updateApiParameters(
  settings: ApiSettings, 
  params: Partial<ApiParameters>
): ApiSettings {
  return {
    ...settings,
    parameters: {
      ...DEFAULT_PARAMETERS,
      ...settings.parameters,
      ...params
    }
  }
}
