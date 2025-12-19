import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function RidesScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
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

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleCreateRide = () => {
    navigation.navigate('CreateRide');
  };

  const handleTestRidesTable = () => {
    navigation.navigate('RidesTableTest');
  };

  const handleEditRide = (rideId: string) => {
    navigation.navigate('EditRide', {
      rideId,
    });
  };

  const handleDeleteRide = (rideId: string, rideTitle: string) => {
    Alert.alert(
      'Delete Ride',
      `Are you sure you want to delete "${rideTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('rides')
                .delete()
                .eq('id', rideId)
                .eq('organizer_id', user?.id); // Ensure user can only delete their own rides

              if (error) throw error;

              Alert.alert('Success', 'Ride deleted successfully');
              loadData(); // Refresh the list
            } catch (error: any) {
              console.error('Error deleting ride:', error);
              Alert.alert('Error', error.message || 'Failed to delete ride');
            }
          },
        },
      ]
    );
  };

  const handleRideOptions = (ride: any) => {
    Alert.alert(
      'Ride Options',
      `Manage "${ride.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => handleEditRide(ride.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteRide(ride.id, ride.title),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rides</Text>
        <TouchableOpacity
          style={styles.trackRideButton}
          onPress={() => navigation.navigate('TrackRide')}
        >
          <Ionicons name="bicycle" size={20} color="#ECEAD1" />
          <Text style={styles.trackRideText}>Track Ride</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.section}>
          {routes.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              {routes.map((route) => (
                <TouchableOpacity key={route.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{route.name}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {route.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="location-outline" size={16} color="#B97232" />
                      <Text style={styles.cardInfo}>
                        {route.distance_km ? `${route.distance_km} km` : 'Distance N/A'}
                      </Text>
                    </View>
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="speedometer-outline" size={16} color="#B97232" />
                      <Text style={styles.cardInfo}>
                        {(route.difficulty_level || 'moderate').charAt(0).toUpperCase() + (route.difficulty_level || 'moderate').slice(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color="#B97232" />
              <Text style={styles.emptyText}>No routes saved</Text>
              <Text style={styles.emptySubtext}>Discover and save your favorite biking routes</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {rides.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Upcoming Rides</Text>
              {rides.map((ride) => (
                <View key={ride.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>{ride.title}</Text>
                      {ride.organizer_id === user?.id && (
                        <TouchableOpacity
                          onPress={() => handleRideOptions(ride)}
                          style={styles.optionsButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="ellipsis-vertical" size={20} color="#ECEAD1" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {ride.description}
                  </Text>
                  
                  {/* Location Info */}
                  <View style={styles.locationInfo}>
                    <View style={styles.locationItem}>
                      <Ionicons name="location-outline" size={14} color="#B97232" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {ride.start_location}
                      </Text>
                    </View>
                    {ride.end_location && (
                      <>
                        <Ionicons name="arrow-forward" size={12} color="#666" style={styles.arrowIcon} />
                        <View style={styles.locationItem}>
                          <Text style={styles.locationText} numberOfLines={1}>
                            {ride.end_location}
                          </Text>
                        </View>
                      </>
                    )}
                    {ride.distance_km && (
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>
                          {typeof ride.distance_km === 'number' ? ride.distance_km.toFixed(1) : ride.distance_km} km
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Duration Box */}
                  {ride.estimated_duration_hours && (
                    <View style={styles.durationBox}>
                      <Ionicons name="time-outline" size={16} color="#B97232" />
                      <Text style={styles.durationText}>
                        {ride.estimated_duration_hours} hours
                      </Text>
                    </View>
                  )}
                  
                  {/* Card Info with Icons */}
                  <View style={styles.cardFooter}>
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="calendar-outline" size={16} color="#B97232" />
                      <Text style={styles.cardInfo}>
                        {new Date(ride.start_time).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="speedometer-outline" size={16} color="#B97232" />
                      <Text style={styles.cardInfo}>
                        {(ride.difficulty_level || 'moderate').charAt(0).toUpperCase() + (ride.difficulty_level || 'moderate').slice(1)}
                      </Text>
                    </View>
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="people-outline" size={16} color="#B97232" />
                      <Text style={styles.cardInfo}>
                        {ride.current_participants || 0}/{ride.max_participants || '∞'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={48} color="#B97232" />
              <Text style={styles.emptyText}>No upcoming rides</Text>
              <Text style={styles.emptySubtext}>Create a ride to connect with other cyclists</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateRide}>
                <Text style={styles.createButtonText}>Create Your First Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - only show if there are existing rides */}
      {rides.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreateRide}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#ECEAD1" />
        </TouchableOpacity>
      )}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar + safe area
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
  card: {
    backgroundColor: '#1C1C1C',
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
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionsButton: {
    padding: 4,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.8,
    marginBottom: 12,
  },
  cardDuration: {
    fontSize: 13,
    color: '#B97232',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  cardInfo: {
    fontSize: 12,
    color: '#ECEAD1',
    opacity: 0.7,
  },
  cardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  durationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#B97232',
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#B97232',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    opacity: 0.8,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#AB3801',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugButtonText: {
    color: '#ECEAD1',
    fontSize: 10,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 120,
  },
  locationText: {
    fontSize: 13,
    color: '#ECEAD1',
    opacity: 0.8,
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  distanceBadge: {
    backgroundColor: '#B97232',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#ECEAD1',
    fontWeight: '600',
  },
  trackRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trackRideText: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '600',
  },
});
