import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const DatabaseTestScreen: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabase = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('Starting database tests...');
    
    try {
      // Test 1: Check if posts table exists and can be queried
      addResult('Testing posts table access...');
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);
      
      if (postsError) {
        addResult(`❌ Posts table error: ${postsError.message}`);
        addResult(`Error details: ${JSON.stringify(postsError, null, 2)}`);
      } else {
        addResult(`✅ Posts table accessible. Found ${postsData?.length || 0} posts`);
        if (postsData && postsData.length > 0) {
          addResult(`Sample post: ${JSON.stringify(postsData[0], null, 2)}`);
        }
      }

      // Test 2: Check if profiles table exists
      addResult('Testing profiles table access...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (profilesError) {
        addResult(`❌ Profiles table error: ${profilesError.message}`);
      } else {
        addResult(`✅ Profiles table accessible. Found ${profilesData?.length || 0} profiles`);
      }

      // Test 3: Test creating a post
      if (user) {
        addResult('Testing post creation...');
        const testPost = {
          content: `Test post created at ${new Date().toISOString()}`,
          user_id: user.id,
          likes_count: 0,
          comments_count: 0,
        };
        
        const { data: newPost, error: createError } = await supabase
          .from('posts')
          .insert([testPost])
          .select();
        
        if (createError) {
          addResult(`❌ Post creation error: ${createError.message}`);
          addResult(`Error details: ${JSON.stringify(createError, null, 2)}`);
        } else {
          addResult(`✅ Post created successfully!`);
          addResult(`Created post: ${JSON.stringify(newPost[0], null, 2)}`);
        }
      } else {
        addResult('❌ No user logged in, skipping post creation test');
      }

      // Test 4: Test the exact query used in HomeScreen
      addResult('Testing HomeScreen query...');
      const { data: homeData, error: homeError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (homeError) {
        addResult(`❌ HomeScreen query error: ${homeError.message}`);
        addResult(`Error details: ${JSON.stringify(homeError, null, 2)}`);
      } else {
        addResult(`✅ HomeScreen query successful. Found ${homeData?.length || 0} posts`);
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
      <Text style={styles.title}>Database Diagnostics</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testDatabase}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Run Database Test'}
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