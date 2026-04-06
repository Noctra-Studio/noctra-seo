// =====================
// NOCTRA SEO — Delete Site
// app/api/sites/[siteId]/route.ts
//
// DELETE /api/sites/[siteId]  — remove a project + its domain
//   siteId = projects.id
//   403 if is_default or user doesn't own the project
// =====================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  // Verify project exists and belongs to user's org
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.org_id) return jsonError('Not found', 404)

  const { data: project } = await supabase
    .from('projects')
    .select('id, is_default, org_id')
    .eq('id', siteId)
    .eq('org_id', userData.org_id)
    .maybeSingle()

  if (!project) return jsonError('Sitio no encontrado', 404)

  if (project.is_default) {
    return jsonError('El sitio predeterminado no puede eliminarse', 403)
  }

  // Delete project — domains cascade via FK
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', siteId)

  if (deleteError) return jsonError(deleteError.message, 500)

  return NextResponse.json({ ok: true })
}
