import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api, supabase } from '@/lib/supabase';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { useToast } from '@/hooks/use-toast';

export function SessionTestComponent() {
  const { state } = useAuth();
  const { withRecovery } = useSessionRecovery();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSessionRecovery = async () => {
    setTesting(true);
    setTestResults([]);
    addTestResult('Starting session recovery test...');

    try {
      // Test 1: Normal API call
      addTestResult('Test 1: Normal API call');
      const result1 = await withRecovery(() => api.getColis({
        livreurId: state.user?.id,
        limit: 5
      }));
      
      if (result1) {
        addTestResult('✅ Normal API call succeeded');
      } else {
        addTestResult('❌ Normal API call failed');
      }

      // Test 2: Force session invalidation (simulate timeout)
      addTestResult('Test 2: Simulating session timeout...');
      
      // Clear the session to simulate timeout
      await supabase.auth.signOut({ scope: 'local' });
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try API call with invalid session
      const result2 = await withRecovery(() => api.getColis({
        livreurId: state.user?.id,
        limit: 5
      }));
      
      if (result2) {
        addTestResult('✅ Session recovery succeeded after timeout');
      } else {
        addTestResult('❌ Session recovery failed after timeout');
      }

      // Test 3: Check if we can still make API calls
      addTestResult('Test 3: Testing continued API access...');
      const result3 = await withRecovery(() => api.getColis({
        livreurId: state.user?.id,
        limit: 5
      }));
      
      if (result3) {
        addTestResult('✅ Continued API access works');
      } else {
        addTestResult('❌ Continued API access failed');
      }

    } catch (error: any) {
      addTestResult(`❌ Test failed with error: ${error.message}`);
    } finally {
      setTesting(false);
      addTestResult('Test completed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testCurrentSession = async () => {
    setTesting(true);
    addTestResult('Testing current session status...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addTestResult(`❌ Session error: ${error.message}`);
      } else if (session) {
        addTestResult('✅ Valid session found');
        addTestResult(`User: ${session.user?.email}`);
        addTestResult(`Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      } else {
        addTestResult('❌ No session found');
      }
    } catch (error: any) {
      addTestResult(`❌ Session check failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (!state.isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test session recovery.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Session Recovery Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test the session recovery mechanism to verify timeout handling works correctly.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testSessionRecovery} 
            disabled={testing}
            variant="default"
          >
            {testing ? 'Testing...' : 'Test Session Recovery'}
          </Button>
          <Button 
            onClick={testCurrentSession} 
            disabled={testing}
            variant="outline"
          >
            Check Current Session
          </Button>
          <Button 
            onClick={clearResults} 
            disabled={testing}
            variant="ghost"
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700 dark:text-gray-300">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Note:</strong> This test simulates session timeout by clearing the local session.</p>
          <p>In a real timeout scenario, the session would expire naturally after inactivity.</p>
        </div>
      </CardContent>
    </Card>
  );
}
