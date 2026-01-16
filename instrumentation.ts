export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Establish database connection when server starts
    const connectDB = (await import('./lib/mongodb')).default;
    try {
      await connectDB();
      console.log('✅ Database connection established at startup');
    } catch (error) {
      console.error('❌ Failed to establish database connection at startup:', error);
    }
  }
}
