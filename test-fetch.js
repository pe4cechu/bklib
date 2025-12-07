/**
 * Test script to verify the fetch request to /api/borrow endpoint
 * 
 * Run this with: node test-fetch.js
 * Make sure your Next.js server is running on localhost:3000
 */

async function testBorrowRequest() {
    const baseUrl = 'http://localhost:3000';
    const endpoint = '/api/borrow';

    const testData = {
        bookTitle: 'Test Book',
        quantity: 2,
        dateReturn: '2025-12-20', // Date must be at least 1 day from today
        note: 'Test borrow request from test script',
    };

    console.log('🧪 Testing POST request to', `${baseUrl}${endpoint}`);
    console.log('📦 Sending payload:', JSON.stringify(testData, null, 2));
    console.log('---');

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
            credentials: 'include', // Include cookies for authentication
        });

        console.log(`✓ Response status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log('📋 Response body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Request successful!');
        } else {
            console.log('❌ Request failed with status:', response.status);
            console.log('Error message:', data.message);
        }

        return { success: response.ok, status: response.status, data };
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        console.error('Make sure your Next.js server is running on localhost:3000');
        return { success: false, error: error.message };
    }
}

// Run the test
testBorrowRequest();
