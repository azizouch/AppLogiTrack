// Temporary script to create a test user
// Run this in browser console on your app page

// Test user creation
const createTestUser = async () => {
  try {
    console.log('Creating test user...');
    
    // You can run this in the browser console when your app is loaded
    const response = await fetch('https://tdzgsjxdivbsnhqknbnd.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemdzanhkaXZic25ocWtuYm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMTEyNDcsImV4cCI6MjA2MDU4NzI0N30.HUWwVn9BYMynDIRSN20a0SelU7wzzQPvT0T2pkFsXeY'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const result = await response.json();
    console.log('User creation result:', result);
    
    if (result.user) {
      console.log('✅ Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: password123');
    } else {
      console.log('❌ Failed to create user:', result.error);
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Call the function
createTestUser();
