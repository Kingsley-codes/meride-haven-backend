import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Vendor from '../models/vendorModel.js';


const getCallbackURL = () => {
    if (process.env.NODE_ENV === 'production') {
        return `${process.env.BACKEND_URL}/api/auth/google/callback`;
    }
    return 'http://localhost:3000/api/auth/google/callback';
};

passport.use('google-user', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL(),
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            fullName: profile.displayName,
            isVerified: true
        });

        await newUser.save();
        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
}));


// Vendor Google Strategy
passport.use('google-vendor', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL('vendor'),
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let vendor = await Vendor.findOne({ googleId: profile.id });

        if (vendor) {
            return done(null, vendor);
        }

        vendor = await Vendor.findOne({ email: profile.emails[0].value });

        if (vendor) {
            vendor.googleId = profile.id;
            await vendor.save();
            return done(null, vendor);
        }

        const newVendor = new Vendor({
            googleId: profile.id,
            email: profile.emails[0].value,
            vendorName: profile.displayName,
            isVerified: true
        });

        await newVendor.save();
        return done(null, newVendor);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;