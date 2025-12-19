import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export const NetworkTestScreen: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('Starting network tests...');
    
    try {
      // Test 1: Basic Supabase connection
      addResult('Testing Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult(`❌ Supabase auth error: ${error.message}`);
      } else {
        addResult('✅ Supabase connection successful');
      }
      
      // Test 2: Simple query test
      addResult('Testing database query...');
      const { data: testData, error: queryError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (queryError) {
        addResult(`❌ Database query error: ${queryError.message}`);
      } else {
        addResult('✅ Database query successful');
      }
      
    } catch (err) {
      addResult(`❌ Network error: ${err}`);
    }
    
    setTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Diagnostics</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Run Connection Test'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>

      <View style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
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
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});