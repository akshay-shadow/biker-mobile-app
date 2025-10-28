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

export default function ExploreScreen() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesResponse, ridesResponse] = await Promise.all([
        supabase
          .from('routes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('rides')
          .select(`
            *,
            profiles:organizer_id (
              username
            )
          `)
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true })
          .limit(10),
      ]);

      if (routesResponse.data) setRoutes(routesResponse.data);
      if (ridesResponse.data) setRides(ridesResponse.data);
    } catch (error) {
      console.error('Error loading explore data:', error);
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
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          {routes.map((route) => (
            <TouchableOpacity key={route.id} style={styles.card}>
              <Text style={styles.cardTitle}>{route.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {route.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardInfo}>
                  {route.distance_km ? `${route.distance_km} km` : 'Distance N/A'}
                </Text>
                <Text style={styles.cardInfo}>{route.difficulty || 'Moderate'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Rides</Text>
          {rides.map((ride) => (
            <TouchableOpacity key={ride.id} style={styles.card}>
              <Text style={styles.cardTitle}>{ride.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {ride.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardInfo}>
                  {new Date(ride.start_time).toLocaleDateString()}
                </Text>
                <Text style={styles.cardInfo}>
                  {ride.current_participants || 0}/{ride.max_participants || '∞'} riders
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  },
  cardInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
