/* global process */
import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
}

/** 우선 시도할 모델 ID 목록 (중복 제거). 429/404 시 다음 모델로 넘어감. */
export function listGeminiModelCandidates() {
  const primary = getGeminiModel()
  const extraFromEnv = (process.env.GEMINI_EXTRA_MODELS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  // 무료 티어에서 모델별 쿼터가 달라, 2.0-flash가 0이어도 lite/2.5 등은 동작하는 경우가 있음
  const builtinFallbacks = [
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ]
  const out = []
  const add = (id) => {
    if (id && !out.includes(id)) out.push(id)
  }
  add(primary)
  for (const id of extraFromEnv) add(id)
  for (const id of builtinFallbacks) add(id)
  return out
}

/** 주 키 → 보조 키 순. 동일 문자열은 한 번만. */
export function listGeminiApiKeys() {
  const primary = (process.env.GEMINI_API_KEY || '').trim()
  const fallback = (process.env.GEMINI_API_KEY_FALLBACK || '').trim()
  const keys = []
  if (primary) keys.push(primary)
  if (fallback && fallback !== primary) keys.push(fallback)
  return keys
}

export function isGeminiQuotaExceeded(err) {
  const msg = String(err?.message || '').toLowerCase()
  return (
    err?.status === 429 ||
    msg.includes('quota exceeded') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit')
  )
}

function isModelUnavailable(err) {
  const msg = String(err?.message || '')
  return (
    err?.status === 404 ||
    msg.includes('not found for API version') ||
    (msg.includes('not found') && msg.includes('models/'))
  )
}

/**
 * API 키 순회 + 모델 순회. 429·404(미지원 모델)면 다음 후보 시도.
 */
export async function generateContentWithKeyRotation({ prompt, generationConfig }) {
  const keys = listGeminiApiKeys()
  if (!keys.length) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  const models = listGeminiModelCandidates()
  let lastErr

  for (let ki = 0; ki < keys.length; ki++) {
    const key = keys[ki]
    const genAI = new GoogleGenerativeAI(key)
    for (let mi = 0; mi < models.length; mi++) {
      const modelId = models[mi]
      try {
        const model = genAI.getGenerativeModel({
          model: modelId,
          generationConfig: generationConfig || {},
        })
        const result = await model.generateContent(prompt)
        if (ki > 0 || mi > 0) {
          console.warn(`[gemini] 대체 경로 성공 (키 #${ki + 1}, 모델 ${modelId})`)
        }
        return result
      } catch (err) {
        lastErr = err
        if (isGeminiQuotaExceeded(err) || isModelUnavailable(err)) {
          const tag = isGeminiQuotaExceeded(err) ? '429' : '404'
          console.warn(`[gemini] 모델 ${modelId} 실패 (${tag}) — 다음 후보 시도`)
          continue
        }
        throw err
      }
    }
    if (ki < keys.length - 1) {
      console.warn('[gemini] 이 키로 모든 모델 실패 — GEMINI_API_KEY_FALLBACK으로 재시도')
    }
  }

  throw lastErr
}
