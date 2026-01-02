import { supabase, supabaseServer } from '@/lib/supabase';

export async function DELETE(req) {
  try {
    // Check if service role key is available
    if (!supabaseServer) {
      return Response.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not found. Check your .env.local file.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Get the document to retrieve file_url
    const { data: document, error: fetchError } = await supabaseServer
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return Response.json(
        { error: `Failed to fetch document: ${fetchError.message}` },
        { status: 400 }
      );
    }

    if (!document) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Step 2: Delete file from storage bucket
    if (document.file_url) {
      try {
        const url = document.file_url;
        let filePath = null;

        // Extract file path from URL
        // URL format: https://xxxxx.supabase.co/storage/v1/object/public/documents/documents/timestamp-filename.ext
        // We need to extract: documents/timestamp-filename.ext
        
        console.log(`Debug: Full URL = ${url}`);
        
        if (url.includes('/documents/documents/')) {
          // URL has double /documents/ - split at the boundary
          const parts = url.split('/documents/documents/');
          const filename = parts[1]; // Get the part after /documents/documents/
          filePath = `documents/${filename}`;
          console.log(`Debug: Extracted filename from double path: ${filename}`);
        } else if (url.includes('/documents/')) {
          // Single /documents/ - extract the last part
          const parts = url.split('/documents/');
          const filename = parts[parts.length - 1];
          filePath = `documents/${filename}`;
          console.log(`Debug: Extracted filename from single path: ${filename}`);
        }

        console.log(`Debug: Final filePath for deletion = ${filePath}`);

        if (filePath) {
          console.log(`Debug: Attempting to delete from bucket 'documents' with path: ${filePath}`);
          const { error: storageError } = await supabaseServer.storage
            .from('documents')
            .remove([filePath]);

          if (storageError) {
            console.error(`⚠ Storage deletion error for ${filePath}:`, storageError.message);
            // Continue with database deletion even if storage deletion fails
          } else {
            console.log(`✓ File deleted from storage: ${filePath}`);
          }
        } else {
          console.warn(`⚠ Could not extract filePath from URL: ${url}`);
        }
      } catch (error) {
        console.error('Error deleting from storage:', error.message);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Step 3: Delete from database
    const { error: deleteError } = await supabaseServer
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json(
        { error: `Failed to delete document: ${deleteError.message}` },
        { status: 400 }
      );
    }

    console.log(`✓ Document deleted from database: ${id}`);

    return Response.json(
      { message: 'Document deleted successfully from both storage and database' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
