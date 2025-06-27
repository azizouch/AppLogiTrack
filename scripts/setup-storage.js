// Setup script to create the profile-images storage bucket
// Run this script if you get "Bucket not found" errors

import { createClient } from '@supabase/supabase-js';

// You need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Use service role key, not anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupStorage() {
  try {
    console.log('🚀 Setting up profile images storage...');

    // 1. Create the bucket
    console.log('📦 Creating profile-images bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('profile-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError;
    }

    if (bucketError?.message.includes('already exists')) {
      console.log('✅ Bucket already exists');
    } else {
      console.log('✅ Bucket created successfully');
    }

    // 2. Set up policies
    console.log('🔒 Setting up storage policies...');

    // Policy 1: Users can upload their own images
    const { error: policy1Error } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Users can upload their own profile images',
      bucket_name: 'profile-images',
      operation: 'INSERT',
      check_expression: `bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]`
    });

    // Policy 2: Anyone can view profile images
    const { error: policy2Error } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Anyone can view profile images',
      bucket_name: 'profile-images',
      operation: 'SELECT',
      check_expression: `bucket_id = 'profile-images'`
    });

    // Policy 3: Users can update their own images
    const { error: policy3Error } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Users can update their own profile images',
      bucket_name: 'profile-images',
      operation: 'UPDATE',
      check_expression: `bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]`
    });

    // Policy 4: Users can delete their own images
    const { error: policy4Error } = await supabase.rpc('create_storage_policy', {
      policy_name: 'Users can delete their own profile images',
      bucket_name: 'profile-images',
      operation: 'DELETE',
      check_expression: `bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]`
    });

    console.log('✅ Storage setup completed!');
    console.log('');
    console.log('🎉 You can now upload profile images!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to your app profile page');
    console.log('2. Click "Modifier" to enter edit mode');
    console.log('3. Click the camera icon to upload an image');

  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    console.log('');
    console.log('Manual setup required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a bucket named "profile-images"');
    console.log('4. Set it as public');
    console.log('5. Add the storage policies from the migration file');
  }
}

// Run the setup
setupStorage();
