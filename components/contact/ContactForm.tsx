'use client'

import { useState, type FormEvent } from 'react'
import { buildMailto } from '@/lib/mailto'
import type { Dictionary } from '@/lib/i18n/dictionaries/types'

// Mailto-only contact form: composes a pre-filled mailto: from the fields and
// opens the visitor's email client. No backend.
export function ContactForm({
  dict,
  email,
  projectTypes,
}: {
  dict: Dictionary
  email: string
  projectTypes: string[]
}) {
  const [name, setName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [projectType, setProjectType] = useState(projectTypes[0] ?? '')
  const [message, setMessage] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    window.location.href = buildMailto({ email, projectType, name, fromEmail, message })
  }

  const field =
    'bg-transparent border-0 border-b border-line text-fg py-3 text-[15px] outline-none placeholder:text-muted'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <div className="grid grid-cols-2 gap-[22px]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.contact.namePlaceholder}
          className={field}
        />
        <input
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder={dict.contact.emailPlaceholder}
          className={field}
        />
      </div>
      <select
        value={projectType}
        onChange={(e) => setProjectType(e.target.value)}
        className={field}
      >
        {projectTypes.map((t) => (
          <option key={t} value={t} className="bg-bg text-fg">
            {`${dict.contact.projectType} — ${t}`}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={dict.contact.messagePlaceholder}
        rows={3}
        className={`${field} resize-y`}
      />
      <button
        type="submit"
        className="mt-2 cursor-pointer self-start border-0 bg-fg px-[30px] py-[15px] font-mono text-[12px] uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90"
      >
        {dict.contact.send}
      </button>
    </form>
  )
}
