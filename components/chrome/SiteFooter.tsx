import { ContactForm } from '@/components/contact/ContactForm'
import { socialLabel, type SocialLink } from '@/lib/socials'
import type { Dictionary } from '@/lib/i18n/dictionaries/types'

// Shared contact footer, present at the bottom of every page (id="contact").
// Left: email + availability + socials. Right: the mailto contact form.
export function SiteFooter({
  dict,
  email,
  availabilityNote,
  socials,
  projectTypes,
}: {
  dict: Dictionary
  email: string
  availabilityNote?: string | null
  socials: SocialLink[]
  projectTypes: string[]
}) {
  return (
    <footer
      id="contact"
      className="grid gap-[clamp(36px,5vw,80px)] border-t border-line px-[clamp(20px,5vw,72px)] pt-[clamp(60px,9vw,130px)] pb-[clamp(70px,9vw,110px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]"
    >
      <div>
        <div className="mb-6 font-mono text-[11px] uppercase tracking-label text-muted">
          {dict.contact.label}
        </div>
        <a
          href={`mailto:${email}`}
          className="font-serif text-[clamp(26px,4.4vw,54px)] font-normal leading-[1.05] transition-colors [word-break:break-word] hover:text-accent"
        >
          {email}
        </a>
        {availabilityNote && (
          <p className="mb-[30px] mt-[26px] max-w-[380px] font-serif text-[17px] italic leading-[1.6] text-muted">
            {availabilityNote}
          </p>
        )}
        {socials.length > 0 && (
          <div className="flex gap-[26px] font-mono text-[11px] uppercase tracking-[0.14em]">
            {socials.map((s, i) =>
              s.url ? (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-accent"
                >
                  {socialLabel(s.platform)}
                </a>
              ) : null,
            )}
          </div>
        )}
      </div>
      <ContactForm dict={dict} email={email} projectTypes={projectTypes} />
    </footer>
  )
}
