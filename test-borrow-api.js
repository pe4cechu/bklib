// Test script to post sample borrow request data with authentication
const testBorrowAPI = async () => {
    try {
        const sessionToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6eyJidWZmZXIiOnsiMCI6MTA1LCIxIjo1MywiMiI6MTQ3LCIzIjoyMDgsIjQiOjExNiwiNSI6MTg4LCI2IjoxMCwiNyI6MTc4LCI4Ijo2MywiOSI6MjMyLCIxMCI6NDgsIjExIjoyMTl9fSwibmFtZSI6InVzZXJAaGNtdXQuZWR1LnZuIiwiZW1haWwiOiJ1c2VyQGhjbXV0LmVkdS52biIsInJvbGUiOiJ1c2VyIiwic3R1ZGVudElkIjoxMjM0LCJleHAiOjE3NjUyMzQyMjR9.czsVbe_HU71xYHxbjLCHy7XA38fYq2tmIenVj91ePFw';

        const sampleData = {
            bookTitle: "The Great Gatsby",
            quantity: 2,
            dateReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: "Test borrow request"
        };

        console.log('Sending sample data with session cookie:', sampleData);

        const res = await fetch('http://localhost:3000/api/borrow', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': `session=${sessionToken}`
            },
            body: JSON.stringify(sampleData),
        });

        console.log('\nResponse status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);

    } catch (err) {
        console.error('Error:', err.message);
    }
};

testBorrowAPI();
