import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistanceBetweenCities, getCityCoordinates } from '../lib/distanceUtils';

// Popular Indian cities for biking
const INDIAN_CITIES = [
  'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
  'Ahmedabad, Gujarat', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Surat, Gujarat',
  'Pune, Maharashtra', 'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
  'Nagpur, Maharashtra', 'Indore, Madhya Pradesh', 'Thane, Maharashtra', 'Bhopal, Madhya Pradesh',
  'Visakhapatnam, Andhra Pradesh', 'Pimpri-Chinchwad, Maharashtra', 'Patna, Bihar', 'Vadodara, Gujarat',
  'Ghaziabad, Uttar Pradesh', 'Ludhiana, Punjab', 'Agra, Uttar Pradesh', 'Nashik, Maharashtra',
  'Faridabad, Haryana', 'Meerut, Uttar Pradesh', 'Rajkot, Gujarat', 'Kalyan-Dombivali, Maharashtra',
  'Vasai-Virar, Maharashtra', 'Varanasi, Uttar Pradesh', 'Srinagar, Jammu and Kashmir', 'Aurangabad, Maharashtra',
  'Dhanbad, Jharkhand', 'Amritsar, Punjab', 'Navi Mumbai, Maharashtra', 'Allahabad, Uttar Pradesh',
  'Howrah, West Bengal', 'Ranchi, Jharkhand', 'Gwalior, Madhya Pradesh', 'Jabalpur, Madhya Pradesh',
  'Coimbatore, Tamil Nadu', 'Vijayawada, Andhra Pradesh', 'Jodhpur, Rajasthan', 'Madurai, Tamil Nadu',
  'Raipur, Chhattisgarh', 'Kota, Rajasthan', 'Chandigarh, Chandigarh', 'Guwahati, Assam',
  'Solapur, Maharashtra', 'Hubli-Dharwad, Karnataka', 'Tiruchirappalli, Tamil Nadu', 'Bareilly, Uttar Pradesh',
  'Mysore, Karnataka', 'Tiruppur, Tamil Nadu', 'Gurgaon, Haryana', 'Aligarh, Uttar Pradesh',
  'Jalandhar, Punjab', 'Bhubaneswar, Odisha', 'Salem, Tamil Nadu', 'Warangal, Telangana',
  'Guntur, Andhra Pradesh', 'Bhiwandi, Maharashtra', 'Saharanpur, Uttar Pradesh', 'Gorakhpur, Uttar Pradesh',
  'Bikaner, Rajasthan', 'Amravati, Maharashtra', 'Noida, Uttar Pradesh', 'Jamshedpur, Jharkhand',
  'Bhilai, Chhattisgarh', 'Cuttack, Odisha', 'Firozabad, Uttar Pradesh', 'Kochi, Kerala',
  'Nellore, Andhra Pradesh', 'Bhavnagar, Gujarat', 'Dehradun, Uttarakhand', 'Durgapur, West Bengal',
  'Asansol, West Bengal', 'Rourkela, Odisha', 'Nanded, Maharashtra', 'Kolhapur, Maharashtra',
  'Ajmer, Rajasthan', 'Akola, Maharashtra', 'Gulbarga, Karnataka', 'Jamnagar, Gujarat',
  'Ujjain, Madhya Pradesh', 'Loni, Uttar Pradesh', 'Siliguri, West Bengal', 'Jhansi, Uttar Pradesh',
  'Ulhasnagar, Maharashtra', 'Jammu, Jammu and Kashmir', 'Sangli-Miraj & Kupwad, Maharashtra',
  'Mangalore, Karnataka', 'Erode, Tamil Nadu', 'Belgaum, Karnataka', 'Ambattur, Tamil Nadu',
  'Tirunelveli, Tamil Nadu', 'Malegaon, Maharashtra', 'Gaya, Bihar', 'Jalgaon, Maharashtra',
  'Udaipur, Rajasthan', 'Maheshtala, West Bengal', 'Davanagere, Karnataka', 'Kozhikode, Kerala'
];

