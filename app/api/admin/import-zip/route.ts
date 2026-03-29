import { BUCKET, s3 } from '@/app/lib'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { MatchedEntry } from '@/app/types'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import AdmZip from 'adm-zip'
import { randomUUID } from 'crypto'
import { parseBuffer } from 'music-metadata'
import { NextResponse } from 'next/server'

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.flac',
  '.ogg',
  '.webm',
])

const TRANSCRIPT_EXTENSIONS = new Set(['.txt'])

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : ''
}

function getBaseName(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(0, idx) : fileName
}

function getMimeType(ext: string): string {
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.m4a':
      return 'audio/mp4'
    case '.aac':
      return 'audio/aac'
    case '.flac':
      return 'audio/flac'
    case '.ogg':
      return 'audio/ogg'
    case '.webm':
      return 'audio/webm'
    default:
      return 'application/octet-stream'
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._/-]/g, '_')
}

function inferLanguageAndTranscript(rawText: string): {
  transcript: string
  inferredLanguage: 'ND' | 'HD' | 'E' | null
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const allowedTags = new Set(['ND', 'HD', 'E'])
  const foundTags = new Set<'ND' | 'HD' | 'E'>()
  const cleanedLines: string[] = []

  for (const line of lines) {
    const lastComma = line.lastIndexOf(',')

    if (lastComma === -1) {
      cleanedLines.push(line)
      continue
    }

    const textPart = line.slice(0, lastComma).trim()
    const tagPart = line
      .slice(lastComma + 1)
      .trim()
      .toUpperCase()

    if (textPart && allowedTags.has(tagPart)) {
      cleanedLines.push(textPart)
      foundTags.add(tagPart as 'ND' | 'HD' | 'E')
    } else {
      cleanedLines.push(line)
    }
  }

  const uniqueTags = Array.from(foundTags)

  let inferredLanguage: 'ND' | 'HD' | 'E' | null = null

  if (uniqueTags.length === 1) {
    inferredLanguage = uniqueTags[0]
  } else {
    inferredLanguage = null
  }

  return {
    transcript: cleanedLines.join('\n').trim(),
    inferredLanguage,
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const form = await req.formData()
    const zipFile = form.get('file') as File | null
    const language = String(form.get('language') || '').trim() || null
    const assignedToRaw = String(form.get('assigned_to') || '').trim()
    const assignedTo = assignedToRaw || null

    if (!zipFile) {
      return NextResponse.json(
        { error: 'ZIP file is required' },
        { status: 400 }
      )
    }

    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Only .zip files are supported' },
        { status: 400 }
      )
    }

    const zipBuffer = Buffer.from(await zipFile.arrayBuffer())
    const zip = new AdmZip(zipBuffer)
    const entries = zip.getEntries()

    const pairs = new Map<string, MatchedEntry>()
    const skipped: Array<{ file: string; reason: string }> = []

    for (const entry of entries) {
      if (entry.isDirectory) continue

      const entryName = entry.entryName

      // 🚫 Ignore macOS junk
      if (
        entryName.startsWith('__MACOSX/') ||
        entryName.includes('/__MACOSX/') ||
        entryName.endsWith('.DS_Store') ||
        entryName.split('/').pop()?.startsWith('._')
      ) {
        continue
      }

      const normalized = entryName.split('/').pop()?.trim() || ''

      if (!normalized) continue
      const ext = getExtension(normalized)
      const baseName = getBaseName(normalized)

      if (!baseName) {
        skipped.push({ file: entryName, reason: 'Invalid filename' })
        continue
      }

      if (!AUDIO_EXTENSIONS.has(ext) && !TRANSCRIPT_EXTENSIONS.has(ext)) {
        skipped.push({ file: entryName, reason: 'Unsupported file type' })
        continue
      }

      const existing = pairs.get(baseName) ?? { baseName }

      if (AUDIO_EXTENSIONS.has(ext)) {
        if (existing.audio) {
          skipped.push({
            file: entryName,
            reason: `Duplicate audio for base name "${baseName}"`,
          })
          continue
        }

        const data = entry.getData()
        existing.audio = {
          entryName,
          fileName: normalized,
          ext,
          data,
          size: data.length,
        }
      }

      if (TRANSCRIPT_EXTENSIONS.has(ext)) {
        if (existing.transcript) {
          skipped.push({
            file: entryName,
            reason: `Duplicate transcript for base name "${baseName}"`,
          })
          continue
        }

        const data = entry.getData()
        existing.transcript = {
          entryName,
          fileName: normalized,
          ext,
          data,
          size: data.length,
        }
      }

      pairs.set(baseName, existing)
    }

    const imported: Array<{ id: string; title: string; audio_key: string }> = []
    const errors: Array<{ file: string; reason: string }> = []
    const importBatchId = randomUUID()

    for (const [, pair] of pairs) {
      if (!pair.audio && pair.transcript) {
        errors.push({
          file: pair.transcript.fileName,
          reason: 'Missing matching audio file',
        })
        continue
      }

      if (pair.audio && !pair.transcript) {
        errors.push({
          file: pair.audio.fileName,
          reason: 'Missing matching transcript file',
        })
        continue
      }

      if (!pair.audio || !pair.transcript) continue

      const mimeType = getMimeType(pair.transcript.ext)
      let durationSeconds: number | null = null

      try {
        const metadata = await parseBuffer(pair.audio.data, {
          mimeType,
          size: pair.audio.size,
        })
        durationSeconds = metadata.format.duration ?? null
      } catch {
        console.warn(
          `Failed to parse audio metadata for ${pair.audio.fileName}, skipping duration.`
        )

        durationSeconds = null
      }

      try {
        const rawTranscript = pair.transcript.data.toString('utf-8').trim()

        const { transcript: transcriptOriginal, inferredLanguage } =
          inferLanguageAndTranscript(rawTranscript)

        if (!transcriptOriginal) {
          errors.push({
            file: pair.transcript.fileName,
            reason: 'Transcript file is empty',
          })
          continue
        }

        const audioKey = sanitizeFileName(pair.audio.fileName)

        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: audioKey,
            Body: pair.audio.data,
            ContentType: mimeType,
          })
        )

        const { data, error } = await supabase
          .from('audio_items')
          .insert({
            title: pair.baseName,
            transcript_original: transcriptOriginal,
            language: inferredLanguage || language,
            audio_key: audioKey,
            created_by: user.id,
            assigned_to: assignedTo,
            import_batch_id: importBatchId,
            original_filename: pair.audio.fileName,
            file_size_bytes: pair.audio.size,
            mime_type: mimeType,
            duration_seconds: durationSeconds,
          })
          .select('id,title,audio_key')
          .single()

        if (error) {
          errors.push({
            file: pair.audio.fileName,
            reason: error.details || error.message || 'Database insert failed',
          })
          continue
        }

        imported.push(data)
      } catch (err) {
        errors.push({
          file: pair.audio.fileName,
          reason: err instanceof Error ? err.message : 'Import failed',
        })
      }
    }

    return NextResponse.json({
      ok: true,
      importBatchId,
      importedCount: imported.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      imported,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('import-zip error:', error)
    return NextResponse.json(
      { error: 'Failed to import ZIP batch' },
      { status: 500 }
    )
  }
}
