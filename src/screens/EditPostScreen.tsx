import React, { useState, useEffect } from 'react';
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

interface EditPostScreenProps {
  navigation: any;
  route: any;
}

export default function EditPostScreen({ navigation, route }: EditPostScreenProps) {
  const { user } = useAuth();
  const { postId, content: initialContent, imageUrl: initialImageUrl } = route.params;
  
  const [content, setContent] = useState(initialContent || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

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
      setImageChanged(true);
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
      setImageChanged(true);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePicture },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Remove Image', onPress: removeImage, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageChanged(true);
  };

  const handleUpdatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit posts');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = selectedImage;

      // Upload new image if changed and not just removed
      if (imageChanged && selectedImage && !selectedImage.startsWith('http')) {
        try {
          const fileExt = selectedImage.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `post-images/${fileName}`;
          
          const formData = new FormData();
          formData.append('file', {
            uri: selectedImage,
            type: `image/${fileExt}`,
            name: fileName,
          } as any);
          
          const { error: uploadError } = await supabase.storage
            .from('image-media')
            .upload(filePath, formData);
            
          if (uploadError) {
            console.error('Image upload error:', uploadError);
            if (uploadError.message.includes('Bucket not found')) {
              Alert.alert(
                'Storage Setup Required',
                'The storage bucket has not been created yet. Please create the "image-media" bucket in Supabase Storage, or update without changing the image.',
                [
                  { text: 'Update Without New Image', onPress: () => setSelectedImage(initialImageUrl) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
              return;
            } else if (uploadError.message.includes('row-level security policy')) {
              Alert.alert(
                'Storage Permissions Required',
                'Image upload failed due to security settings. Please contact the app administrator to set up storage policies.\n\nUpdate without changing the image, or try again later.',
                [
                  { text: 'Update Without New Image', onPress: () => setSelectedImage(initialImageUrl) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
              return;
            } else {
              Alert.alert('Warning', 'Failed to upload new image, keeping original');
              imageUrl = initialImageUrl;
            }
          } else {
            const { data: urlData } = supabase.storage
              .from('image-media')
              .getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          Alert.alert('Warning', 'Image processing failed, keeping original');
          imageUrl = initialImageUrl;
        }
      }

      // If image was removed, set to null
      if (imageChanged && !selectedImage) {
        imageUrl = null;
      }

      const updateData = {
        content: content.trim(),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', user.id); // Ensure user can only edit their own posts

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your post has been updated!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating post:', error);
      
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
        Alert.alert('Error', error.message || 'Failed to update post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = content !== initialContent || imageChanged;
    
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
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
          <Text style={styles.headerTitle}>Edit Post</Text>
          <TouchableOpacity 
            onPress={handleUpdatePost} 
            style={[
              styles.headerButton, 
              styles.updateButton,
              (!content.trim() || loading) && styles.updateButtonDisabled
            ]}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
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

          {/* Image Options */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={24} color="#B97232" />
              <Text style={styles.imageButtonText}>
                {selectedImage ? 'Change Photo' : 'Add Photo'}
              </Text>
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
  updateButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  updateButtonText: {
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
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
});