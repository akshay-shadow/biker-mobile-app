import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const loadPosts = async () => {
    try {
      // Temporarily use basic query until database functions are set up
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Add user_liked status (will be false until DB functions are set up)
      const postsWithLikes = (data || []).map(post => ({
        ...post,
        user_liked: false,
        username: post.profiles?.username || 'Anonymous'
      }));
      
      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Refresh posts when screen comes into focus (after creating a post)
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handleDatabaseTest = () => {
    navigation.navigate('DatabaseTest');
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    // Temporarily show alert until database functions are set up
    Alert.alert('Database Setup Required', 'Please run the database setup script first to enable like functionality. Check ENHANCED_FEATURES.md for instructions.');
  };

  const handleShowComments = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      navigation.navigate('Comments', {
        postId: postId,
        postContent: post.content,
      });
    }
  };

  const handleSharePost = (postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUrl(null);
  };

  const handlePostOptions = (post: any) => {
    Alert.alert(
      'Post Options',
      'What would you like to do?',
      [
        {
          text: 'Edit Post',
          onPress: () => handleEditPost(post),
        },
        {
          text: 'Delete Post',
          style: 'destructive',
          onPress: () => handleDeletePost(post.id),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditPost = (post: any) => {
    navigation.navigate('EditPost', {
      postId: post.id,
      content: post.content,
      imageUrl: post.image_url,
    });
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

              if (error) throw error;

              // Remove from local state
              setPosts(posts.filter(post => post.id !== postId));
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error: any) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BikeRiders</Text>
        <Text style={styles.headerSubtitle}>Welcome back!</Text>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={handleDatabaseTest}
        >
          <Text style={styles.debugButtonText}>Debug DB</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPosts} />
        }
      >
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postUserInfo}>
                <Text style={styles.postUsername}>
                  {post.username || 'Anonymous'}
                </Text>
                <Text style={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
              {/* Show options menu only for post owner */}
              {user && post.user_id === user.id && (
                <TouchableOpacity 
                  style={styles.postOptionsButton}
                  onPress={() => handlePostOptions(post)}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#ECEAD1" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            {post.image_url && (
              <View style={styles.imageContainer}>
                <TouchableOpacity 
                  onPress={() => handleImagePress(post.image_url)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: post.image_url }} 
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.postFooter}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLikePost(post.id)}
              >
                <Ionicons 
                  name={post.user_liked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={post.user_liked ? "#AB3801" : "#ECEAD1"} 
                />
                <Text style={styles.actionText}>{post.likes_count || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleShowComments(post.id)}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#ECEAD1" />
                <Text style={styles.actionText}>{post.comments_count || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleSharePost(post.id)}
              >
                <Ionicons name="share-outline" size={20} color="#ECEAD1" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {posts.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share!</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#ECEAD1" />
      </TouchableOpacity>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalCloseArea}
            onPress={closeImageModal}
            activeOpacity={1}
          >
            <View style={styles.imageModalContainer}>
              <TouchableOpacity 
                style={styles.imageModalCloseButton}
                onPress={closeImageModal}
              >
                <Ionicons name="close" size={30} color="#ECEAD1" />
              </TouchableOpacity>
              {selectedImageUrl && (
                <Image 
                  source={{ uri: selectedImageUrl }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#1C1C1C',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEAD1',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar + safe area
  },
  postCard: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  postDate: {
    fontSize: 12,
    color: '#ECEAD1',
    opacity: 0.7,
    marginTop: 2,
  },
  postOptionsButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(185, 114, 50, 0.2)',
  },
  postContent: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.9,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#B97232',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#ECEAD1',
    opacity: 0.7,
    marginLeft: 4,
  },
  imageContainer: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.8,
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    opacity: 0.8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.6,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30, // Moved up to account for tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B97232',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  debugButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  imageModalImage: {
    width: '100%',
    height: Dimensions.get('window').height * 0.7,
  },
});
