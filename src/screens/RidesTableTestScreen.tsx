import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const RidesTableTestScreen: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRidesTable = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('Starting rides table tests...');
    
    try {
      // Test 1: Check if rides table exists and what columns it has
      addResult('Testing rides table structure...');
      
      // Try to get table info by attempting to select with specific columns
      const testColumns = [
        'id', 'title', 'description', 'start_location', 'start_coordinates', 'end_location', 
        'start_time', 'max_participants', 'difficulty_level', 'estimated_duration_hours',
        'organizer_id', 'status', 'current_participants', 'created_at'
      ];
      
      for (const column of testColumns) {
        try {
          const { error } = await supabase
            .from('rides')
            .select(column)
            .limit(1);
          
          if (error) {
            addResult(`❌ Column '${column}' missing or inaccessible: ${error.message}`);
          } else {
            addResult(`✅ Column '${column}' exists`);
          }
        } catch (err: any) {
          addResult(`❌ Error testing column '${column}': ${err.message}`);
        }
      }

      // Test 2: Try to select all data to see what's actually there
      addResult('Testing basic rides table access...');
      const { data: allRides, error: selectError } = await supabase
        .from('rides')
        .select('*')
        .limit(3);
      
      if (selectError) {
        addResult(`❌ Cannot access rides table: ${selectError.message}`);
      } else {
        addResult(`✅ Rides table accessible. Found ${allRides?.length || 0} rides`);
        if (allRides && allRides.length > 0) {
          addResult(`Sample ride columns: ${Object.keys(allRides[0]).join(', ')}`);
        }
      }

      // Test 3: Try to create a minimal ride (without difficulty column)
      if (user) {
        addResult('Testing ride creation without difficulty column...');
        const minimalRideData = {
          title: `Test Ride ${new Date().toLocaleTimeString()}`,
          description: 'Test description',
          start_location: 'Test location',
          start_coordinates: '(77.2090,28.6139)',
          start_time: new Date().toISOString(),
          organizer_id: user.id,
          status: 'scheduled',
          current_participants: 1,
        };
        
        const { data: newRide, error: createError } = await supabase
          .from('rides')
          .insert([minimalRideData])
          .select();
        
        if (createError) {
          addResult(`❌ Minimal ride creation failed: ${createError.message}`);
        } else {
          addResult(`✅ Minimal ride created successfully!`);
          addResult(`Created ride columns: ${Object.keys(newRide[0]).join(', ')}`);
          
          // Clean up - delete the test ride
          await supabase.from('rides').delete().eq('id', newRide[0].id);
          addResult('🧹 Test ride cleaned up');
        }
      }

      // Test 4: Test with difficulty column
      if (user) {
        addResult('Testing ride creation with difficulty column...');
        const fullRideData = {
          title: `Test Ride with Difficulty ${new Date().toLocaleTimeString()}`,
          description: 'Test description',
          start_location: 'Test location',
          start_coordinates: '(77.2090,28.6139)',
          start_time: new Date().toISOString(),
          difficulty_level: 'moderate',
          organizer_id: user.id,
          status: 'scheduled',
          current_participants: 1,
        };
        
        const { data: newRideWithDifficulty, error: createWithDifficultyError } = await supabase
          .from('rides')
          .insert([fullRideData])
          .select();
        
        if (createWithDifficultyError) {
          addResult(`❌ Ride creation with difficulty failed: ${createWithDifficultyError.message}`);
        } else {
          addResult(`✅ Ride with difficulty created successfully!`);
          
          // Clean up
          await supabase.from('rides').delete().eq('id', newRideWithDifficulty[0].id);
          addResult('🧹 Test ride with difficulty cleaned up');
        }
      }
      
      // Test 5: Test with duration column
      if (user) {
        addResult('Testing ride creation with duration column...');
        const fullRideWithDuration = {
          title: `Test Ride with Duration ${new Date().toLocaleTimeString()}`,
          description: 'Test description with duration',
          start_location: 'Test location',
          start_coordinates: '(77.2090,28.6139)',
          start_time: new Date().toISOString(),
          difficulty_level: 'hard',
          estimated_duration_hours: 2.5,
          organizer_id: user.id,
          status: 'scheduled',
          current_participants: 1,
        };
        
        const { data: newRideWithDuration, error: createWithDurationError } = await supabase
          .from('rides')
          .insert([fullRideWithDuration])
          .select();
        
        if (createWithDurationError) {
          addResult(`❌ Ride creation with duration failed: ${createWithDurationError.message}`);
        } else {
          addResult(`✅ Ride with duration created successfully! Duration: ${newRideWithDuration[0].estimated_duration_hours} hours`);
          
          // Clean up
          await supabase.from('rides').delete().eq('id', newRideWithDuration[0].id);
          addResult('🧹 Test ride with duration cleaned up');
        }
      }

    } catch (err: any) {
      addResult(`❌ Unexpected error: ${err.message || err}`);
    }
    
    setTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rides Table Diagnostics</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testRidesTable}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Rides Table'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 11,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});