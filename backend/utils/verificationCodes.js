const codeStorage = new Map();

export const CodeTypes = {
    VERIFICATION: 'verification',
    PASSWORD_RESET: 'password_reset'
};

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Add this missing function
const getCodeRecord = (email, type) => {
    return codeStorage.get(`${email}:${type}`);
};

const setCodeRecord = (email, type, options = {}) => {
    const defaults = {
        expiresIn: 2 * 60 * 1000, // 2 minutes for all codes
        maxAttempts: 5,
        resendLimit: 5,
        resendCooldown: 2 * 60 * 1000 // 2 minutes cooldown
    };

    const settings = { ...defaults, ...options };

    const record = {
        code: generateCode(),
        type,
        expiresAt: Date.now() + settings.expiresIn,
        attempts: 0,
        attemptLimit: settings.maxAttempts,
        resendCount: 0,
        resendLimit: settings.resendLimit,
        lastSent: Date.now(),
        firstSent: Date.now(),
        resendCooldown: settings.resendCooldown
    };

    codeStorage.set(`${email}:${type}`, record);
    return record.code;
};

// Public functions
export const UserVerificationCodes = {
    generateVerificationCode: (email) => {
        return setCodeRecord(email, CodeTypes.VERIFICATION);
    },

    verifyVerificationCode: (email, code) => {
        const record = getCodeRecord(email, CodeTypes.VERIFICATION);
        if (!record) return false;

        record.attempts++;
        if (record.attempts > record.attemptLimit) {
            codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
            return false;
        }

        if (record.code !== code) return false;

        if (Date.now() > record.expiresAt) {
            codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
            return false;
        }

        codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
        return true;
    },

    generateResetCode: (email) => {
        return setCodeRecord(email, CodeTypes.PASSWORD_RESET);
    },

    verifyResetCode: (email, code) => {
        const record = getCodeRecord(email, CodeTypes.PASSWORD_RESET);
        if (!record) return { valid: false, message: "No reset code found" };

        record.attempts++;
        if (record.attempts > record.attemptLimit) {
            codeStorage.delete(`${email}:${CodeTypes.PASSWORD_RESET}`);
            return { valid: false, message: "Too many attempts" };
        }

        if (record.code !== code) {
            return { valid: false, message: "Invalid code" };
        }

        if (Date.now() > record.expiresAt) {
            codeStorage.delete(`${email}:${CodeTypes.PASSWORD_RESET}`);
            return { valid: false, message: "Code expired" };
        }

        return { valid: true };
    },

    canResendCode: (email, type) => {
        const record = getCodeRecord(email, type);
        if (!record) return { canResend: true };

        const now = Date.now();
        if (now - record.lastSent < record.resendCooldown) {
            const minutesLeft = Math.ceil((record.resendCooldown - (now - record.lastSent)) / 60000);
            return { canResend: false, message: `Wait ${minutesLeft} minute(s) before resending` };
        }

        if (record.resendCount >= record.resendLimit) {
            return { canResend: false, message: "Resend limit reached" };
        }

        return { canResend: true };
    },

    resendResetCode: (email) => {
        let record = getCodeRecord(email, CodeTypes.PASSWORD_RESET);
        if (!record) {
            return setCodeRecord(email, CodeTypes.PASSWORD_RESET);
        }

        record.resendCount++;
        record.lastSent = Date.now();
        record.code = generateCode();
        record.expiresAt = Date.now() + (2 * 60 * 1000);

        codeStorage.set(`${email}:${CodeTypes.PASSWORD_RESET}`, record);
        return record.code;
    },

    resendVerificationCode: (email) => {
        let record = getCodeRecord(email, CodeTypes.VERIFICATION);
        if (!record) {
            return setCodeRecord(email, CodeTypes.VERIFICATION);
        }

        record.resendCount++;
        record.lastSent = Date.now();
        record.code = generateCode();
        record.expiresAt = Date.now() + (2 * 60 * 1000);

        codeStorage.set(`${email}:${CodeTypes.VERIFICATION}`, record);
        return record.code;
    },

    clearCode: (email, type) => {
        codeStorage.delete(`${email}:${type}`);
    }
};



// Public functions
export const VendorVerificationCodes = {
    generateVerificationCode: (email) => {
        return setCodeRecord(email, CodeTypes.VERIFICATION);
    },

    verifyVerificationCode: (email, code) => {
        const record = getCodeRecord(email, CodeTypes.VERIFICATION);
        if (!record) return false;

        record.attempts++;
        if (record.attempts > record.attemptLimit) {
            codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
            return false;
        }

        if (record.code !== code) return false;

        if (Date.now() > record.expiresAt) {
            codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
            return false;
        }

        codeStorage.delete(`${email}:${CodeTypes.VERIFICATION}`);
        return true;
    },

    canResendCode: (email, type) => {
        const record = getCodeRecord(email, type);
        if (!record) return { canResend: true };

        const now = Date.now();
        if (now - record.lastSent < record.resendCooldown) {
            const minutesLeft = Math.ceil((record.resendCooldown - (now - record.lastSent)) / 60000);
            return { canResend: false, message: `Wait ${minutesLeft} minute(s) before resending` };
        }

        if (record.resendCount >= record.resendLimit) {
            return { canResend: false, message: "Resend limit reached" };
        }

        return { canResend: true };
    },

    resendVerificationCode: (email) => {
        let record = getCodeRecord(email, CodeTypes.VERIFICATION);
        if (!record) {
            return setCodeRecord(email, CodeTypes.VERIFICATION);
        }

        record.resendCount++;
        record.lastSent = Date.now();
        record.code = generateCode();
        record.expiresAt = Date.now() + (2 * 60 * 1000);

        codeStorage.set(`${email}:${CodeTypes.VERIFICATION}`, record);
        return record.code;
    },

    clearCode: (email, type) => {
        codeStorage.delete(`${email}:${type}`);
    }
};