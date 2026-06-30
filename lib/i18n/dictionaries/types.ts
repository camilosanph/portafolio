// Static UI strings (chrome, labels, form). Editable CONTENT (titles, blurbs,
// taglines) lives in Payload localized fields, not here.
export interface Dictionary {
  nav: {
    contact: string
  }
  hero: {
    scroll: string
  }
  home: {
    fourDisciplines: string
  }
  area: {
    playShowreel: string
    playVideo: string
    before: string
    after: string
  }
  contact: {
    label: string
    namePlaceholder: string
    emailPlaceholder: string
    projectType: string
    messagePlaceholder: string
    send: string
  }
  filters: {
    all: string
    warm: string
    teal: string
    film: string
    bw: string
  }
}
