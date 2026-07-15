const { SLBusClient } = require('../slbus');

let client = null;
let isConnected = false;
let isLoggedIn = false;
let gatewayName = '';
let currentUuid = '';
let devices = [];
let connectionError = '';
let email = '';
let password = '';

async function login(emailInput, passwordInput) {
    try {
        email = emailInput;
        password = passwordInput;
        
        client = new SLBusClient({ email: email, password: password });
        const result = await client.login(email, password);
        
        if (result.success) {
            isLoggedIn = true;
            isConnected = true; // Assume connected until proven otherwise
            gatewayName = client.gatewayName || 'SL BUS Gateway';
            currentUuid = client.uuid || '';
            devices = client.devices || [];
            connectionError = '';
            return { success: true, uuid: currentUuid, devices: devices };
        } else {
            isLoggedIn = false;
            isConnected = false;
            connectionError = result.error || 'Login failed';
            return { success: false, error: connectionError };
        }
    } catch (error) {
        isLoggedIn = false;
        isConnected = false;
        connectionError = error.message;
        return { success: false, error: error.message };
    }
}

function getStatus() {
    return {
        loggedIn: isLoggedIn,
        connected: isConnected,
        gateway: gatewayName || 'Not Connected',
        uuid: currentUuid || '',
        error: connectionError || ''
    };
}

function getDevices() {
    return isLoggedIn ? devices : [];
}

async function ensureConnected() {
    if (!isLoggedIn) {
        throw new Error('Not logged in');
    }
    if (!isConnected) {
        throw new Error('Gateway not connected');
    }
    return true;
}

// Check if gateway is actually reachable
async function checkConnection() {
    if (!isLoggedIn || !client) {
        isConnected = false;
        return false;
    }
    
    try {
        // Try a simple query to check connection
        await client.queryStatus(0);
        isConnected = true;
        connectionError = '';
        return true;
    } catch (error) {
        isConnected = false;
        connectionError = 'Gateway unreachable';
        return false;
    }
}

async function turnOn(node) {
    await ensureConnected();
    return client.turnOn(node);
}

async function turnOff(node) {
    await ensureConnected();
    return client.turnOff(node);
}

async function setBrightness(node, level) {
    await ensureConnected();
    return client.setBrightness(node, level);
}

async function setTemperature(node, kelvin) {
    await ensureConnected();
    return client.setTemperature(node, kelvin);
}

async function queryStatus(node) {
    await ensureConnected();
    return client.queryStatus(node);
}

async function queryBrightness(node) {
    await ensureConnected();
    return client.queryBrightness(node);
}

async function reconnect(emailInput, passwordInput) {
    if (emailInput && passwordInput) {
        return login(emailInput, passwordInput);
    }
    if (email && password) {
        return login(email, password);
    }
    return { success: false, error: 'No credentials available' };
}

module.exports = {
    login,
    getStatus,
    getDevices,
    turnOn,
    turnOff,
    setBrightness,
    setTemperature,
    queryStatus,
    queryBrightness,
    reconnect,
    checkConnection,
    isLoggedIn: () => isLoggedIn,
    isConnected: () => isConnected
};