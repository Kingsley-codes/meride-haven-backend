import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";
import { handleFailedPayment, handleSuccessfulPayment } from "../utils/bookingHelpers.js";
import crypto from "crypto";
import axios from "axios";


// Helper function to generate unique Booking IDs
export const generateBookingID = () => 'MRH' + Math.random().toString(36).substring(2, 10).toUpperCase();

export const generateReference = (prefix = "erc") => {
    const unique = crypto.randomBytes(12).toString("hex"); // 12-char random string
    return `${prefix}_${unique}`;
};

export const createBooking = async (req, res) => {
    try {
        const {
            serviceID, serviceName,
            price, duration,
            startDate, endDate, address, state,
            securityDeposit, time, clientName, vendorID,
            serviceType, clientNumber, clientEmail
        } = req.body;

        if (time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            return res.status(400).json({ message: "Invalid time format. Please use HH:MM." });
        }


        let client = {};

        try {
            client = await User.findOne({ email: clientEmail });

            if (!client) {

                if (!clientEmail || !clientName || !clientNumber) {
                    return res.status(400).json({ message: "Client details required" });
                }

                const existingUser = await User.findOne({ clientNumber });
                if (existingUser) {
                    return res.status(400).json({
                        error: 'Phone number already exists'
                    });
                }

                client = await User.create({
                    email: clientEmail,
                    fullName: clientName,
                    phone: clientNumber,
                    isVerified: true,
                });
            }
        } catch (userError) {
            console.error("User creation/retrieval error:", userError);
            return res.status(400).json({
                message: "Client processing failed",
                error: userError.message
            });
        }

        const bookingID = generateBookingID();
        const paymentReference = generateReference();

        // Prepare Paystack transaction data
        const transactionData = {
            amount: price,
            customerEmail: client.email,
            customerName: client.fullName,
            paymentReference: paymentReference,
            currency: "NGN",
            paymentMethods: "card,bank-transfer,ussd",
            feeBearer: "merchant",
            metadata: {
                bookingID: bookingID,
                clientNumber: client.phone,
                serviceName: serviceName,
                serviceID: serviceID,
                serviceName: serviceName,
                vendorID: vendorID,
            },
            redirectUrl: `${process.env.FRONTEND_URL}/service-payment-verification`
            // redirectUrl: "http://localhost:3000/bookings/verifyPayment"
        };

        let ercResponse;
        try {
            ercResponse = await axios.post(
                `${process.env.ECRAS_BASE_URL}/payment/initiate`,
                transactionData,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.ECRAS_SECRET_KEY}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    timeout: 10000
                }
            );
        } catch (paymentError) {
            console.error("Payment API error:", paymentError.response?.data || paymentError.message);
            return res.status(500).json({
                message: "Payment initialization failed",
                error: paymentError.response?.data?.message || paymentError.message
            });
        }

        if (ercResponse.data.responseCode !== "success") {
            return res.status(500).json({
                message: "Payment initialization failed",
                details: ercResponse.data
            });
        }

        // Create booking record
        const newBooking = await Booking.create({
            service: serviceID,
            serviceName,
            bookingID,
            client: client._id,
            serviceType,
            clientName: client.fullName,
            clientNumber: client.phone,
            clientEmail: client.email,
            vendor: vendorID,
            price,
            paymentReference: paymentReference,
            transactionReference: ercResponse.data.responseBody.transactionReference,
            duration,
            startDate,
            endDate,
            address,
            state,
            securityDeposit,
            time,
        });

        return res.status(201).json({
            message: "Booking created successfully",
            paymentUrl: ercResponse.data.responseBody.checkoutUrl,
            paymentReference: ercResponse.data.responseBody.paymentReference,
            transactionReference: ercResponse.data.responseBody.transactionReference,
        });


    } catch (error) {
        console.error("Create booking error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


export const verifyPayment = async (req, res) => {

    try {
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({ message: "Payment reference is required" });
        }

        // call ercas to verify payment
        const ercResponse = await axios.get(
            `${process.env.ECRAS_BASE_URL}/payment/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.ECRAS_SECRET_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
            }
        );

        const { requestSuccessful, responseCode, responseBody } = ercResponse.data;

        // Handle verification failure
        if (!requestSuccessful || responseCode !== "success" || !responseBody) {
            return res.status(500).json({
                success: false,
                message: "Payment verification failed",
                details: ercResponse.data
            });
        }


        const transactionData = responseBody;

        // Find the booking using metadata bookingID
        const booking = await Booking.findOne({ transactionReference: transactionData.ercs_reference });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // If cancelled already, don't proceed
        if (booking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled"
            });
        }

        // Normalize status for comparison
        const paymentStatus = transactionData.status?.toLowerCase();

        // If failed → mark failed
        if (paymentStatus === "failed") {
            booking.status = "failed";
            await booking.save();

            return res.status(200).json({
                success: false,
                message: "Payment failed, booking marked as failed"
            });
        }

        // If successful → mark in progress
        if (paymentStatus === "successful") {
            if (booking.status === "in progress") {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified and booking is active",
                    booking
                });
            }

            booking.status = "in progress";
            await booking.save();

            return res.status(200).json({
                success: true,
                message: "Payment verified and booking activated",
                booking
            });
        }

    } catch (error) {
        console.error("Payment verification error:", error.response?.data || error.message || error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.response?.data || error.message || "Unknown error"
        });
    }
}


// the webhook endpoint for ercas to call
export const handleErcasWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log("Received webhook event:", event);

        // Normalize status to lowercase for safety
        const status = event.status?.toLowerCase();

        switch (status) {
            // successful payment
            case "successful":
            case "success":
                await handleSuccessfulPayment(event);
                break;
            // failed payment
            case "failed":
            case "declined":
                await handleFailedPayment(event);
                break;
            default:
                console.log(`Unhandled event type: ${event.event}`);
        }

        // Always respond to ERCAS quickly to prevent retries
        return res.status(200).json({ received: true });

    } catch (error) {
        console.error("Error processing webhook:", error);
    }
}