export default function CreateRideScreen({ navigation }: any) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [maxParticipants, setMaxParticipants] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [durationHours, setDurationHours] = useState('2');
  const [durationMinutes, setDurationMinutes] = useState('0');

  
  // Location dropdown states
  const [showStartLocationModal, setShowStartLocationModal] = useState(false);
  const [showEndLocationModal, setShowEndLocationModal] = useState(false);
  const [startLocationSearch, setStartLocationSearch] = useState('');
  const [endLocationSearch, setEndLocationSearch] = useState('');
  
  // Duration dropdown states
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  
  // Date/Time dropdown states
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const difficultyLevels = ['easy', 'moderate', 'hard', 'expert'];
  const hours = Array.from({ length: 24 }, (_, i) => i.toString());
  const minutes = ['0', '15', '30', '45'];

  // Filter cities based on search
  const getFilteredCities = (searchText: string) => {
    if (!searchText.trim()) return INDIAN_CITIES.slice(0, 20); // Show first 20 cities
    return INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 20);
  };

  // Generate date options (next 30 days)
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0], // Use ISO string as key
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        dateObj: date
      });
    }
    return dates;
  };

  // Generate time options (15-minute intervals)
  const getTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push({
          value: timeString, // Use time string as key
          label: new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          hour,
          minute
        });
      }
    }
    return times;
  };

  const handleCreateRide = async () => {
    if (!title.trim() || !description.trim() || !startLocation.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create rides');
      return;
    }

    setLoading(true);

    try {
      // Convert duration to hours (decimal)
      const durationInHours = parseInt(durationHours) + (parseInt(durationMinutes) / 60);

      // Get coordinates for start location
      const startCoords = getCityCoordinates(startLocation.trim());
      const startCoordinatesString = startCoords 
        ? `(${startCoords.lng},${startCoords.lat})` 
        : '(77.2090,28.6139)'; // Default to Delhi if not found

      // Calculate distance if end location is provided
      let calculatedDistance = null;
      if (endLocation.trim()) {
        calculatedDistance = calculateDistanceBetweenCities(startLocation.trim(), endLocation.trim());
        console.log(`Calculated distance from ${startLocation.trim()} to ${endLocation.trim()}: ${calculatedDistance} km`);
      }

      const rideData = {
        title: title.trim(),
        description: description.trim(),
        start_location: startLocation.trim(),
        start_coordinates: startCoordinatesString,
        end_location: endLocation.trim() || null,
        distance_km: calculatedDistance,
        start_time: startTime.toISOString(),
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        difficulty_level: difficulty,
        estimated_duration_hours: durationInHours,
        organizer_id: user.id,
        status: 'scheduled',
        current_participants: 1,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('rides')
        .insert([rideData]);

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your ride has been created!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert('Error', error.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#ECEAD1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Ride</Text>
          <TouchableOpacity 
            onPress={handleCreateRide} 
            style={[styles.headerButton, { opacity: loading ? 0.5 : 1 }]}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter ride title"
              placeholderTextColor="#666"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your ride"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Start Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Location *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStartLocationModal(true)}
            >
              <Text style={[styles.dropdownText, !startLocation && styles.placeholderText]}>
                {startLocation || 'Select start location'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#B97232" />
            </TouchableOpacity>
          </View>

          {/* End Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Location</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowEndLocationModal(true)}
            >
              <Text style={[styles.dropdownText, !endLocation && styles.placeholderText]}>
                {endLocation || 'Select end location (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#B97232" />
            </TouchableOpacity>
          </View>

          {/* Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDateModal(true)}
              >
                <Text style={styles.dateTimeText}>
                  {startTime.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#B97232" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimeModal(true)}
              >
                <Text style={styles.dateTimeText}>
                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#B97232" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulty Level</Text>
            <View style={styles.difficultyContainer}>
              {difficultyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === level && styles.difficultyTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Participants */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Participants</Text>
            <TextInput
              style={styles.input}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Leave empty for unlimited"
              placeholderTextColor="#666"
              keyboardType="number-pad"
            />
          </View>

          {/* Estimated Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Duration</Text>
            <View style={styles.durationContainer}>
              <View style={styles.durationField}>
                <Text style={styles.durationLabel}>Hours</Text>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => setShowHoursModal(true)}
                >
                  <Text style={styles.durationText}>{durationHours}</Text>
                  <Ionicons name="chevron-down" size={16} color="#B97232" />
                </TouchableOpacity>
              </View>
              <View style={styles.durationField}>
                <Text style={styles.durationLabel}>Minutes</Text>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => setShowMinutesModal(true)}
                >
                  <Text style={styles.durationText}>{durationMinutes}</Text>
                  <Ionicons name="chevron-down" size={16} color="#B97232" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Date Selection Modal */}
        <Modal
          visible={showDateModal}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowDateModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <ScrollView style={styles.optionsList}>
                {getDateOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.option}
                    onPress={() => {
                      const newDate = new Date(startTime);
                      newDate.setFullYear(option.dateObj.getFullYear(), option.dateObj.getMonth(), option.dateObj.getDate());
                      setStartTime(newDate);
                      setShowDateModal(false);
                    }}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Time Selection Modal */}
        <Modal
          visible={showTimeModal}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowTimeModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <ScrollView style={styles.optionsList}>
                {getTimeOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.option}
                    onPress={() => {
                      const newDate = new Date(startTime);
                      const [hours, minutes] = option.value.split(':').map(Number);
                      newDate.setHours(hours, minutes);
                      setStartTime(newDate);
                      setShowTimeModal(false);
                    }}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Start Location Modal */}
        <Modal
          visible={showStartLocationModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowStartLocationModal(false)}>
                <Ionicons name="close" size={24} color="#ECEAD1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Start Location</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={startLocationSearch}
                onChangeText={setStartLocationSearch}
                placeholder="Search cities..."
                placeholderTextColor="#666"
              />
            </View>
            <FlatList
              data={getFilteredCities(startLocationSearch)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => {
                    setStartLocation(item);
                    setShowStartLocationModal(false);
                    setStartLocationSearch('');
                  }}
                >
                  <Ionicons name="location" size={20} color="#B97232" />
                  <Text style={styles.locationText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* End Location Modal */}
        <Modal
          visible={showEndLocationModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEndLocationModal(false)}>
                <Ionicons name="close" size={24} color="#ECEAD1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select End Location</Text>
              <TouchableOpacity onPress={() => {
                setEndLocation('');
                setShowEndLocationModal(false);
                setEndLocationSearch('');
              }}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={endLocationSearch}
                onChangeText={setEndLocationSearch}
                placeholder="Search cities..."
                placeholderTextColor="#666"
              />
            </View>
            <FlatList
              data={getFilteredCities(endLocationSearch)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => {
                    setEndLocation(item);
                    setShowEndLocationModal(false);
                    setEndLocationSearch('');
                  }}
                >
                  <Ionicons name="location" size={20} color="#B97232" />
                  <Text style={styles.locationText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Hours Modal */}
        <Modal
          visible={showHoursModal}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHoursModal(false)}>
                <Ionicons name="close" size={24} color="#ECEAD1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Hours</Text>
              <View style={{ width: 24 }} />
            </View>
            <FlatList
              data={hours}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.durationItem, durationHours === item && styles.selectedDurationItem]}
                  onPress={() => {
                    setDurationHours(item);
                    setShowHoursModal(false);
                  }}
                >
                  <Text style={[styles.durationItemText, durationHours === item && styles.selectedDurationText]}>
                    {item} {item === '1' ? 'hour' : 'hours'}
                  </Text>
                  {durationHours === item && <Ionicons name="checkmark" size={20} color="#B97232" />}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Minutes Modal */}
        <Modal
          visible={showMinutesModal}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMinutesModal(false)}>
                <Ionicons name="close" size={24} color="#ECEAD1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Minutes</Text>
              <View style={{ width: 24 }} />
            </View>
            <FlatList
              data={minutes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.durationItem, durationMinutes === item && styles.selectedDurationItem]}
                  onPress={() => {
                    setDurationMinutes(item);
                    setShowMinutesModal(false);
                  }}
                >
                  <Text style={[styles.durationItemText, durationMinutes === item && styles.selectedDurationText]}>
                    {item} {item === '1' ? 'minute' : 'minutes'}
                  </Text>
                  {durationMinutes === item && <Ionicons name="checkmark" size={20} color="#B97232" />}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B97232',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEAD1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#ECEAD1',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateTimeButton: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    color: '#ECEAD1',
    fontSize: 16,
    fontWeight: '500',
  },
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  difficultyButton: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#B97232',
    borderColor: '#B97232',
  },
  difficultyText: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyTextActive: {
    color: '#ECEAD1',
    fontWeight: '600',
  },
  // Dropdown styles
  dropdownButton: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#ECEAD1',
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: '#666',
  },
  // Duration styles
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  durationField: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 14,
    color: '#ECEAD1',
    marginBottom: 4,
    opacity: 0.8,
  },
  durationButton: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    color: '#ECEAD1',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121318',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  clearText: {
    fontSize: 16,
    color: '#B97232',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: '#ECEAD1',
    fontSize: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  locationText: {
    color: '#ECEAD1',
    fontSize: 16,
    marginLeft: 12,
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  selectedDurationItem: {
    backgroundColor: '#1C1C1C',
  },
  durationItemText: {
    color: '#ECEAD1',
    fontSize: 16,
  },
  selectedDurationText: {
    color: '#B97232',
    fontWeight: '600',
  },
  // Date/Time picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#121318',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  optionText: {
    color: '#ECEAD1',
    fontSize: 16,
  },
});