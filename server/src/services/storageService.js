const supabase = require('../utils/supabaseClient');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads a file to Supabase Storage
 * @param {Object} file - The file object from Multer (memoryStorage)
 * @param {string} bucket - The bucket name (teams, players, championships)
 * @param {string} folder - Optional subfolder
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToSupabase = async (file, bucket, folder = '') => {
    try {
        if (!file) return null;

        const fileExt = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        console.log(`Uploading to Supabase: bucket=${bucket}, path=${filePath}`);
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error(`[STORAGE ERROR] Supabase Upload failed for bucket "${bucket}":`, error.message || error);
            throw new Error(`Supabase Upload failed: ${error.message || 'Unknown error'}`);
        }
        console.log(`[STORAGE SUCCESS] Uploaded to ${bucket}: ${data.path}`);

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error(`[STORAGE CRITICAL] Critical error in uploadToSupabase:`, error);
        throw error;
    }
};

module.exports = {
    uploadToSupabase
};
