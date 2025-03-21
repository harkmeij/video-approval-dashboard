const Month = require('../models/Month');

async function testMonthCreation() {
  try {
    console.log('Testing month creation...');
    
    // Test data
    const monthData = {
      name: 'March 2025',
      month: 3,
      year: 2025,
      created_by: '00000000-0000-0000-0000-000000000000' // placeholder editor ID
    };
    
    console.log('Attempting to create month with data:', JSON.stringify(monthData, null, 2));
    
    // Try to find an existing month first
    console.log('Checking for existing month with month=3, year=2025');
    const existingMonths = await Month.find({
      month: 3,
      year: 2025
    });
    
    console.log(`Found ${existingMonths ? existingMonths.length : 0} existing months`);
    
    if (existingMonths && existingMonths.length > 0) {
      console.log('Existing months:', JSON.stringify(existingMonths, null, 2));
      console.log('Successfully found existing month');
    } else {
      // Create a new month
      const result = await Month.create(monthData);
      console.log('Month creation result:', JSON.stringify(result, null, 2));
      console.log('Successfully created month');
    }
    
  } catch (err) {
    console.error('Error:', err);
    if (err.details) {
      console.error('Details:', err.details);
    }
    console.error('Stack:', err.stack);
  }
}

// Run the test
testMonthCreation()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err))
  .finally(() => process.exit());
