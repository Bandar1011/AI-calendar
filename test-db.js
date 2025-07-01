// This script is for testing the database connection directly,
// bypassing the Next.js server to get a clearer error message.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to connect to the database...');
  try {
    // Try to fetch all tasks. A simple query to test the connection.
    const tasks = await prisma.task.findMany();
    console.log('✅ Connection successful! Found tasks:');
    console.log(tasks);
  } catch (error) {
    // If an error occurs, print it clearly.
    console.error('❌ Failed to connect to the database.');
    console.error('Error details:', error);
  } finally {
    // Always disconnect from the database when the script is done.
    await prisma.$disconnect();
    console.log('Disconnected from the database.');
  }
}

// Run the main function.
main(); 