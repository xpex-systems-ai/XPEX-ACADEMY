import Link from 'next/link'
import React from 'react'

function Watermark() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Link
        href="/"
        aria-label="XpeX Academy"
        className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-[#07111F]/90 px-3 py-2 text-xs font-black text-white shadow-[0_16px_45px_rgba(0,0,0,.35)] backdrop-blur-lg"
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#FF7A00] text-[9px] text-[#0B1220]">XP</span>
        <span>XpeX Academy</span>
      </Link>
    </div>
  )
}

export default Watermark
