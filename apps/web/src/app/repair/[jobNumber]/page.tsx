'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const STATUS_STEPS = [
  'RECEIVED',
  'DIAGNOSING',
  'AWAITING_PARTS',
  'IN_REPAIR',
  'READY',
  'DELIVERED',
] as const
type RepairStatus = (typeof STATUS_STEPS)[number]

const STATUS_LABEL: Record<RepairStatus, string> = {
  RECEIVED:       'Received',
  DIAGNOSING:     'Diagnosing',
  AWAITING_PARTS: 'Awaiting Parts',
  IN_REPAIR:      'In Repair',
  READY:          'Ready for Pickup ✅',
  DELIVERED:      'Delivered',
}

const STATUS_DESC: Record<RepairStatus, string> = {
  RECEIVED:       'We have received your device and it is in the queue.',
  DIAGNOSING:     'Our technician is diagnosing the issue with your device.',
  AWAITING_PARTS: 'We are waiting for the required parts to arrive.',
  IN_REPAIR:      'Your device is currently being repaired.',
  READY:          'Your device is repaired and ready for pickup. Please visit us!',
  DELIVERED:      'Your device has been delivered. Thank you for choosing us!',
}

interface TrackData {
  jobNumber: string
  deviceBrand: string
  deviceModel: string
  status: RepairStatus
  faultDesc: string
  createdAt: string
  deliveredAt: string | null
  shop: { name: string; city?: string }
}

export default function RepairTrackingPage() {
  const params = useParams<{ jobNumber: string }>()
  const [data, setData] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!params.jobNumber) return
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'https://mobile-shop-saas.onrender.com/api/v1'}/repairs/track/${params.jobNumber}`,
    )
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: TrackData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.jobNumber])

  const stepIndex = data ? STATUS_STEPS.indexOf(data.status) : -1

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">📱</div>
        <h1 className="text-2xl font-extrabold text-violet-700">Repair Status Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Job #{params.jobNumber}</p>
      </div>

      <div className="w-full max-w-md">
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Looking up your repair…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="font-bold text-gray-900 mb-1">Job Not Found</h2>
            <p className="text-sm text-gray-500">No repair job found for #{params.jobNumber}. Please check the job number and try again.</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Shop + Device Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{data.shop.name}{data.shop.city ? ` · ${data.shop.city}` : ''}</p>
                  <h2 className="text-lg font-extrabold text-gray-900 mt-0.5">{data.deviceBrand} {data.deviceModel}</h2>
                  <p className="text-sm text-gray-500 mt-1">{data.faultDesc}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  data.status === 'READY' ? 'bg-green-100 text-green-700' :
                  data.status === 'DELIVERED' ? 'bg-gray-100 text-gray-500' :
                  'bg-violet-100 text-violet-700'
                }`}>
                  {STATUS_LABEL[data.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Received: {new Date(data.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                {data.deliveredAt && ` · Delivered: ${new Date(data.deliveredAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>

            {/* Status progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Repair Progress</h3>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = i < stepIndex
                  const active = i === stepIndex
                  const future = i > stepIndex
                  return (
                    <div key={step} className="flex gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          active ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' :
                          done   ? 'bg-emerald-500 text-white' :
                                   'bg-gray-100 text-gray-300'
                        }`}>
                          {done ? '✓' : active ? '●' : String(i + 1)}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-6 ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      {/* Label */}
                      <div className="pb-5">
                        <p className={`text-sm font-semibold ${active ? 'text-violet-700' : done ? 'text-emerald-700' : future ? 'text-gray-300' : 'text-gray-900'}`}>
                          {STATUS_LABEL[step]}
                        </p>
                        {active && (
                          <p className="text-xs text-gray-500 mt-0.5">{STATUS_DESC[step]}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {data.status === 'READY' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <p className="font-bold text-green-800">Your device is ready!</p>
                <p className="text-sm text-green-700 mt-1">Please visit <strong>{data.shop.name}</strong> to collect your device.</p>
              </div>
            )}
          </>
        )}

        <p className="text-xs text-center text-gray-400 mt-6">
          Powered by <span className="font-semibold text-violet-500">Mobile Shop</span>
        </p>
      </div>
    </div>
  )
}
