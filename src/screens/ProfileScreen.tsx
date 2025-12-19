import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalDistance: 0,
    posts: 0,
    completedRides: 0,
    experiencePoints: 0,
  });

  // Garage states
  const [bikes, setBikes] = useState<any[]>([]);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);
  
  // Bike form states
  const [bikeName, setBikeName] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikeYear, setBikeYear] = useState('');
  const [bikeColor, setBikeColor] = useState('');
  const [bikeType, setBikeType] = useState('Sports');
  const [savingBike, setSavingBike] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Form states
  const [editingFullName, setEditingFullName] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [editingLocation, setEditingLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Location states
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  // Predefined locations
  const popularLocations = [
    'New York, NY',
    'Brooklyn, NY',
    'Manhattan, NY',
    'Queens, NY',
    'The Bronx, NY',
    'Staten Island, NY',
    'Central Park, NY',
    'Williamsburg, Brooklyn',
    'DUMBO, Brooklyn',
    'Long Island City, Queens',
    'Astoria, Queens',
    'Jersey City, NJ',
    'Hoboken, NJ',
  ];

  // Helper functions
  const filterLocationSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    
    const filtered = popularLocations.filter(location =>
      location.toLowerCase().includes(input.toLowerCase())
    );
    
    return filtered.slice(0, 5);
  };

  const handleLocationChange = (text: string) => {
    setEditingLocation(text);
    const suggestions = filterLocationSuggestions(text);
    setLocationSuggestions(suggestions);
    setShowLocationDropdown(suggestions.length > 0 && text.length > 0);
  };

  const selectLocation = (location: string) => {
    setEditingLocation(location);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  const calculateExperienceLevel = (rides: number, distance: number) => {
    const points = rides * 10 + Math.floor(distance / 10);
    
    if (points < 50) return { level: 'Beginner', points, nextLevel: 50, badge: '🚴‍♂️' };
    if (points < 150) return { level: 'Casual Rider', points, nextLevel: 150, badge: '🚴‍♀️' };
    if (points < 300) return { level: 'Regular Cyclist', points, nextLevel: 300, badge: '🚵‍♂️' };
    if (points < 500) return { level: 'Cycling Enthusiast', points, nextLevel: 500, badge: '🚵‍♀️' };
    if (points < 800) return { level: 'Advanced Rider', points, nextLevel: 800, badge: '🏆' };
    if (points < 1200) return { level: 'Cycling Expert', points, nextLevel: 1200, badge: '⭐' };
    return { level: 'Cycling Legend', points, nextLevel: null, badge: '👑' };
  };

  const openEditModal = () => {
    setEditingFullName(profile?.full_name || '');
    setEditingBio(profile?.bio || '');
    setEditingLocation(profile?.location || '');
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editingFullName.trim(),
          bio: editingBio.trim(),
          location: editingLocation.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
      loadProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Bike management functions
  const loadBikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_bikes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.code === 'PGRST205') {
          console.log('user_bikes table not found - please create the table in Supabase');
          setBikes([]);
          return;
        }
        // Ignore "not found" errors
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }
      setBikes(data || []);
    } catch (error) {
      console.error('Error loading bikes:', error);
      setBikes([]);
    }
  };

  const openAddBikeModal = () => {
    setEditingBike(null);
    setBikeName('');
    setBikeModel('');
    setBikeYear('');
    setBikeColor('');
    setBikeType('Sports');
    setShowAddBikeModal(true);
  };

  const openEditBikeModal = (bike: any) => {
    setEditingBike(bike);
    setBikeName(bike.name || '');
    setBikeModel(bike.model || '');
    setBikeYear(bike.year || '');
    setBikeColor(bike.color || '');
    setBikeType(bike.type || 'Sports');
    setShowAddBikeModal(true);
  };

  const saveBike = async () => {
    if (!user || !bikeName.trim()) {
      Alert.alert('Error', 'Please enter a bike name');
      return;
    }

    setSavingBike(true);
    try {
      const bikeData = {
        user_id: user.id,
        name: bikeName.trim(),
        model: bikeModel.trim(),
        year: bikeYear ? parseInt(bikeYear) : null,
        color: bikeColor.trim(),
        type: bikeType,
        updated_at: new Date().toISOString(),
      };

      if (editingBike) {
        const { error } = await supabase
          .from('user_bikes')
          .update(bikeData)
          .eq('id', editingBike.id);
        if (error) {
          if (error.code === 'PGRST205') {
            Alert.alert('Error', 'Please create the user_bikes table in your Supabase database first. Check the database folder for the SQL script.');
            return;
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('user_bikes')
          .insert({ ...bikeData, created_at: new Date().toISOString() });
        if (error) {
          if (error.code === 'PGRST205') {
            Alert.alert('Error', 'Please create the user_bikes table in your Supabase database first. Check the database folder for the SQL script.');
            return;
          }
          throw error;
        }
      }

      Alert.alert('Success', `Bike ${editingBike ? 'updated' : 'added'} successfully!`);
      setShowAddBikeModal(false);
      loadBikes();
    } catch (error) {
      console.error('Error saving bike:', error);
      Alert.alert('Error', 'Failed to save bike');
    } finally {
      setSavingBike(false);
    }
  };

  const deleteBike = async (bikeId: string) => {
    Alert.alert(
      'Delete Bike',
      'Are you sure you want to delete this bike?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_bikes')
                .delete()
                .eq('id', bikeId);

              if (error) throw error;
              loadBikes();
            } catch (error) {
              console.error('Error deleting bike:', error);
              Alert.alert('Error', 'Failed to delete bike');
            }
          },
        },
      ]
    );
  };

  const bikeTypes = ['Sports', 'Cruiser', 'Touring', 'Adventure', 'Dirt Bike', 'Scooter', 'Electric', 'Other'];

  useEffect(() => {
    loadProfile();
    loadStats();
    loadBikes();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data || {});
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const [ridesResponse, postsResponse, participantsResponse] = await Promise.all([
        supabase
          .from('rides')
          .select('*')
          .eq('created_by', user.id),
        supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('ride_participants')
          .select('*')
          .eq('user_id', user.id)
      ]);

      const totalRides = (ridesResponse.data?.length || 0) + (participantsResponse.data?.length || 0);
      const totalDistance = Math.floor(Math.random() * 500) + totalRides * 15; // Simulated distance
      const experienceLevel = calculateExperienceLevel(totalRides, totalDistance);

      setStats({
        totalRides,
        totalDistance,
        posts: postsResponse.data?.length || 0,
        completedRides: participantsResponse.data?.length || 0,
        experiencePoints: experienceLevel.points,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Ionicons name="pencil" size={20} color="#ECEAD1" />
        </TouchableOpacity>
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.username}>
          {profile?.full_name || profile?.username || 'User'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {/* Experience Level Badge */}
        <View style={styles.experienceBadge}>
          <Text style={styles.experienceEmoji}>
            {calculateExperienceLevel(stats.totalRides, stats.totalDistance).badge}
          </Text>
          <Text style={styles.experienceLevel}>
            {calculateExperienceLevel(stats.totalRides, stats.totalDistance).level}
          </Text>
          <Text style={styles.experiencePoints}>
            {stats.experiencePoints} XP
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalRides}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalDistance}</Text>
            <Text style={styles.statLabel}>KM Driven</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Experience Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Experience Progress</Text>
            <Text style={styles.progressXP}>{stats.experiencePoints} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(
                    (stats.experiencePoints / (calculateExperienceLevel(stats.totalRides, stats.totalDistance).nextLevel || stats.experiencePoints)) * 100, 
                    100
                  )}%` 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {(() => {
              const expLevel = calculateExperienceLevel(stats.totalRides, stats.totalDistance);
              return expLevel.nextLevel 
                ? `${expLevel.nextLevel - stats.experiencePoints} XP to next level`
                : 'Max level reached! 🎉';
            })()}
          </Text>
        </View>

        {/* Garage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Garage</Text>
            <TouchableOpacity onPress={() => setShowGarageModal(true)}>
              <Ionicons name="car" size={20} color="#B97232" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.garageCard} onPress={() => setShowGarageModal(true)}>
            <View style={styles.garageInfo}>
              <Ionicons name="bicycle" size={24} color="#B97232" />
              <View style={styles.garageText}>
                <Text style={styles.garageTitle}>
                  {bikes.length} Bike{bikes.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.garageSubtitle}>
                  {bikes.length > 0 ? 'Tap to manage your bikes' : 'Add your first bike'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B97232" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Ionicons name="pencil" size={20} color="#B97232" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>{profile?.bio || 'No bio yet'}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{profile?.location || 'Not set'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={saveProfile}
              disabled={saving}
              style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
            >
              <Text style={[styles.modalSaveButtonText, saving && styles.modalSaveButtonTextDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editingFullName}
                onChangeText={setEditingFullName}
                placeholder="Enter your full name"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingBio}
                onChangeText={setEditingBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={editingLocation}
                onChangeText={handleLocationChange}
                onFocus={() => {
                  if (editingLocation) {
                    const suggestions = filterLocationSuggestions(editingLocation);
                    setLocationSuggestions(suggestions);
                    setShowLocationDropdown(suggestions.length > 0);
                  }
                }}
                placeholder="Enter your location"
                maxLength={100}
              />
              {showLocationDropdown && (
                <View style={styles.dropdownList}>
                  {locationSuggestions.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => selectLocation(location)}
                    >
                      <Ionicons name="location-outline" size={16} color="#B97232" />
                      <Text style={styles.dropdownItemText}>{location}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => setShowLocationModal(true)}
              >
                <Ionicons name="map-outline" size={20} color="#B97232" />
                <Text style={styles.mapButtonText}>Select on Map</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Location Map Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Select Location</Text>
            <TouchableOpacity
              onPress={() => {
                setEditingLocation(`${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`);
                setShowLocationModal(false);
              }}
            >
              <Text style={styles.mapSaveText}>Select</Text>
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.map}
            region={selectedLocation}
            onPress={(e) => {
              setSelectedLocation({
                ...selectedLocation,
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              });
            }}
          >
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Selected Location"
            />
          </MapView>
        </View>
      </Modal>

      {/* Garage Modal */}
      <Modal
        visible={showGarageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGarageModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>My Garage</Text>
            <TouchableOpacity onPress={openAddBikeModal}>
              <Ionicons name="add" size={24} color="#B97232" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {bikes.length > 0 ? (
              bikes.map((bike) => (
                <View key={bike.id} style={styles.bikeCard}>
                  <View style={styles.bikeHeader}>
                    <Text style={styles.bikeName}>{bike.name}</Text>
                    <View style={styles.bikeActions}>
                      <TouchableOpacity onPress={() => openEditBikeModal(bike)}>
                        <Ionicons name="pencil" size={20} color="#B97232" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteBike(bike.id)}>
                        <Ionicons name="trash" size={20} color="#AB3801" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {bike.model && (
                    <View style={styles.bikeDetail}>
                      <Ionicons name="settings" size={16} color="#B97232" />
                      <Text style={styles.bikeDetailText}>{bike.model}</Text>
                    </View>
                  )}
                  
                  {bike.year && (
                    <View style={styles.bikeDetail}>
                      <Ionicons name="calendar" size={16} color="#B97232" />
                      <Text style={styles.bikeDetailText}>{bike.year}</Text>
                    </View>
                  )}
                  
                  {bike.color && (
                    <View style={styles.bikeDetail}>
                      <Ionicons name="color-palette" size={16} color="#B97232" />
                      <Text style={styles.bikeDetailText}>{bike.color}</Text>
                    </View>
                  )}
                  
                  <View style={styles.bikeDetail}>
                    <Ionicons name="bicycle" size={16} color="#B97232" />
                    <Text style={styles.bikeDetailText}>{bike.type}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyGarage}>
                <Ionicons name="bicycle" size={48} color="#B97232" />
                <Text style={styles.emptyGarageText}>
                  No bikes in your garage yet.{'\n'}Add your first bike to get started!
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.addBikeButton} onPress={openAddBikeModal}>
              <Text style={styles.addBikeButtonText}>Add New Bike</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add/Edit Bike Modal */}
      <Modal
        visible={showAddBikeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddBikeModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingBike ? 'Edit Bike' : 'Add New Bike'}
            </Text>
            <TouchableOpacity
              onPress={saveBike}
              disabled={savingBike || !bikeName.trim()}
              style={[
                styles.modalSaveButton,
                (savingBike || !bikeName.trim()) && styles.modalSaveButtonDisabled
              ]}
            >
              <Text style={[
                styles.modalSaveButtonText,
                (savingBike || !bikeName.trim()) && styles.modalSaveButtonTextDisabled
              ]}>
                {savingBike ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bike Name *</Text>
              <TextInput
                style={styles.input}
                value={bikeName}
                onChangeText={setBikeName}
                placeholder="e.g., My Royal Enfield"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                value={bikeModel}
                onChangeText={setBikeModel}
                placeholder="e.g., Classic 350"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.input}
                value={bikeYear}
                onChangeText={setBikeYear}
                placeholder="e.g., 2023"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <TextInput
                style={styles.input}
                value={bikeColor}
                onChangeText={setBikeColor}
                placeholder="e.g., Royal Blue"
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 12 }}>
                  {bikeTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        {
                          backgroundColor: bikeType === type ? '#B97232' : 'transparent',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: '#B97232',
                        }
                      ]}
                      onPress={() => setBikeType(type)}
                    >
                      <Text style={[
                        styles.picker,
                        { color: bikeType === type ? '#ECEAD1' : '#B97232' }
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
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
    backgroundColor: '#1C1C1C',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECEAD1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B97232',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEAD1',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#B97232',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar + safe area
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1C',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEAD1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B97232',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B97232',
  },
  infoLabel: {
    fontSize: 12,
    color: '#B97232',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ECEAD1',
  },
  signOutButton: {
    backgroundColor: '#AB3801',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ECEAD1',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  experienceBadge: {
    backgroundColor: 'rgba(185, 114, 50, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B97232',
  },
  experienceEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  experienceLevel: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '600',
  },
  experiencePoints: {
    color: '#B97232',
    fontSize: 12,
  },
  progressContainer: {
    backgroundColor: '#1C1C1C',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#B97232',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  progressXP: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B97232',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#121318',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#B97232',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B97232',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#B97232',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121318',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
    backgroundColor: '#1C1C1C',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  modalSaveButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#AB3801',
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveButtonTextDisabled: {
    color: '#ECEAD1',
    opacity: 0.7,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ECEAD1',
    backgroundColor: '#1C1C1C',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 150,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#ECEAD1',
    marginLeft: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#B97232',
  },
  mapButtonText: {
    color: '#B97232',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#121318',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
    backgroundColor: '#1C1C1C',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  mapSaveText: {
    color: '#B97232',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  garageCard: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B97232',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  garageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  garageText: {
    marginLeft: 12,
    flex: 1,
  },
  garageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 2,
  },
  garageSubtitle: {
    fontSize: 14,
    color: '#B97232',
  },
  bikeCard: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B97232',
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  bikeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bikeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bikeDetailText: {
    fontSize: 14,
    color: '#B97232',
    marginLeft: 8,
  },
  addBikeButton: {
    backgroundColor: '#B97232',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addBikeButtonText: {
    color: '#ECEAD1',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyGarage: {
    backgroundColor: '#1C1C1C',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B97232',
  },
  emptyGarageText: {
    color: '#B97232',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
    marginBottom: 12,
  },
  picker: {
    color: '#ECEAD1',
  },
});
