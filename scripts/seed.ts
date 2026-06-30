import { getPayload, type Payload } from 'payload'
import config from '../payload.config'

// Seeds Camilo's portfolio with the handoff's placeholder content: an admin
// login, Site Settings + Home, and the four disciplines with their exact copy,
// tools, signature features and project grids. Placeholder photography is the
// brief's Unsplash stock — downloaded once and uploaded into Media so the site
// looks complete out of the box. Camilo replaces it all in /admin.
//
// Idempotent: re-uses Media by filename (won't duplicate or clobber real
// uploads) and rebuilds the disciplines collection. Run:
//   PAYLOAD_SECRET=dev-secret npm run seed

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`

// Download each Unsplash placeholder at most once (cached by id). Failures are
// cached too, so a flaky photo isn't retried on every slot that reuses it.
const bytesCache = new Map<string, Buffer | null>()
async function fetchBytes(id: string): Promise<Buffer | null> {
  if (bytesCache.has(id)) return bytesCache.get(id)!
  try {
    const res = await fetch(UNSPLASH(id))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = Buffer.from(await res.arrayBuffer())
    bytesCache.set(id, data)
    return data
  } catch (e) {
    console.warn(`  ! image ${id} failed: ${(e as Error).message}`)
    bytesCache.set(id, null)
    return null
  }
}

// Create a DISTINCT media document per slot (keyed by a stable, readable name
// like "retouching-before"). This is the important part: every image field on
// the site points to its OWN media doc, so replacing one image in the admin
// never changes another image elsewhere — even when the placeholder photo
// happens to be reused across slots. Idempotent and non-clobbering: re-runs
// reuse the slot's doc by filename and never touch Camilo's own uploads (which
// have different filenames). Returns null on fetch failure so the seed still
// completes (the field is simply left empty).
async function uploadSlot(payload: Payload, slot: string, id: string): Promise<number | null> {
  const name = `${slot}.jpg`

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: name } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id as number

  const data = await fetchBytes(id)
  if (!data) return null
  const doc = await payload.create({
    collection: 'media',
    data: { alt: '' },
    file: { data, mimetype: 'image/jpeg', name, size: data.length },
  })
  return doc.id as number
}

type ProjItem = { id: string; title: string; meta: string; tag?: 'warm' | 'teal' | 'film' | 'bw' }
type DiscSeed = {
  title: string
  slug: string
  order: number
  tool: string
  feature: 'filter' | 'beforeAfter' | 'showreel'
  gridRatio: '4/5' | '16/10' | '16/9'
  homeBlurb: string
  pageBlurb: string
  beforeId?: string
  afterId?: string
  showreelUrl?: string
  showreelPosterId?: string
  projects: ProjItem[]
}

const SHOWREEL_URL = 'https://www.youtube.com/embed/aqz-KE-bpKQ'

const DISCIPLINES: DiscSeed[] = [
  {
    title: 'Color Grading',
    slug: 'color-grading',
    order: 0,
    tool: 'DaVinci Resolve',
    feature: 'filter',
    gridRatio: '16/10',
    homeBlurb: 'Look development and final grades for film, fashion and commercial work.',
    pageBlurb:
      'Look development, shot-matching and final grades. From muted film stocks to clean commercial color — each project built around a single, deliberate palette.',
    projects: [
      { id: '1496345875659-11f7dd282d1d', title: 'NOMAD', meta: 'Short film', tag: 'teal' },
      { id: '1470071459604-3b5ec3a7fe05', title: 'HIGHLANDS', meta: 'Travel', tag: 'film' },
      { id: '1539109136881-3be0616acf4b', title: 'SUNROOM', meta: 'Editorial', tag: 'warm' },
      { id: '1426604966848-d7adac402bff', title: 'GRANITE', meta: 'Commercial', tag: 'teal' },
      { id: '1502823403499-6ccfcf4fb453', title: 'ATELIER', meta: 'Fashion', tag: 'warm' },
      { id: '1469474968028-56623f02e42e', title: 'DRIFT', meta: 'Music video', tag: 'film' },
      { id: '1534528741775-53994a69daeb', title: 'STILLS', meta: 'Portrait', tag: 'bw' },
      { id: '1518837695005-2083093ee35b', title: 'TIDE', meta: 'Documentary', tag: 'teal' },
      { id: '1485518882345-15568b007407', title: 'GOLDEN', meta: 'Lookbook', tag: 'warm' },
    ],
  },
  {
    title: 'Retouching',
    slug: 'retouching',
    order: 1,
    tool: 'Photoshop · Capture One',
    feature: 'beforeAfter',
    gridRatio: '4/5',
    homeBlurb: 'High-end beauty and skin work that keeps texture honest.',
    pageBlurb:
      'High-end beauty, skin and product retouching. Drag the handle to compare a raw capture with the finished frame — clean, but never plastic.',
    beforeId: '1534528741775-53994a69daeb',
    afterId: '1517841905240-472988babdf9',
    projects: [
      { id: '1494790108377-be9c29b29330', title: 'BLUSH', meta: 'Beauty' },
      { id: '1438761681033-6461ffad8d80', title: 'LINEN', meta: 'Editorial' },
      { id: '1531746020798-e6953c6e8e04', title: 'CORAL', meta: 'Campaign' },
      { id: '1517841905240-472988babdf9', title: 'INDIGO', meta: 'Portrait' },
      { id: '1529626455594-4ff0802cfb7e', title: 'EMBER', meta: 'Beauty' },
      { id: '1485125639709-a60c3a500bf1', title: 'SLATE', meta: 'Studio' },
      { id: '1524250502761-1ac6f2e30d43', title: 'IVORY', meta: 'Lookbook' },
      { id: '1513379733131-47fc74b45fc7', title: 'NOIR', meta: 'Cover' },
    ],
  },
  {
    title: 'Video Editing',
    slug: 'video-editing',
    order: 2,
    tool: 'Premiere Pro · After Effects',
    feature: 'showreel',
    gridRatio: '16/9',
    homeBlurb: 'Story-first edits and rhythm for brand films and music videos.',
    pageBlurb:
      'Story-first edits, pacing and sound for brand films, fashion films and music videos. Below: the 2026 showreel and selected cuts.',
    showreelUrl: SHOWREEL_URL,
    showreelPosterId: '1469474968028-56623f02e42e',
    projects: [
      { id: '1496345875659-11f7dd282d1d', title: 'NOMAD', meta: 'Brand film · 2:14' },
      { id: '1470071459604-3b5ec3a7fe05', title: 'HIGHLANDS', meta: 'Travel · 1:48' },
      { id: '1469474968028-56623f02e42e', title: 'DRIFT', meta: 'Music video · 3:22' },
      { id: '1518837695005-2083093ee35b', title: 'TIDE', meta: 'Documentary · 4:05' },
      { id: '1426604966848-d7adac402bff', title: 'GRANITE', meta: 'Commercial · 0:45' },
      { id: '1441974231531-c6227db76b6e', title: 'CANOPY', meta: 'Spot · 0:30' },
    ],
  },
  {
    title: 'AI Video',
    slug: 'ai-video',
    order: 3,
    tool: 'Runway · Topaz · After Effects',
    feature: 'showreel',
    gridRatio: '4/5',
    homeBlurb: 'Generative plates, upscales and motion extensions woven into live footage.',
    pageBlurb:
      'Generative plates, set extensions, relighting and upscales — composited invisibly into live footage. A look at the assisted pipeline.',
    showreelUrl: SHOWREEL_URL,
    showreelPosterId: '1542327897-d73f4005b533',
    projects: [
      { id: '1542327897-d73f4005b533', title: 'SYNTH', meta: 'Gen plate' },
      { id: '1487412720507-e7ab37603c6f', title: 'EXTEND', meta: 'Set extension' },
      { id: '1519699047748-de8e457a634e', title: 'RELIGHT', meta: 'AI relight' },
      { id: '1496345875659-11f7dd282d1d', title: 'INPAINT', meta: 'Cleanup' },
      { id: '1502823403499-6ccfcf4fb453', title: 'STYLE', meta: 'Style transfer' },
      { id: '1524863479829-916d8e77f114', title: 'UPRES', meta: 'Upscale 8K' },
    ],
  },
]

const HERO_ID = '1542327897-d73f4005b533'
const PROOF_IDS = ['1496345875659-11f7dd282d1d', '1534528741775-53994a69daeb', '1470071459604-3b5ec3a7fe05']

async function seed() {
  const payload = await getPayload({ config })
  const slot = (name: string, id: string) => uploadSlot(payload, name, id)

  // 1. Admin user
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@camilosanchez.studio'
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123'
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existingUser.totalDocs === 0) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Camilo' } })
    console.log(`✓ admin user: ${email} (password: ${password})`)
  } else {
    console.log(`• admin user already exists: ${email}`)
  }

  // 2. Reset the disciplines collection (owned by the seed)
  const all = await payload.find({ collection: 'disciplines', limit: 500, depth: 0 })
  for (const doc of all.docs) await payload.delete({ collection: 'disciplines', id: doc.id })

  // 3. Globals
  console.log('… uploading placeholder images (first run only)')
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      wordmark: 'CAMILO SANCHEZ',
      tagline: 'Color · Retouch · Motion',
      contactEmail: 'hello@camilosanchez.studio',
      availabilityNote:
        'Available for commissions and full-time roles through 2026. Brands, agencies and creators welcome.',
      socials: [
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'behance', url: 'https://behance.net' },
        { platform: 'linkedin', url: 'https://linkedin.com' },
      ],
    },
  })

  const heroId = await slot('home-hero', HERO_ID)
  const proofIds: (number | null)[] = []
  for (let i = 0; i < PROOF_IDS.length; i++) proofIds.push(await slot(`home-proof-${i + 1}`, PROOF_IDS[i]))
  await payload.updateGlobal({
    slug: 'home',
    locale: 'en',
    data: {
      heroImage: heroId,
      valueStatement:
        'Camilo Sanchez is a colorist and retoucher building images and films that feel effortless — restrained, tactile, made to last.',
      proofStrip: proofIds.filter((id): id is number => id != null).map((id) => ({ image: id })),
    },
  })
  console.log('✓ site settings + home')

  // 4. Disciplines
  for (const d of DISCIPLINES) {
    const projects = []
    for (let i = 0; i < d.projects.length; i++) {
      const p = d.projects[i]
      projects.push({
        image: await slot(`${d.slug}-project-${i + 1}`, p.id),
        title: p.title,
        meta: p.meta,
        tag: p.tag,
      })
    }
    await payload.create({
      collection: 'disciplines',
      locale: 'en',
      data: {
        title: d.title,
        slug: d.slug,
        order: d.order,
        published: true,
        tool: d.tool,
        feature: d.feature,
        gridRatio: d.gridRatio,
        homeBlurb: d.homeBlurb,
        pageBlurb: d.pageBlurb,
        projects,
        beforeImage: d.beforeId ? await slot(`${d.slug}-before`, d.beforeId) : undefined,
        afterImage: d.afterId ? await slot(`${d.slug}-after`, d.afterId) : undefined,
        showreelUrl: d.showreelUrl,
        showreelPoster: d.showreelPosterId
          ? await slot(`${d.slug}-poster`, d.showreelPosterId)
          : undefined,
      },
    })
    console.log(`✓ ${d.title} (${d.projects.length} projects)`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
