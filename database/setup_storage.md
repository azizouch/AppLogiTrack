# Setup Supabase Storage for Profile Images

## Steps to configure profile image storage in Supabase:

### 1. Create Storage Bucket

Go to your Supabase dashboard → Storage → Create a new bucket:

- **Bucket name**: `profile-images`
- **Public bucket**: ✅ Yes (checked)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`

### 2. Set up Storage Policies

Go to Storage → profile-images → Policies and create the following policies:

#### Policy 1: Allow users to upload their own profile images
```sql
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow anyone to view profile images
```sql
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');
```

#### Policy 3: Allow users to update their own profile images
```sql
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Allow users to delete their own profile images
```sql
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Run Database Migration

Execute the SQL migration file:
```sql
-- Add image_url column to utilisateurs table
ALTER TABLE utilisateurs 
ADD COLUMN image_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN utilisateurs.image_url IS 'URL of the user profile image stored in Supabase Storage';
```

### 4. Test the Setup

1. Go to your application
2. Navigate to Profile page
3. Click the camera icon to upload a profile image
4. Verify the image appears correctly
5. Check that the image URL is saved in the database

### File Structure in Storage

Profile images will be stored with the following structure:
```
profile-images/
├── profiles/
│   ├── {user-id}-{timestamp}.jpg
│   ├── {user-id}-{timestamp}.png
│   └── ...
```

### Notes

- Images are automatically resized and optimized by the browser
- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF, WebP
- Old images are not automatically deleted when new ones are uploaded
- Users can only access their own images for upload/update/delete
- All users can view profile images (for displaying in the app)
