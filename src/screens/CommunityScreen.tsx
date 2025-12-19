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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  
  // Form states for group creation
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCategory, setGroupCategory] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Form states for event creation
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const [eventLocation, setEventLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showMaxAttendeesDropdown, setShowMaxAttendeesDropdown] = useState(false);
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  
  // Location states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  // Predefined options
  const categoryOptions = [
    'Racing',
    'Touring',
    'Social',
    'Training',
    'Mountain Biking',
    'Road Cycling',
    'Commuting',
    'Family Friendly',
    'Competitive',
    'Recreational'
  ];

  const popularLocations = [
    'Central Park Main Entrance',
    'Brooklyn Bridge Park',
    'Hudson River Greenway',
    'Prospect Park Loop',
    'East River Esplanade',
    'The High Line',
    'Battery Park',
    'Riverside Park',
    'Queens Borough Bridge',
    'Coney Island Boardwalk',
    'Times Square',
    'Washington Square Park',
    'Bryant Park',
    'Madison Square Park',
    'Union Square',
    'Brooklyn Heights Promenade',
    'DUMBO Waterfront'
  ];

  const maxAttendeesOptions = ['5', '10', '15', '20', '25', '30', '50', '100'];

  // Helper functions
  const filterLocationSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    
    const filtered = popularLocations.filter(location =>
      location.toLowerCase().includes(input.toLowerCase())
    );
    
    return filtered.slice(0, 5);
  };

  const handleLocationChange = (text: string) => {
    setEventLocation(text);
    const suggestions = filterLocationSuggestions(text);
    setLocationSuggestions(suggestions);
    setShowLocationDropdown(suggestions.length > 0 && text.length > 0);
  };

  const selectLocation = (location: string) => {
    setEventLocation(location);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDateTime = new Date(eventDate);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setEventDate(newDateTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDateTime = new Date(eventDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setEventDate(newDateTime);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need location permission to get your current location');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation(location);

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        
        setEventLocation(formattedAddress);
      } else {
        setEventLocation(`${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      }

      setShowLocationModal(false);
      Alert.alert('Success', 'Current location selected!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const openLocationModal = () => {
    setShowLocationModal(true);
    setShowLocationDropdown(false);
    setShowCategoryDropdown(false);
    setShowMaxAttendeesDropdown(false);
  };

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

  const createGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    if (!groupName.trim() || !groupDescription.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreatingGroup(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: groupName.trim(),
            description: groupDescription.trim(),
            category: groupCategory.trim() || 'General',
            created_by: user.id,
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Group created successfully!');
      setShowCreateGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setGroupCategory('');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const createEvent = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreatingEvent(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: eventTitle.trim(),
            description: eventDescription.trim(),
            event_date: eventDate.toISOString(),
            location: eventLocation.trim(),
            max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
            created_by: user.id,
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Event created successfully!');
      setShowCreateEventModal(false);
      setEventTitle('');
      setEventDescription('');
      setEventDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setEventLocation('');
      setMaxAttendees('');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Groups</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateGroupModal(true)}
            >
              <Ionicons name="add" size={20} color="#ECEAD1" />
            </TouchableOpacity>
          </View>
          
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No groups found</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateGroupModal(true)}
              >
                <Ionicons name="add" size={16} color="#ECEAD1" />
                <Text style={styles.createButtonText}>Create First Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateEventModal(true)}
            >
              <Ionicons name="add" size={20} color="#ECEAD1" />
            </TouchableOpacity>
          </View>
          
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No upcoming events</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateEventModal(true)}
              >
                <Ionicons name="add" size={16} color="#ECEAD1" />
                <Text style={styles.createButtonText}>Create First Event</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TouchableOpacity
              onPress={createGroup}
              disabled={creatingGroup || !groupName.trim() || !groupDescription.trim()}
              style={[
                styles.modalSaveButton,
                (creatingGroup || !groupName.trim() || !groupDescription.trim()) && styles.modalSaveButtonDisabled
              ]}
            >
              <Text style={[
                styles.modalSaveButtonText,
                (creatingGroup || !groupName.trim() || !groupDescription.trim()) && styles.modalSaveButtonTextDisabled
              ]}>
                {creatingGroup ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g., Weekend Warriors"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="Describe what your group is about..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={[styles.inputGroup, showCategoryDropdown && styles.inputGroupActive]}>
              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowLocationDropdown(false);
                  setShowMaxAttendeesDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, !groupCategory && styles.dropdownPlaceholder]}>
                  {groupCategory || 'Select a category'}
                </Text>
                <Ionicons 
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#B97232" 
                />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {categoryOptions.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        index === categoryOptions.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        setGroupCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateEventModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity
              onPress={createEvent}
              disabled={creatingEvent || !eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()}
              style={[
                styles.modalSaveButton,
                (creatingEvent || !eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) && styles.modalSaveButtonDisabled
              ]}
            >
              <Text style={[
                styles.modalSaveButtonText,
                (creatingEvent || !eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) && styles.modalSaveButtonTextDisabled
              ]}>
                {creatingEvent ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="e.g., Central Park Group Ride"
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Describe the event details..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date & Time *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {eventDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#B97232" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#B97232" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.inputGroup, showLocationDropdown && styles.inputGroupActive]}>
              <Text style={styles.inputLabel}>Location *</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  value={eventLocation}
                  onChangeText={handleLocationChange}
                  onFocus={() => {
                    setShowCategoryDropdown(false);
                    setShowMaxAttendeesDropdown(false);
                    if (eventLocation) {
                      const suggestions = filterLocationSuggestions(eventLocation);
                      setLocationSuggestions(suggestions);
                      setShowLocationDropdown(suggestions.length > 0);
                    }
                  }}
                  placeholder="e.g., Central Park Main Entrance"
                  maxLength={200}
                />
                <TouchableOpacity
                  style={styles.locationOptionsButton}
                  onPress={openLocationModal}
                >
                  <Ionicons name="location" size={20} color="#B97232" />
                </TouchableOpacity>
              </View>
              {showLocationDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {locationSuggestions.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        index === locationSuggestions.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => selectLocation(location)}
                    >
                      <Ionicons name="location-outline" size={16} color="#B97232" />
                      <Text style={styles.dropdownItemText}>{location}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={[styles.inputGroup, showMaxAttendeesDropdown && styles.inputGroupActive]}>
              <Text style={styles.inputLabel}>Max Attendees (Optional)</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowMaxAttendeesDropdown(!showMaxAttendeesDropdown);
                  setShowCategoryDropdown(false);
                  setShowLocationDropdown(false);
                }}
              >
                <Text style={[styles.dropdownButtonText, !maxAttendees && styles.dropdownPlaceholder]}>
                  {maxAttendees ? `${maxAttendees} people` : 'Select max attendees'}
                </Text>
                <Ionicons 
                  name={showMaxAttendeesDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#B97232" 
                />
              </TouchableOpacity>
              {showMaxAttendeesDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {maxAttendeesOptions.map((number, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        index === maxAttendeesOptions.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        setMaxAttendees(number);
                        setShowMaxAttendeesDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{number} people</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        {Platform.OS === 'ios' ? (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity 
              style={styles.pickerOverlayTouchable}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={eventDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  textColor="#ECEAD1"
                />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        {Platform.OS === 'ios' ? (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity 
              style={styles.pickerOverlayTouchable}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            >
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={eventDate}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  textColor="#ECEAD1"
                />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Ionicons name="close" size={24} color="#ECEAD1" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.locationModalContent}>
            {/* Current Location Option */}
            <TouchableOpacity
              style={styles.locationOptionCard}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              <View style={styles.locationOptionIconContainer}>
                <Ionicons 
                  name="locate" 
                  size={24} 
                  color={loadingLocation ? "#666" : "#B97232"} 
                />
              </View>
              <View style={styles.locationOptionContent}>
                <Text style={[styles.locationOptionTitle, loadingLocation && styles.locationOptionTitleDisabled]}>
                  {loadingLocation ? 'Getting location...' : 'Use Current Location'}
                </Text>
                <Text style={styles.locationOptionDescription}>
                  Automatically detect your current location
                </Text>
              </View>
              {loadingLocation && (
                <View style={styles.locationOptionLoader}>
                  <Ionicons name="refresh" size={20} color="#B97232" />
                </View>
              )}
            </TouchableOpacity>

            {/* Map Selection Option */}
            <TouchableOpacity
              style={styles.locationOptionCard}
              onPress={() => {
                Alert.alert(
                  'Map Selection',
                  'Map selection feature coming soon! For now, please type your location manually or use current location.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.locationOptionIconContainer}>
                <Ionicons name="map" size={24} color="#B97232" />
              </View>
              <View style={styles.locationOptionContent}>
                <Text style={styles.locationOptionTitle}>Select from Map</Text>
                <Text style={styles.locationOptionDescription}>
                  Choose a location from the map (Coming Soon)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Manual Entry Option */}
            <TouchableOpacity
              style={styles.locationOptionCard}
              onPress={() => setShowLocationModal(false)}
            >
              <View style={styles.locationOptionIconContainer}>
                <Ionicons name="create" size={24} color="#B97232" />
              </View>
              <View style={styles.locationOptionContent}>
                <Text style={styles.locationOptionTitle}>Type Manually</Text>
                <Text style={styles.locationOptionDescription}>
                  Enter the location address manually
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Popular Locations */}
            <View style={styles.popularLocationsSection}>
              <Text style={styles.popularLocationsTitle}>Popular Locations</Text>
              {popularLocations.slice(0, 8).map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularLocationItem}
                  onPress={() => {
                    setEventLocation(location);
                    setShowLocationModal(false);
                  }}
                >
                  <Ionicons name="location-outline" size={16} color="#B97232" />
                  <Text style={styles.popularLocationText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B97232',
    justifyContent: 'center',
    alignItems: 'center',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    fontSize: 12,
    color: '#ECEAD1',
    opacity: 0.7,
  },
  cardBadge: {
    fontSize: 11,
    color: '#ECEAD1',
    backgroundColor: '#B97232',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#ECEAD1',
    opacity: 0.7,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  createButtonText: {
    color: '#ECEAD1',
    fontSize: 14,
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
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  inputGroupActive: {
    zIndex: 9999,
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1C1C1C',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#ECEAD1',
  },
  dropdownPlaceholder: {
    color: '#ECEAD1',
    opacity: 0.7,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#B97232',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#1C1C1C',
    maxHeight: 160,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(185, 114, 50, 0.3)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#ECEAD1',
    marginLeft: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1C1C1C',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#ECEAD1',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 19, 24, 0.9)',
    justifyContent: 'flex-end',
    zIndex: 10000,
    elevation: 20,
  },
  pickerOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B97232',
  },
  // Location input styles
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  locationOptionsButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Location modal styles
  locationModalContent: {
    paddingVertical: 20,
  },
  locationOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  locationOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(185, 114, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationOptionContent: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 4,
  },
  locationOptionTitleDisabled: {
    color: '#666',
  },
  locationOptionDescription: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.7,
  },
  locationOptionLoader: {
    marginLeft: 12,
  },
  popularLocationsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  popularLocationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 16,
  },
  popularLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  popularLocationText: {
    fontSize: 14,
    color: '#ECEAD1',
    marginLeft: 12,
  },
});
