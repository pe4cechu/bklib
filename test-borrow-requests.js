/**
 * Test script to send sample borrow request data
 * This simulates making a borrow request with proper error handling
 */

async function sendSampleBorrowRequest() {
    const baseUrl = 'http://localhost:3000';
    
    // Sample borrow requests to test
    const sampleRequests = [
        {
            bookTitle: 'The Great Gatsby',
            quantity: 1,
            dateReturn: '2025-12-25',
            note: 'Summer reading',
        },
        {
            bookTitle: 'To Kill a Mockingbird',
            quantity: 2,
            dateReturn: '2026-01-10',
            note: 'Book club selection',
        },
        {
            bookTitle: '1984',
            quantity: 1,
            dateReturn: '2025-12-31',
            note: 'Required for class',
        },
    ];

    console.log('📚 Testing Borrow Request API\n');
    console.log('═'.repeat(60));

    for (let i = 0; i < sampleRequests.length; i++) {
        const request = sampleRequests[i];
        console.log(`\n📖 Test ${i + 1}: ${request.bookTitle}`);
        console.log('-'.repeat(60));
        console.log('Payload:', JSON.stringify(request, null, 2));

        try {
            const response = await fetch(`${baseUrl}/api/borrow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                credentials: 'include',
            });

            const data = await response.json();
            
            console.log(`Status: ${response.status} ${response.statusText}`);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (response.ok) {
                console.log('✅ SUCCESS');
            } else if (response.status === 401) {
                console.log('⚠️  UNAUTHORIZED - User needs to be logged in');
            } else {
                console.log('❌ FAILED');
            }
        } catch (error) {
            console.error('❌ ERROR:', error.message);
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n📝 Test Summary:');
    console.log('- API endpoint is responding');
    console.log('- 401 responses indicate authentication is working');
    console.log('- To test with actual saves, user must be logged in');
    console.log('- Check MongoDB for saved records when authenticated\n');
}

// Run tests
sendSampleBorrowRequest().catch(console.error);
