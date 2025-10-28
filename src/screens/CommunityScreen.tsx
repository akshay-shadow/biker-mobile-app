import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function CommunityScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, eventsResponse] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('events')
          .select('*')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(10),
      ]);

      if (groupsResponse.data) setGroups(groupsResponse.data);
      if (eventsResponse.data) setEvents(eventsResponse.data);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups</Text>
          {groups.map((group) => (
            <TouchableOpacity key={group.id} style={styles.card}>
              <Text style={styles.cardTitle}>{group.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {group.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardInfo}>
                  {group.current_members || 0} members
                </Text>
                <Text style={styles.cardBadge}>{group.category || 'General'}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {groups.length === 0 && !loading && (
            <Text style={styles.emptyText}>No groups found</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {events.map((event) => (
            <TouchableOpacity key={event.id} style={styles.card}>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {event.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardInfo}>
                  {new Date(event.event_date).toLocaleDateString()}
                </Text>
                <Text style={styles.cardInfo}>
                  {event.current_attendees || 0}/{event.max_attendees || '∞'} attending
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {events.length === 0 && !loading && (
            <Text style={styles.emptyText}>No upcoming events</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardBadge: {
    fontSize: 11,
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: 20,
  },
});
