// ABOUTME: Client component for the "How to Play" instructions modal on the picks page.
// ABOUTME: Shows pick rules and advancement/elimination context in a pop-up overlay.
'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

export function InstructionsModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all duration-200 self-stretch"
      >
        <span>?</span>
        <span>How to Play</span>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-wimbledon-purple to-wimbledon-purple-dark rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white tracking-wide">How to Play</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white text-xl leading-none transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content — scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* Making Picks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Making Your Picks</h3>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <span className="text-gray-900 mt-0.5 flex-shrink-0">&#x2022;</span>
                    <span>Select players to win their match each round</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-gray-900 mt-0.5 flex-shrink-0">&#x2022;</span>
                    <span>You cannot reuse a player you&apos;ve picked previously</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-gray-900 mt-0.5 flex-shrink-0">&#x2022;</span>
                    <span>2 incorrect picks = elimination from the contest</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark rounded-lg hover:shadow-md transition-all duration-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
