'use client'

import React from 'react'
import { X, Loader2 } from 'lucide-react'

/* ─────────────────────────────────────────────
   Button
───────────────────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type BtnSize = 'sm' | 'md' | 'lg'

const btnBase = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.97] focus-visible:ring-violet-500 shadow-sm shadow-violet-200',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] focus-visible:ring-gray-300 shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] focus-visible:ring-red-500 shadow-sm shadow-red-200',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] focus-visible:ring-gray-300',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.97] focus-visible:ring-emerald-500 shadow-sm shadow-emerald-200',
}
const btnSizes: Record<BtnSize, string> = {
  sm:  'h-8 px-3 text-xs',
  md:  'h-9 px-4 text-sm',
  lg:  'h-11 px-6 text-sm',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Input / Textarea / Select
───────────────────────────────────────────── */
const inputBase = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 disabled:opacity-50 disabled:bg-gray-50'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <input className={`${inputBase} ${error ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400' : ''} ${className}`} {...props} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}
export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <select className={`${inputBase} ${className}`} {...props}>{children}</select>
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>}
      <textarea className={`${inputBase} resize-none ${className}`} {...props} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card
───────────────────────────────────────────── */
interface CardProps { children: React.ReactNode; className?: string; padding?: boolean }
export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Badge
───────────────────────────────────────────── */
type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange' | 'cyan' | 'pink'
const badgeColors: Record<BadgeColor, string> = {
  blue:   'bg-blue-50 text-blue-700 ring-blue-200',
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red:    'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  gray:   'bg-gray-100 text-gray-600 ring-gray-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  cyan:   'bg-cyan-50 text-cyan-700 ring-cyan-200',
  pink:   'bg-pink-50 text-pink-700 ring-pink-200',
}
interface BadgeProps { color?: BadgeColor; children: React.ReactNode; className?: string }
export function Badge({ color = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${badgeColors[color]} ${className}`}>
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
const modalSizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${modalSizes[size]} bg-white rounded-2xl shadow-2xl shadow-black/20 flex flex-col max-h-[90vh] ring-1 ring-black/5`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg p-1.5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Stat card
───────────────────────────────────────────── */
interface StatProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  iconColor?: string
  trend?: { value: number; up: boolean }
}
export function Stat({ label, value, sub, icon: Icon, color, iconColor, trend }: StatProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
          <Icon className={`w-5 h-5 ${iconColor ?? 'text-current'}`} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend.up ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</div>
        <div className="text-sm font-medium text-gray-500 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   Page Header
───────────────────────────────────────────── */
interface PageHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Empty State
───────────────────────────────────────────── */
interface EmptyProps { icon: string; title: string; desc: string; action?: React.ReactNode }
export function Empty({ icon, title, desc, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-5 leading-relaxed">{desc}</p>
      {action}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Table helpers
───────────────────────────────────────────── */
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}
export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 bg-gray-50/80 first:rounded-tl-none last:rounded-tr-none ${className}`}>
      {children}
    </th>
  )
}
export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-5 py-3.5 text-gray-700 border-b border-gray-50 ${className}`}>
      {children}
    </td>
  )
}

/* ─────────────────────────────────────────────
   Spinner / Loading
───────────────────────────────────────────── */
export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-violet-500 ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner className="w-7 h-7" />
      <span className="text-xs text-gray-400 font-medium">Loading…</span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Skeleton Loaders
───────────────────────────────────────────── */
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

/** Generic shimmer block — set width/height via className */
export function Skeleton({ className = '' }: { className?: string }) {
  return <Sk className={className} />
}

/** Stat card grid skeleton (Dashboard / Reports) */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <Sk className="w-11 h-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-3/4" />
            <Sk className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Table skeleton — header row + data rows */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  const widths = ['w-2/5', 'w-1/4', 'w-1/5', 'w-1/4', 'w-1/6']
  return (
    <div className="overflow-hidden">
      {/* header */}
      <div className="flex gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, i) => (
          <Sk key={i} className={`h-3 rounded-md ${widths[i % widths.length]}`} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center px-5 py-4 border-b border-gray-50">
          <div className="flex-1 space-y-1.5">
            <Sk className="h-4 w-3/5" />
            <Sk className="h-3 w-2/5" />
          </div>
          {Array.from({ length: cols - 1 }).map((__, c) => (
            <Sk key={c} className={`h-4 rounded-lg ${widths[(c + 1) % widths.length]}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** List skeleton — avatar + two text lines per row (Customers, Repairs, Staff) */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Sk className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-1/3" />
            <Sk className="h-3 w-1/4" />
          </div>
          <Sk className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Account card stack skeleton (EasyLoad, Easypaisa) */
export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sk className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Sk className="h-5 w-24 ml-auto" />
              <Sk className="h-3 w-16 ml-auto" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Sk className="h-8 flex-1 rounded-xl" />
            <Sk className="h-8 flex-1 rounded-xl" />
            <Sk className="h-8 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Dashboard page skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-6 w-44" />
        <Sk className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-20 rounded-xl" />)}
      </div>
      <StatsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <Sk className="h-4 w-28" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="flex justify-between items-center py-2 border-b border-gray-50">
                <Sk className="h-4 w-2/5" />
                <Sk className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Tabs
───────────────────────────────────────────── */
interface TabsProps { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl w-fit border border-gray-200/60">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
            active === t.key
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              active === t.key ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
