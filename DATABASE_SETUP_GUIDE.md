# 🚀 Database Setup Instructions

## ⚠️ Required: Set Up Database Functions

Your app is currently running with basic functionality. To enable the enhanced features (likes and comments), you need to set up the database functions.

## 📋 Step-by-Step Setup

### 1. Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your BikeRiders project

### 2. Navigate to SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** to create a new SQL script

### 3. Copy and Run the Database Script
1. Open the file `database-setup.sql` in this project
2. **Copy ALL the content** from that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl/Cmd + Enter)

### 4. Verify the Setup
After running the script, you should see:
- ✅ Tables created: `comments`, `likes`
- ✅ Functions created: `get_posts_with_likes`, `toggle_like`, `increment_comment_count`
- ✅ Policies enabled for Row Level Security

### 5. Update Your App Code
Once the database is set up, update these files to enable full functionality:

#### A. Update HomeScreen.tsx
Replace the `loadPosts` function with:
```typescript
const loadPosts = async () => {
  try {
    const { data, error } = await supabase.rpc('get_posts_with_likes', {
      requesting_user_id: user?.id || null,
    });

    if (error) throw error;
    setPosts(data || []);
  } catch (error) {
    console.error('Error loading posts:', error);
  } finally {
    setLoading(false);
  }
};
```

#### B. Update the `handleLikePost` function with:
```typescript
const handleLikePost = async (postId: string) => {
  if (!user) {
    Alert.alert('Error', 'You must be logged in to like posts');
    return;
  }

  try {
    const { data: isLiked, error } = await supabase.rpc('toggle_like', {
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;

    // Update the posts state immediately for better UX
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          user_liked: isLiked,
          likes_count: isLiked 
            ? (post.likes_count || 0) + 1 
            : Math.max((post.likes_count || 0) - 1, 0),
        };
      }
      return post;
    }));
  } catch (error: any) {
    console.error('Error toggling like:', error);
    Alert.alert('Error', error.message || 'Failed to like post');
  }
};
```

#### C. Update CommentsScreen.tsx
Uncomment the comment count update lines (around line 77):
```typescript
// Update the post's comment count
const { error: updateError } = await supabase.rpc('increment_comment_count', {
  post_id: postId,
});

if (updateError) {
  console.error('Error updating comment count:', updateError);
}
```

## 🎯 What You'll Get After Setup

### ✅ Enhanced Features
- **Real-time likes** with heart animations
- **Comment system** with dedicated comment screen
- **Image uploads** with camera and photo library
- **Like counts** that update instantly
- **Comment counts** that track engagement

### ✅ Database Features
- **Row Level Security** for data protection
- **Stored procedures** for data consistency
- **Foreign key relationships** for data integrity
- **Unique constraints** to prevent duplicate likes

## 🔧 Troubleshooting

### Common Issues:

**"Function not found" errors:**
- Make sure you copied and ran the ENTIRE `database-setup.sql` script
- Check that all functions were created successfully

**"Permission denied" errors:**
- Verify Row Level Security policies were created
- Ensure your user is authenticated properly

**"Table does not exist" errors:**
- Make sure the `comments` and `likes` tables were created
- Check that the `posts` table exists and has the required columns

## 🚀 Ready to Test!

After completing the database setup and code updates:

1. **Restart your app** (stop and run `npm start` again)
2. **Test creating posts** with images
3. **Test liking posts** - you should see heart animations
4. **Test commenting** - tap the comment button on any post
5. **Verify counts** update in real-time

Your enhanced social features will be fully functional! 🎉