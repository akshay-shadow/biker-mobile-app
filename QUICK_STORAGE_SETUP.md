# 🚨 Quick Storage Bucket Setup

## ❌ **Current Error:**
```
ERROR Image upload error: [StorageApiError: Bucket not found]
```

## ⚡ **Quick Fix (2 minutes):**

### **Step 1: Create Storage Bucket**

1. **Open Supabase Dashboard** → Go to your project at https://supabase.com
2. **Click "Storage"** in the left sidebar
3. **Click "New Bucket"** button
4. **Enter bucket details:**
   - **Name:** `posts`
   - **Public bucket:** ✅ **CHECK THIS BOX** (important for image display)
   - **File size limit:** 10MB (or your preference)
5. **Click "Create Bucket"**

### **Step 2: Set Bucket Policies (Optional but Recommended)**

After creating the bucket:

1. **Click on the "posts" bucket**
2. **Go to "Policies" tab**
3. **Click "Add Policy"**
4. **Add this policy for uploads:**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
```

5. **Add this policy for public access:**

```sql
-- Allow public access to view images
CREATE POLICY "Public access" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');
```

## 🎯 **Alternative: Disable Images Temporarily**

If you want to test posting without images while setting up storage:

The app will now gracefully handle the missing bucket and offer to post without the image.

## ✅ **After Setup:**

1. **Bucket "posts" exists** and is public
2. **Try creating a post with image** - should work now!
3. **Images will appear** in your feed

## 🚀 **Test:**

1. **Complete the storage setup above**
2. **Go back to your app**
3. **Try creating a post with an image**
4. **Should work without the bucket error!**

**The storage bucket setup takes less than 2 minutes in Supabase dashboard!** 📸✨