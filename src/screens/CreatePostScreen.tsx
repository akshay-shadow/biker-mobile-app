import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreatePostScreenProps {
  navigation: any;
}

export default function CreatePostScreen({ navigation }: CreatePostScreenProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    console.log('showImageOptions called'); // Debug log
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePicture },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating post with user ID:', user.id);
      console.log('Post content:', content.trim());
      console.log('Selected image URI:', selectedImage);
      
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        console.log('Image selected, starting upload process...');
        try {
          // First, check if storage bucket exists
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          console.log('Storage buckets check:', { buckets: buckets?.map(b => b.name), bucketError });
          
          if (bucketError || !buckets?.find(bucket => bucket.name === 'image-media')) {
            console.log('Storage bucket "image-media" not found, posting without image');
            Alert.alert(
              'Storage Not Set Up',
              'The image storage bucket is not configured yet. Your post will be created without the image.\n\nTo enable image uploads:\n1. Go to Supabase Dashboard → Storage\n2. Create a bucket named "image-media"\n3. Make it public',
              [
                { 
                  text: 'Post Without Image', 
                  onPress: () => {
                    // Continue with post creation without image
                    setSelectedImage(null);
                  }
                },
                { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); return; } }
              ]
            );
            // Don't return here, let the post creation continue without image
          } else {
            // Bucket exists, proceed with upload
            console.log('Storage bucket found, proceeding with upload...');
            const fileExt = selectedImage.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `post-images/${fileName}`;
            console.log('Upload details:', { fileExt, fileName, filePath });
            
            const formData = new FormData();
            formData.append('file', {
              uri: selectedImage,
              type: `image/${fileExt}`,
              name: fileName,
            } as any);
            
            console.log('Starting file upload...');
            const { error: uploadError } = await supabase.storage
              .from('image-media')
              .upload(filePath, formData);
              
            if (uploadError) {
              console.error('Image upload error:', uploadError);
              console.error('Upload error details:', {
                message: uploadError.message,
                name: uploadError.name
              });
              
              if (uploadError.message.includes('row-level security policy')) {
                Alert.alert(
                  'Storage Permissions Required',
                  'Image upload failed due to security settings.\n\nQuick fix: Go to Supabase Dashboard → Storage → Policies and create policies for the "image-media" bucket.\n\nYour post will be created without the image.',
                  [{ text: 'Continue', onPress: () => setSelectedImage(null) }]
                );
              } else {
                Alert.alert('Warning', `Failed to upload image: ${uploadError.message}\n\nPosting without image.`);
              }
            } else {
              console.log('Upload successful, generating public URL...');
              const { data: urlData } = supabase.storage
                .from('image-media')
                .getPublicUrl(filePath);
              imageUrl = urlData.publicUrl;
              console.log('Generated image URL:', imageUrl);
            }
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          Alert.alert('Warning', 'Image processing failed, posting without image');
        }
      } else {
        console.log('No image selected, posting text only');
      }
      
      const postData = {
        content: content.trim(),
        user_id: user.id,
        likes_count: 0,
        comments_count: 0,
        image_url: imageUrl, // This will be converted to array if needed
      };
      
      console.log('Post data to insert:', postData);
      console.log('Final image URL value:', imageUrl);

      // Try inserting the post - handle both single URL and array format
      let insertData: any = { ...postData };
      
      const { data, error } = await supabase
        .from('posts')
        .insert([insertData])
        .select();

      // If we get array format error, try sending as array
      if (error && error.code === '22P02' && error.message?.includes('Array value must start with')) {
        console.log('Retrying with array format for image_url...');
        insertData.image_url = imageUrl ? [imageUrl] : null;
        
        const { data: retryData, error: retryError } = await supabase
          .from('posts')
          .insert([insertData])
          .select();
          
        if (retryError) {
          throw retryError;
        }
        
        console.log('Post created successfully with array format:', retryData);
        // Continue with success handling
        Alert.alert(
          'Success',
          'Your post has been created!',
          [
            {
              text: 'OK',
              onPress: () => {
                setContent('');
                setSelectedImage(null);
                navigation.goBack();
              },
            },
          ]
        );
        return;
      }

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        
        // Handle specific array format error
        if (error.code === '22P02' && error.message?.includes('Array value must start with')) {
          Alert.alert(
            'Database Schema Issue',
            'The image_url column expects an array format. Please run this SQL in Supabase:\n\nALTER TABLE posts DROP COLUMN image_url;\nALTER TABLE posts ADD COLUMN image_url TEXT;'
          );
        } else if (error.message?.includes('image_url') && error.message?.includes('schema cache')) {
          Alert.alert(
            'Database Setup Required', 
            'The posts table is missing the image_url column. Please run this SQL in Supabase:\n\nALTER TABLE posts ADD COLUMN image_url TEXT;'
          );
        } else if (error.code === 'PGRST204') {
          Alert.alert(
            'Database Schema Error',
            'There is a column missing in the database. Please contact the app administrator to update the database schema.'
          );
        } else {
          Alert.alert('Error', error.message || 'Failed to create post');
        }
        
        throw error;
      }

      console.log('Post created successfully:', data);

      Alert.alert(
        'Success',
        'Your post has been created!',
        [
          {
            text: 'OK',
            onPress: () => {
              setContent('');
              setSelectedImage(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      if (error.message?.includes('image_url') && error.message?.includes('schema cache')) {
        Alert.alert(
          'Database Setup Required', 
          'The posts table is missing the image_url column. Please run this SQL in Supabase:\n\nALTER TABLE posts ADD COLUMN image_url TEXT;'
        );
      } else if (error.code === 'PGRST204') {
        Alert.alert(
          'Database Schema Error',
          'There is a column missing in the database. Please contact the app administrator to update the database schema.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim()) {
      Alert.alert(
        'Discard Post',
        'Are you sure you want to discard your post?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity 
            onPress={handleCreatePost} 
            style={[
              styles.headerButton, 
              styles.postButton,
              (!content.trim() || loading) && styles.postButtonDisabled
            ]}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#6b7280" />
            </View>
            <Text style={styles.username}>
              {user?.user_metadata?.username || user?.email || 'You'}
            </Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind? Share your biking experience..."
            placeholderTextColor="#9ca3af"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Image Options - Always visible */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={24} color="#B97232" />
              <Text style={styles.imageButtonText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            {/* Character count moved to bottom */}
            <Text style={styles.characterCount}>
              {content.length}/500
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  postButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    padding: 0,
    minHeight: 120,
  },
  imageSection: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B97232',
    borderStyle: 'dashed',
    width: '100%',
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#B97232',
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 16,
    marginBottom: 8,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
});