import { supabase, supabaseServer } from '@/lib/supabase';

// Blocked MIME types (audio and video)
const BLOCKED_MIME_TYPES = [
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac',
  // Video
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg', 'video/x-flv'
];

const BLOCKED_EXTENSIONS = [
  'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff',
  'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', '3gp', 'ogv'
];

export async function POST(req) {
  try {
    // Check if service role key is available
    if (!supabaseServer) {
      return Response.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not found. Check your .env.local file.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    const description = formData.get('description');
    const contact_id = formData.get('contact_id');
    const lead_id = formData.get('lead_id');
    const organization_id = formData.get('organization_id');

    // Validate input
    if (!file || !name) {
      return Response.json(
        { error: 'File and document name are required' },
        { status: 400 }
      );
    }

    // Check file type and extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(fileExtension) || BLOCKED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Audio and video files are not allowed' },
        { status: 400 }
      );
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Get file type from extension
    const fileTypeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'xls': 'xls',
      'xlsx': 'xls',
      'ppt': 'ppt',
      'pptx': 'ppt',
      'txt': 'txt',
      'csv': 'csv',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'zip': 'zip',
      'rar': 'zip',
      '7z': 'zip',
    };
    const fileType = fileTypeMap[fileExtension] || 'other';

    // Create a unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${file.name}`;
    const uploadPath = `documents/${uniqueFileName}`;

    // Convert file to bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('documents')
      .upload(uploadPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
        throw new Error('Documents storage bucket not found. Please create a "documents" bucket in Supabase Storage first.');
      }
      
      throw new Error(`Storage error: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('documents')
      .getPublicUrl(uploadPath);

    const fileUrl = urlData?.publicUrl || `/documents/${uploadPath}`;

    // Save document metadata to database using service role
    const { data: dbData, error: dbError } = await supabaseServer
      .from('documents')
      .insert([
        {
          name: name,
          file_type: fileType,
          file_url: fileUrl,
          file_size: file.size,
          description: description || null,
          contact_id: contact_id ? parseInt(contact_id) : null,
          lead_id: lead_id ? parseInt(lead_id) : null,
          organization_id: organization_id ? parseInt(organization_id) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to delete the uploaded file since DB insert failed
      await supabaseServer.storage.from('documents').remove([uploadPath]);
      throw new Error('Failed to save document metadata');
    }

    return Response.json(
      {
        message: 'Document uploaded successfully',
        data: dbData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
