'use client'

import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'

import { formatGs } from '@/lib/format'
import { getInstallmentOptions } from '@/lib/pricing'

export function InstallmentBreakdown({
  price,
  compareAtPrice,
}: {
  price: number
  compareAtPrice?: number | null
}) {
  const [open, setOpen] = useState(false)
  const options = getInstallmentOptions(price, compareAtPrice)
  const featured = options[options.length - 1]

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
            Opciones de cuotas
          </p>
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {featured.count}x {formatGs(featured.perInstallment)}
          </p>
        </div>
        <CaretDown
          size={18}
          weight="bold"
          className={`shrink-0 text-neutral-600 transition-transform dark:text-neutral-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
          {options.map((option) => (
            <div
              key={option.count}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="text-neutral-700 dark:text-neutral-200">{option.count} cuotas</span>
              <span className="flex items-center gap-2">
                {option.perInstallmentListPrice && (
                  <span className="text-neutral-500 line-through dark:text-neutral-400">
                    {formatGs(option.perInstallmentListPrice)}
                  </span>
                )}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatGs(option.perInstallment)}
                </span>
              </span>
            </div>
          ))}
          <p className="py-2 text-[13px] text-neutral-600 dark:text-neutral-300">
            Montos de referencia. Consultá las condiciones de financiación en el local.
          </p>
        </div>
      )}
    </div>
  )
}
