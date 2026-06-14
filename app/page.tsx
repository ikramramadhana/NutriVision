'use client'

import { useState, useRef, useCallback } from 'react'

interface DetectedFood { name: string; portion: string; confidence: number }
interface NutritionTotal { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; sugar_g: number; sodium_mg: number }
interface NutritionPerFood { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }
interface DietInfo { compatible: boolean; reason: string }
interface ScanResult {
  detected_foods: DetectedFood[]
  total_nutrition: NutritionTotal
  nutrition_per_food: NutritionPerFood[]
  health_score: number
  health_score_reason: string
  diet_compatibility: Record<string, DietInfo>
  benefits: string[]
  warnings: string[]
  suggestions: string[]
  meal_type: string
  cuisine: string
}

const dietIcons: Record<string, string> = {
  keto: '🥑', vegan: '🌱', vegetarian: '🥗', low_carb: '📉', high_protein: '💪', mediterranean: '🫒'
}

function HealthRing({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? '#22c55e' : score >= 6 ? '#84cc16' : score >= 4 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${color} 0% ${pct}%, rgba(255,255,255,0.25) ${pct}% 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>
        {score}
      </div>
    </div>
  )
}

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [activeTab, setActiveTab] = useState<'nutrition' | 'diet' | 'tips'>('nutrition')
  const [cameraMode, setCameraMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setImageFile(file)
    setError('')
    setResult(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCameraMode(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch {
      setError('Camera access denied. Please allow camera permission or upload a photo instead.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraMode(false)
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      handleImage(file)
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  async function analyze() {
    if (!imageFile) return
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('image', imageFile)
    try {
      const r = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data.result)
      setActiveTab('nutrition')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
    setLoading(false)
  }

  function reset() { setResult(null); setPreview(null); setImageFile(null); setError('') }

  const macros = result ? [
    { label: 'Protein', value: result.total_nutrition.protein_g, icon: '🍗', bg: '#dbeafe', fg: '#1e3a8a', sub: '#3b82f6' },
    { label: 'Carbs', value: result.total_nutrition.carbs_g, icon: '🍞', bg: '#fef3c7', fg: '#78350f', sub: '#d97706' },
    { label: 'Fat', value: result.total_nutrition.fat_g, icon: '💧', bg: '#fce7f3', fg: '#831843', sub: '#db2777' },
  ] : []

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
            🥗
          </div>
          <span className="font-bold text-base tracking-tight">NutriVision</span>
        </div>
        <a href="https://github.com/ikramramadhana" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#94a3b8' }}>
          <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          @ikramramadhana
        </a>
      </nav>

      <main className="max-w-md mx-auto px-4 py-6">

        {/* Hero — only when no result */}
        {!result && !cameraMode && (
          <div className="text-center mb-8 pt-4">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-5" style={{ background: '#fef3c7', color: '#92400e' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
              Powered by Gemini Vision AI
            </div>
            <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#0f172a' }}>
              Snap your meal,
              <span className="block" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                know what's inside
              </span>
            </h1>
            <p className="text-sm max-w-xs mx-auto" style={{ color: '#64748b' }}>
              Instant calories, macros, and diet compatibility — just from a photo.
            </p>
          </div>
        )}

        {/* Camera mode */}
        {cameraMode && (
          <div className="mb-6">
            <div className="relative rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(15,23,42,0.08)' }}>
              <video ref={videoRef} autoPlay playsInline className="w-full" style={{ maxHeight: '360px', objectFit: 'cover', background: '#000' }} />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 rounded-2xl" style={{ border: '2px solid rgba(249,115,22,0.6)' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={stopCamera} className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
                style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', color: '#64748b' }}>
                Cancel
              </button>
              <button onClick={capturePhoto} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
                📸 Capture
              </button>
            </div>
          </div>
        )}

        {/* Upload area */}
        {!result && !cameraMode && (
          <>
            <div
              className="relative rounded-3xl overflow-hidden mb-4 cursor-pointer transition-all duration-300"
              style={{
                border: `2px dashed ${dragOver ? '#f97316' : preview ? 'transparent' : 'rgba(15,23,42,0.12)'}`,
                background: dragOver ? '#fff7ed' : preview ? 'transparent' : 'white',
                minHeight: preview ? 'auto' : '200px',
              }}
              onClick={() => !preview && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]) }}
            >
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Food preview" className="w-full rounded-3xl" style={{ maxHeight: '280px', objectFit: 'cover' }} />
                  <button onClick={e => { e.stopPropagation(); reset() }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs text-white transition-all hover:scale-110"
                    style={{ background: 'rgba(15,23,42,0.5)' }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #fed7aa, #fbcfe8)' }}>🍽️</div>
                  <div className="text-center">
                    <p className="font-semibold text-sm mb-1">Drop your food photo here</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>or use the buttons below</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />

            {!preview && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => fileRef.current?.click()}
                  className="py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', color: '#475569' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Photo
                </button>
                <button onClick={startCamera}
                  className="py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-white"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Open Camera
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm flex items-center gap-2" style={{ background: '#fef2f2', color: '#b91c1c' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Scan button */}
        {!result && !cameraMode && preview && (
          <button onClick={analyze} disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100"
            style={{ background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Analyzing your meal...
              </span>
            ) : '✨ Scan Nutrition'}
          </button>
        )}

        {/* ══ RESULTS ══ */}
        {result && (
          <div className="space-y-3">

            {/* Photo with overlay */}
            {preview && (
              <div className="relative rounded-3xl overflow-hidden" style={{ height: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Scanned food" className="w-full h-full" style={{ objectFit: 'cover' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5))' }} />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{result.detected_foods.map(f => f.name).join(', ')}</p>
                    <p className="text-white text-xs opacity-80">{result.meal_type.charAt(0).toUpperCase() + result.meal_type.slice(1)} · {result.cuisine}</p>
                  </div>
                  <button onClick={reset} className="text-xs px-3 py-1.5 rounded-full text-white shrink-0" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    New scan
                  </button>
                </div>
              </div>
            )}

            {/* Hero gradient: calories + health score */}
            <div className="rounded-2xl p-5 flex items-baseline justify-between text-white" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 60%, #8b5cf6 100%)' }}>
              <div>
                <p className="text-4xl font-bold leading-none">{result.total_nutrition.calories}</p>
                <p className="text-xs opacity-85 mt-1.5">total calories</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold leading-none">{result.health_score}<span className="text-xs opacity-75">/10</span></p>
                  <p className="text-xs opacity-85 mt-1.5">health score</p>
                </div>
                <HealthRing score={result.health_score} />
              </div>
            </div>

            {/* Macro cards */}
            <div className="grid grid-cols-3 gap-2">
              {macros.map(m => (
                <div key={m.label} className="rounded-xl p-2.5 text-center" style={{ background: m.bg }}>
                  <p className="text-base">{m.icon}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: m.fg }}>{m.value}g</p>
                  <p className="text-[10px]" style={{ color: m.sub }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Verdict */}
            <div className="rounded-2xl p-3.5 bg-white" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
              <p className="text-sm font-semibold mb-0.5">✨ {result.health_score >= 7 ? 'Pretty balanced!' : result.health_score >= 4 ? 'Could be better' : 'Heads up'}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{result.health_score_reason}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
              {([['nutrition', 'Nutrition'], ['diet', 'Diet Fit'], ['tips', 'Tips']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={activeTab === id
                    ? { background: 'linear-gradient(135deg, #f97316, #ec4899)', color: 'white' }
                    : { color: '#94a3b8' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Nutrition tab */}
            {activeTab === 'nutrition' && (
              <div className="space-y-2">
                <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Other nutrients</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Fiber', value: result.total_nutrition.fiber_g, unit: 'g' },
                      { label: 'Sugar', value: result.total_nutrition.sugar_g, unit: 'g' },
                      { label: 'Sodium', value: result.total_nutrition.sodium_mg, unit: 'mg' },
                    ].map(n => (
                      <div key={n.label}>
                        <p className="text-base font-bold">{n.value}<span className="text-xs" style={{ color: '#94a3b8' }}>{n.unit}</span></p>
                        <p className="text-[11px]" style={{ color: '#94a3b8' }}>{n.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.nutrition_per_food.length > 1 && (
                  <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Per item</p>
                    <div className="space-y-2">
                      {result.nutrition_per_food.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5" style={{ borderBottom: i < result.nutrition_per_food.length - 1 ? '1px solid rgba(15,23,42,0.04)' : 'none' }}>
                          <span className="font-medium">{f.name}</span>
                          <div className="flex gap-2" style={{ color: '#94a3b8' }}>
                            <span style={{ color: '#f97316', fontWeight: 600 }}>{f.calories} kcal</span>
                            <span>P{f.protein_g}</span>
                            <span>C{f.carbs_g}</span>
                            <span>F{f.fat_g}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diet tab */}
            {activeTab === 'diet' && (
              <div className="space-y-2">
                {Object.entries(result.diet_compatibility).map(([diet, info]) => (
                  <div key={diet} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white" style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: info.compatible ? '#dcfce7' : '#fee2e2' }}>
                      {dietIcons[diet] || '🍽️'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize">{diet.replace('_', ' ')}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                          background: info.compatible ? '#dcfce7' : '#fee2e2',
                          color: info.compatible ? '#166534' : '#991b1b',
                        }}>
                          {info.compatible ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{info.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips tab */}
            {activeTab === 'tips' && (
              <div className="space-y-2">
                {result.benefits.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: '#f0fdf4' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#16a34a' }}>Benefits</p>
                    <div className="space-y-1.5">
                      {result.benefits.map((b, i) => (
                        <p key={i} className="text-sm" style={{ color: '#15803d' }}>✓ {b}</p>
                      ))}
                    </div>
                  </div>
                )}
                {result.warnings.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: '#fffbeb' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#d97706' }}>Heads up</p>
                    <div className="space-y-1.5">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-sm" style={{ color: '#b45309' }}>⚠ {w}</p>
                      ))}
                    </div>
                  </div>
                )}
                {result.suggestions.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: '#faf5ff' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#9333ea' }}>Suggestions</p>
                    <div className="space-y-1.5">
                      {result.suggestions.map((s, i) => (
                        <p key={i} className="text-sm" style={{ color: '#7e22ce' }}>→ {s}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[10px] mt-10" style={{ color: '#cbd5e1' }}>
          NutriVision · built by{' '}
          <a href="https://github.com/ikramramadhana" target="_blank" className="hover:text-orange-500 transition-colors">@ikramramadhana</a>
          {' '}· AI estimates, not medical advice.
        </p>
      </main>
    </div>
  )
}
