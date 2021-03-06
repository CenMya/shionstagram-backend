const uuidv4 = require('uuid').v4;
const inMemoryTokenStore = [];

const registerUser = (discordUserId, admin) => {
        const token = {
            discordUserId,
            admin,
            token: uuidv4(),
            createdAt: Date.now(),
        }

        inMemoryTokenStore.push(token);
        
        return token;
}


const verifyToken = (token) => {
    const tokenEntry = inMemoryTokenStore.find((entry) => {
        if(entry.token === token) {
            if(entry.createdAt + 86400000 > Date.now()) {
                return true;
            }
        }
        return false;
    });

    if(tokenEntry) return true;
    return false;
}

module.exports = {
    registerUser,
    verifyToken,
    inMemoryTokenStore,
};