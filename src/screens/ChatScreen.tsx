import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ChatScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'chat' | 'group'>('chat');

  const loadData = async () => {
    setLoading(true);
    try {
      // Load direct chats and group chats
      // This will be implemented with proper chat tables
      setChats([]);
      setGroups([]);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChat = () => {
    setCreateType('chat');
    setShowCreateModal(true);
  };

  const handleCreateGroup = () => {
    setCreateType('group');
    setShowCreateModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreateChat}>
            <Ionicons name="chatbubble-outline" size={24} color="#ECEAD1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreateGroup}>
            <Ionicons name="people-outline" size={24} color="#ECEAD1" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Group Chats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Chats</Text>
          
          {groups.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No group chats yet</Text>
              <Text style={styles.emptySubtext}>Create a group to start chatting with multiple bikers</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                <Ionicons name="add" size={16} color="#ECEAD1" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Direct Chats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direct Messages</Text>
          
          {chats.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with fellow bikers</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateChat}>
                <Ionicons name="add" size={16} color="#ECEAD1" />
                <Text style={styles.createButtonText}>Start Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {createType === 'chat' ? 'Start New Chat' : 'Create Group'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.comingSoonContainer}>
              <Ionicons 
                name={createType === 'chat' ? 'chatbubble' : 'people'} 
                size={64} 
                color="#B97232" 
              />
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                {createType === 'chat' 
                  ? 'Direct messaging feature is under development. Soon you\'ll be able to chat with fellow bikers!'
                  : 'Group chat feature is under development. Soon you\'ll be able to create groups and chat with multiple bikers!'
                }
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEAD1',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B97232',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B97232',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ECEAD1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121318',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    padding: 40,
    borderRadius: 16,
    width: '100%',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEAD1',
    marginTop: 20,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#ECEAD1',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  closeButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ECEAD1',
    fontSize: 16,
    fontWeight: '600',
  },
});