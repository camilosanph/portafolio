import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'

// Local API — runs in-process (no HTTP). Call directly from server components:
//   const payload = await getPayloadClient()
//   const { docs } = await payload.find({ collection: 'disciplines', locale })
export const getPayloadClient = async () => getPayload({ config })
