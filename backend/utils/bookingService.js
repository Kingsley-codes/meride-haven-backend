import cron from 'node-cron';
import Booking from '../models/bookingModel.js';

function BookingService() {
    // --- 1. Update completed bookings ---
    const updateCompletedBookings = async () => {
        try {
            const now = new Date();

            const result = await Booking.updateMany(
                {
                    status: { $in: ['in progress', 'upcoming'] },
                    startDate: { $exists: true, $ne: null },
                    duration: { $exists: true, $gt: 0 },
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    '$startDate',
                                    { $multiply: ['$duration', 24 * 60 * 60 * 1000] }
                                ]
                            },
                            now
                        ]
                    }
                },
                {
                    $set: {
                        status: 'completed',
                        completionTime: now
                    }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} bookings to completed status`);
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating completed bookings:', error);
            throw error;
        }
    };


    // --- 2. Cron job setup ---
    const initCronJob = () => {
        cron.schedule('*/30 * * * *', async () => {
            console.log('🕒 Running booking completion check...');
            await updateCompletedBookings();
        });

        // Run once at startup
        updateCompletedBookings();
        console.log('✅ Booking completion service initialized');
    };

    // Return all functions you want accessible
    return {
        updateCompletedBookings,
        initCronJob
    };
}

// Export the initialized instance
export default BookingService();
