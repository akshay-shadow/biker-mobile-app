import React, { useState } from 'react';
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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

interface CreateRideScreenProps {
  navigation: any;
  onRideCreated?: () => void;
}

export default function CreateRideScreen({ navigation, onRideCreated }: CreateRideScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startDateTime, setStartDateTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const [maxParticipants, setMaxParticipants] = useState('');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [durationHours, setDurationHours] = useState('2');
  const [durationMinutes, setDurationMinutes] = useState('0');

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location dropdown states
  const [showStartLocationModal, setShowStartLocationModal] = useState(false);
  const [showEndLocationModal, setShowEndLocationModal] = useState(false);
  const [startLocationSearch, setStartLocationSearch] = useState('');
  const [endLocationSearch, setEndLocationSearch] = useState('');
  
  // Duration dropdown states
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);

  const difficultyLevels = ['Easy', 'Moderate', 'Hard', 'Expert'];
  const hours = Array.from({ length: 24 }, (_, i) => i.toString());
  const minutes = ['0', '15', '30', '45'];

  // Filter cities based on search
  const getFilteredCities = (searchText: string) => {
    if (!searchText.trim()) return INDIAN_CITIES.slice(0, 20); // Show first 20 cities
    return INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 20);
  };





  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDateTime = new Date(startDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setStartDateTime(newDateTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDateTime = new Date(startDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setStartDateTime(newDateTime);
    }
  };

  const dismissDatePicker = () => {
    setShowDatePicker(false);
  };

  const dismissTimePicker = () => {
    setShowTimePicker(false);
  };

  const hideAllSuggestions = () => {
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    Keyboard.dismiss();
  };

  const handleCreateRide = async () => {
    if (!title.trim() || !description.trim() || !startLocation.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Description, Start Location)');
      return;
    }

    if (!startDateTime || startDateTime <= new Date()) {
      Alert.alert('Error', 'Please select a valid future date and time');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a ride');
      return;
    }

    setLoading(true);
    try {
      // Start with minimal required fields only
      const rideData: any = {
        title: title.trim(),
        description: description.trim(),
        start_location: startLocation.trim(),
        start_time: startDateTime.toISOString(),
        start_coordinates: '0,0', // Placeholder coordinates - you can implement geocoding later
        organizer_id: user.id,
        status: 'scheduled',
      };

      // Add optional fields only if they have values
      if (endLocation.trim()) {
        rideData.end_location = endLocation.trim();
      }
      
      if (maxParticipants) {
        rideData.max_participants = parseInt(maxParticipants);
      }

      // Try to add difficulty_level - comment out if it fails
      try {
        rideData.difficulty_level = difficulty;
        console.log('Adding difficulty_level:', difficulty);
      } catch (err) {
        console.log('Difficulty level field not available:', err);
      }

      // Try to add current_participants - comment out if it fails
      try {
        rideData.current_participants = 1;
      } catch (err) {
        console.log('Current participants field not available:', err);
      }

      // Format duration
      const formattedDuration = durationMinutes === '0' 
        ? `${durationHours} hours`
        : `${durationHours} hours ${durationMinutes} minutes`;
      rideData.estimated_duration = formattedDuration;

      console.log('Creating ride with data:', rideData);

      const { data, error } = await supabase
        .from('rides')
        .insert([rideData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Ride created successfully:', data);

      Alert.alert(
        'Success',
        'Your ride has been created!',
        [
          {
            text: 'OK',
            onPress: () => {
              onRideCreated?.();
              navigation.goBack();
            },
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
    if (title.trim() || description.trim() || startLocation.trim()) {
      Alert.alert(
        'Discard Ride',
        'Are you sure you want to discard your ride?',
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
            <Ionicons name="close" size={24} color="#ECEAD1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Ride</Text>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => navigation.navigate('RidesTableTest')}
          >
            <Text style={styles.debugButtonText}>Test DB</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleCreateRide} 
            style={[
              styles.headerButton, 
              styles.createButton,
              (!title.trim() || !description.trim() || !startLocation.trim() || loading) && styles.createButtonDisabled
            ]}
            disabled={!title.trim() || !description.trim() || !startLocation.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Morning City Loop"
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
                placeholder="Describe your ride, what to expect, meeting points..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            {/* Start Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Location *</Text>
              <TextInput
                style={styles.input}
                value={startLocation}
                onChangeText={handleStartLocationChange}
                onFocus={() => {
                  if (startLocation) {
                    const suggestions = filterLocationSuggestions(startLocation);
                    setStartLocationSuggestions(suggestions);
                    setShowStartSuggestions(suggestions.length > 0);
                  }
                }}
                placeholder="e.g., Central Park Main Entrance"
                maxLength={200}
              />
              {showStartSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {startLocationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectStartLocationSuggestion(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={16} color="#B97232" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* End Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={endLocation}
                onChangeText={handleEndLocationChange}
                onFocus={() => {
                  if (endLocation) {
                    const suggestions = filterLocationSuggestions(endLocation);
                    setEndLocationSuggestions(suggestions);
                    setShowEndSuggestions(suggestions.length > 0);
                  }
                }}
                placeholder="e.g., Brooklyn Bridge (leave empty if same as start)"
                maxLength={200}
              />
              {showEndSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {endLocationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectEndLocationSuggestion(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={16} color="#B97232" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Date & Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {startDateTime.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#B97232" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#B97232" />
              </TouchableOpacity>
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
                      difficulty === level && styles.difficultyButtonActive
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text style={[
                      styles.difficultyText,
                      difficulty === level && styles.difficultyTextActive
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Participants */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Participants (Optional)</Text>
              <TextInput
                style={styles.input}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                placeholder="Leave empty for unlimited"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Estimated Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Duration (Hours)</Text>
              <TextInput
                style={styles.input}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                placeholder="e.g., 2.5 for 2.5 hours"
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <>
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={styles.pickerOverlay} 
                onPress={dismissDatePicker}
                activeOpacity={1}
              >
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={dismissDatePicker}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startDateTime}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    style={styles.picker}
                  />
                </View>
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={startDateTime}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </>
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <>
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={styles.pickerOverlay} 
                onPress={dismissTimePicker}
                activeOpacity={1}
              >
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={dismissTimePicker}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startDateTime}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    style={styles.picker}
                  />
                </View>
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={startDateTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
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
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
    backgroundColor: '#1C1C1C',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEAD1',
  },
  createButton: {
    backgroundColor: '#B97232',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#AB3801',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ECEAD1',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar + safe area
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
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
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
  },
  difficultyButtonActive: {
    backgroundColor: '#B97232',
    borderColor: '#B97232',
  },
  difficultyText: {
    fontSize: 14,
    color: '#ECEAD1',
    opacity: 0.8,
    fontWeight: '500',
  },
  difficultyTextActive: {
    color: '#ECEAD1',
    opacity: 1,
  },
  debugButton: {
    backgroundColor: '#AB3801',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 8,
  },
  debugButtonText: {
    color: '#ECEAD1',
    fontSize: 9,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#B97232',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B97232',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ECEAD1',
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#B97232',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
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
    backgroundColor: 'rgba(18, 19, 24, 0.8)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding for iOS
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
  picker: {
    height: 200,
  },
});