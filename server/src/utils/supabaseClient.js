const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Image uploads will fail.');
} else if (!supabaseKey.startsWith('eyJ')) {
    console.error('CRITICAL: SUPABASE_KEY does not appear to be a valid Supabase JWT. It should start with "eyJ". Found:', supabaseKey.substring(0, 10) + '...');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
