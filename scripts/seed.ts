import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import { slugify } from '../lib/slug'
import { uniqueSlug } from '../lib/projects'

// Seeds Camilo's portfolio with the handoff's placeholder content: an admin
// login, Site Settings + Home, the four disciplines, and their projects (each a
// cover that opens its own page, with a gallery of photos/videos + an optional
// description and date). Placeholder photography is the brief's Unsplash stock —
// downloaded once and uploaded into Media so the site looks complete out of the
// box. Camilo replaces it all in /admin.
//
// Idempotent: re-uses Media by filename (won't duplicate or clobber real
// uploads) and rebuilds the disciplines + projects collections. Run:
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
// like "retouching-blush-cover"). This is the important part: every image field
// on the site points to its OWN media doc, so replacing one image in the admin
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

// A minimal Lexical editor state (one paragraph) for the richText `description`
// field — what the admin's editor produces and what the frontend renders.
function richText(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          children: [
            { type: 'text', text, format: 0, style: '', mode: 'normal' as const, detail: 0, version: 1 },
          ],
        },
      ],
    },
  }
}

type Tag = 'warm' | 'teal' | 'film' | 'bw'
type GallerySeed =
  | { kind: 'image'; id: string; caption?: string }
  | { kind: 'video'; url: string; posterId?: string; caption?: string }
  | { kind: 'beforeAfter'; beforeId: string; afterId: string; caption?: string }
type ProjItem = {
  id: string
  title: string
  meta: string
  tag?: Tag
  date?: string
  description?: string
  gallery?: GallerySeed[]
}
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
      {
        id: '1496345875659-11f7dd282d1d',
        title: 'NOMAD',
        meta: 'Short film',
        tag: 'teal',
        date: '2025-09-01',
        description:
          'Look development and a final filmic grade built around a single deliberate palette — shot-matched across forty setups, from overcast exteriors to lamplit interiors.',
        gallery: [
          { kind: 'image', id: '1470071459604-3b5ec3a7fe05', caption: 'Exterior grade' },
          { kind: 'video', url: SHOWREEL_URL, posterId: '1469474968028-56623f02e42e', caption: 'Grade breakdown' },
          { kind: 'image', id: '1502823403499-6ccfcf4fb453', caption: 'Interior, lamplit' },
        ],
      },
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
      {
        id: '1494790108377-be9c29b29330',
        title: 'BLUSH',
        meta: 'Beauty',
        date: '2025-06-01',
        description:
          'High-end beauty retouching for an editorial cover — clean skin that keeps texture and tone honest.',
        gallery: [
          {
            kind: 'beforeAfter',
            beforeId: '1534528741775-53994a69daeb',
            afterId: '1517841905240-472988babdf9',
            caption: 'Raw vs. final',
          },
          { kind: 'image', id: '1529626455594-4ff0802cfb7e', caption: 'Skin detail' },
        ],
      },
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
      {
        id: '1496345875659-11f7dd282d1d',
        title: 'NOMAD',
        meta: 'Brand film · 2:14',
        date: '2025-10-01',
        description: 'Story-first edit, pacing and sound design for a two-minute brand film.',
        gallery: [
          { kind: 'video', url: SHOWREEL_URL, posterId: '1496345875659-11f7dd282d1d', caption: 'Full film' },
          { kind: 'image', id: '1426604966848-d7adac402bff', caption: 'Selected frame' },
        ],
      },
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
      {
        id: '1542327897-d73f4005b533',
        title: 'SYNTH',
        meta: 'Gen plate',
        date: '2025-11-01',
        description: 'Generative plates and a set extension composited invisibly into live footage.',
        gallery: [
          { kind: 'image', id: '1487412720507-e7ab37603c6f', caption: 'Set extension' },
          { kind: 'video', url: SHOWREEL_URL, posterId: '1542327897-d73f4005b533', caption: 'Process' },
        ],
      },
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

  // Build a project's gallery rows, each media slot keyed by project + index so
  // every image owns its own media doc.
  async function buildGallery(dSlug: string, pSlug: string, items: GallerySeed[]) {
    const rows = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const base = `${dSlug}-${pSlug}-g${i + 1}`
      if (it.kind === 'image') {
        rows.push({ kind: 'image' as const, image: await slot(base, it.id), caption: it.caption })
      } else if (it.kind === 'video') {
        rows.push({
          kind: 'video' as const,
          videoUrl: it.url,
          videoPoster: it.posterId ? await slot(`${base}-poster`, it.posterId) : undefined,
          caption: it.caption,
        })
      } else {
        rows.push({
          kind: 'beforeAfter' as const,
          beforeImage: await slot(`${base}-before`, it.beforeId),
          afterImage: await slot(`${base}-after`, it.afterId),
          caption: it.caption,
        })
      }
    }
    return rows
  }

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

  // 2. Reset the projects + disciplines collections (owned by the seed). Projects
  // reference disciplines, so clear projects first.
  const allProjects = await payload.find({ collection: 'projects', limit: 1000, depth: 0 })
  for (const doc of allProjects.docs) await payload.delete({ collection: 'projects', id: doc.id })
  const allDisc = await payload.find({ collection: 'disciplines', limit: 500, depth: 0 })
  for (const doc of allDisc.docs) await payload.delete({ collection: 'disciplines', id: doc.id })

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

  // 4. Disciplines + their projects
  for (const d of DISCIPLINES) {
    const discipline = await payload.create({
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
        beforeImage: d.beforeId ? await slot(`${d.slug}-before`, d.beforeId) : undefined,
        afterImage: d.afterId ? await slot(`${d.slug}-after`, d.afterId) : undefined,
        showreelUrl: d.showreelUrl,
        showreelPoster: d.showreelPosterId
          ? await slot(`${d.slug}-poster`, d.showreelPosterId)
          : undefined,
      },
    })

    const takenSlugs: string[] = []
    let made = 0
    for (let i = 0; i < d.projects.length; i++) {
      const p = d.projects[i]
      const pSlug = uniqueSlug(slugify(p.title), takenSlugs)
      takenSlugs.push(pSlug)
      const cover = await slot(`${d.slug}-${pSlug}-cover`, p.id)
      if (cover == null) {
        console.warn(`  ! skipped ${d.slug}/${pSlug} (cover image failed to download)`)
        continue
      }
      await payload.create({
        collection: 'projects',
        locale: 'en',
        data: {
          discipline: discipline.id,
          published: true,
          order: i,
          title: p.title,
          slug: pSlug,
          cover,
          meta: p.meta,
          tag: p.tag,
          date: p.date,
          description: p.description ? richText(p.description) : undefined,
          gallery: p.gallery ? await buildGallery(d.slug, pSlug, p.gallery) : [],
        },
      })
      made++
    }
    console.log(`✓ ${d.title} (${made} projects)`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
