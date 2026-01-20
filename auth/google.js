const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const axios = require('axios');
// const { allowedEmails } = require('../config/allowedEmail');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    accessType: 'offline',
    prompt: 'consent',
    includeGrantedScopes: true,
    passReqToCallback: true
},
    async function (req, accessToken, refreshToken, profile, done) {
        try {
            // ✅ Get email safely
            const email = profile.emails?.[0]?.value;

            if (!email) {
                return done(null, false, { message: 'No email found in Google profile' });
            }

            // ✅ Check against Database instead of hardcoded list
            // const { AllowedEmail } = require('../models/AllowedEmail.model'); // If it was named export
            const AllowedEmail = require('../models/AllowedEmail.model'); // It is default export

            // We use case-insensitive check by storing/searching lowercase if model enforces it, 
            // but the query here should be robust.
            const allowedUser = await AllowedEmail.findOne({ email: email.toLowerCase() });

            if (!allowedUser) {
                console.log(`🚫 Access denied for: ${email}`);
                return done(null, false, { message: 'Unauthorized email' });
            }

            console.log(`✅ User authorized: ${email}`);

            // ✅ Optional: Fetch token info (you can keep or skip this)
            // const tokenInfo = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);

            const user = {
                displayName: profile.displayName,
                email: email.toLowerCase(), // Normalize
                accessToken,
                refreshToken
            };

            return done(null, user);

        } catch (error) {
            console.error('❌ Error in GoogleStrategy:', error.response?.data || error.message);
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, {
        email: user.email,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        displayName: user.displayName
    });
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
