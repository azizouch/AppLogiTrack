import React, { useState } from 'react';
import { auth, api } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function DebugPanel() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    addResult('Testing Supabase connection...');
    try {
      const { user, error } = await auth.getCurrentUser();
      if (error) {
        addResult(`❌ Auth error: ${error.message}`);
      } else {
        addResult(`✅ Auth connection successful. User: ${user ? user.email : 'No user'}`);
      }
    } catch (error) {
      addResult(`❌ Connection failed: ${error}`);
    }
  };

  const testDatabaseConnection = async () => {
    addResult('Testing database connection...');
    try {
      const { data, error } = await api.getUsers();
      if (error) {
        addResult(`❌ Database error: ${error.message}`);
      } else {
        addResult(`✅ Database connection successful. Found ${data?.length || 0} users`);
      }
    } catch (error) {
      addResult(`❌ Database connection failed: ${error}`);
    }
  };

  const createTestUser = async () => {
    addResult('Creating test user...');
    try {
      const { data, error } = await auth.signUp('test@example.com', 'password123', {
        nom: 'Test',
        prenom: 'User',
        role: 'gestionnaire'
      });
      
      if (error) {
        addResult(`❌ User creation error: ${error.message}`);
      } else {
        addResult(`✅ Test user created successfully: ${data.user?.email}`);
      }
    } catch (error) {
      addResult(`❌ User creation failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <div className="space-y-2 mb-4">
        <Button onClick={testSupabaseConnection} size="sm" variant="outline">
          Test Auth
        </Button>
        <Button onClick={testDatabaseConnection} size="sm" variant="outline">
          Test Database
        </Button>
        <Button onClick={createTestUser} size="sm" variant="outline">
          Create Test User
        </Button>
        <Button onClick={clearResults} size="sm" variant="destructive">
          Clear
        </Button>
      </div>
      <div className="text-xs space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="font-mono text-gray-600">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}
