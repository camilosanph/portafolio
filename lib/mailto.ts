// The contact form is mailto-only (no backend). buildMailto composes a
// pre-filled mailto: URL from the form fields; the client then navigates to it,
// opening the visitor's email client with subject + body ready to send.
export function buildMailto(o: {
  email: string
  projectType?: string
  name?: string
  fromEmail?: string
  message?: string
}): string {
  const subject = `Project enquiry${o.projectType ? ` — ${o.projectType}` : ''}`

  const lines: string[] = []
  if (o.name) lines.push(`Name: ${o.name}`)
  if (o.fromEmail) lines.push(`Email: ${o.fromEmail}`)
  if (lines.length) lines.push('') // blank separator before the message
  if (o.message) lines.push(o.message)
  const body = lines.join('\n')

  return `mailto:${o.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
