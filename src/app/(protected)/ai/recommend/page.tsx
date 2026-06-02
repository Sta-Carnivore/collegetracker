'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

interface Recommendation {
  school_name: string
  match_type: 'likely' | 'match' | 'reach'
  match_score: number
  rationale: string
  strengths: string
  concerns: string
}

const matchColors = {
  likely: 'bg-green-900/40 border-green-700 text-green-300',
  match: 'bg-blue-900/40 border-blue-700 text-blue-300',
  reach: 'bg-orange-900/40 border-orange-700 text-orange-300',
}

export default function RecommendPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPro, setIsPro] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('is_pro').eq('id', user.id).single()
          .then(({ data }) => setIsPro(data?.is_pro ?? false))
      }
    })
  }, [supabase])

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/ai/recommend', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else setRecommendations(data.recommendations)
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">School Recommender</h1>
          <p className="text-gray-400 text-sm mt-1">
            AI matches your profile to the best-fit schools.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={loading || !isPro}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Generating...' : 'Generate Recommendations'}
        </Button>
      </div>

      {!isPro && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 text-yellow-300 text-sm">
          This feature requires a Pro subscription.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="border border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-blue-400">AI is analyzing your profile...</p>
          <p className="text-gray-500 text-sm mt-2">This may take 15-30 seconds</p>
        </div>
      )}

      {recommendations.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex gap-4 text-xs text-gray-500 mb-2">
            <span className="text-green-400">● Likely</span>
            <span className="text-blue-400">● Match</span>
            <span className="text-orange-400">● Reach</span>
          </div>
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{rec.school_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${matchColors[rec.match_type]}`}>
                      {rec.match_type.charAt(0).toUpperCase() + rec.match_type.slice(1)}
                    </span>
                    <span className="text-gray-500 text-xs">Fit score: {rec.match_score}/10</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-600">#{i + 1}</div>
              </div>

              <p className="text-gray-300 text-sm mb-4">{rec.rationale}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900/20 border border-green-900 rounded-xl p-3">
                  <p className="text-green-400 text-xs font-medium mb-1">Strengths</p>
                  <p className="text-gray-300 text-xs">{rec.strengths}</p>
                </div>
                <div className="bg-red-900/20 border border-red-900 rounded-xl p-3">
                  <p className="text-red-400 text-xs font-medium mb-1">Watch out</p>
                  <p className="text-gray-300 text-xs">{rec.concerns}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recommendations.length === 0 && !loading && !error && isPro && (
        <div className="border-2 border-dashed border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-gray-500">Click "Generate Recommendations" to get your personalized school list.</p>
          <p className="text-gray-600 text-xs mt-2">Make sure you've uploaded your resume first.</p>
        </div>
      )}
    </div>
  )
}
