// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

/**
 * POST /api/profile/avatar
 * Upload avatar to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return errorResponse('File must be an image', 400)
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return errorResponse('File size must be less than 2MB', 400)
    }

    // Generate file path
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return errorResponse('Failed to upload avatar')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile with avatar URL:', updateError)
      return errorResponse('Failed to update profile')
    }

    return successResponse({ avatar_url: publicUrl })
  } catch (error) {
    console.error('Unexpected error in avatar upload:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * DELETE /api/profile/avatar
 * Delete avatar from Supabase Storage
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Get current avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('profile-pictures/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]

        // Delete from storage
        await supabase.storage
          .from('profile-pictures')
          .remove([filePath])
      }
    }

    // Remove avatar URL from profile
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (error) {
      console.error('Error removing avatar URL:', error)
      return errorResponse('Failed to remove avatar')
    }

    return successResponse({ message: 'Avatar removed successfully' })
  } catch (error) {
    console.error('Unexpected error in avatar delete:', error)
    return errorResponse('Internal server error')
  }
}
