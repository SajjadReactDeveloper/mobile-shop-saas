'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Package, PhoneCall, ArrowRight, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'mss_onboarded_v1'

const STEPS = [
  {
    icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    title: 'Welcome to Mobile Shop SaaS! 🎉',
    desc: 'Your shop is all set up. Let\'s take a quick 30-second tour to help you get started.',
    tip: null,
  },
  {
    icon: ShoppingCart,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    title: 'Make your first sale',
    desc: 'Go to Sales / POS to ring up a customer. Add items to cart, choose a payment method, and complete the sale in seconds.',
    tip: '💡 You can record cash, Easypaisa, JazzCash, bank transfer, or udhaar (credit).',
  },
  {
    icon: Package,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    title: 'Add your inventory',
    desc: 'Head to Inventory to add your products. Enable IMEI tracking for mobiles — each unit gets its own serial number.',
    tip: '💡 Set a low-stock threshold so you get alerts before running out.',
  },
  {
    icon: PhoneCall,
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
    title: 'Track Easy Load & Easypaisa',
    desc: 'Add your SIM accounts under Easy Load and your agent wallet under Easypaisa. Every transaction is tracked automatically.',
    tip: '💡 The daily cash register auto-adds your easy load and Easypaisa income.',
  },
]

export function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so it doesn't flash on every navigation
    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/25 overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all">
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-8 pt-10 pb-8">
          {/* Icon */}
          <div className={`w-14 h-14 ${current.iconBg} rounded-2xl flex items-center justify-center shadow-lg mb-6`}>
            <Icon className="w-7 h-7 text-white" />
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-violet-600 w-6' : i < step ? 'bg-violet-300 w-3' : 'bg-gray-200 w-3'}`}
              />
            ))}
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-3 leading-tight">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{current.desc}</p>

          {current.tip && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-800 mb-4">
              {current.tip}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
              Skip tour
            </button>
            <div className="flex-1" />
            <button onClick={next}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200">
              {isLast ? 'Get started' : 'Next'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
