import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CommentsScreenProps {
  navigation: any;
  route: any;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: {
    username: string;
  };
}

export default function CommentsScreen({ navigation, route }: CommentsScreenProps) {
  const { postId, postContent } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to comment');
      return;
    }

    setSubmitting(true);
    try {
      // Insert the comment
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment.trim(),
            post_id: postId,
            user_id: user.id,
          },
        ])
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .single();

      if (commentError) throw commentError;

      // Update the post's comment count (temporarily disabled until DB functions are set up)
      // const { error: updateError } = await supabase.rpc('increment_comment_count', {
      //   post_id: postId,
      // });
      // if (updateError) {
      //   console.error('Error updating comment count:', updateError);
      // }

      // Add the new comment to the list
      setComments([...comments, commentData]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#B97232" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Post Preview */}
        <View style={styles.postPreview}>
          <Text style={styles.postContent} numberOfLines={3}>
            {postContent}
          </Text>
        </View>

        {/* Comments List */}
        <ScrollView style={styles.commentsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B97232" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentUsername}>
                      {comment.profiles?.username || 'Anonymous'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a comment..."
            placeholderTextColor="#9ca3af"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  postPreview: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  postContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
  },
  commentCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: '#B97232',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});