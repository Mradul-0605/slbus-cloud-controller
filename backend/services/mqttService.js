const mqtt = require('mqtt');
require('dotenv').config();

let mqttClient = null;
let isConnected = false;

// Backend device store
let devices = [];

function initMQTT() {
    return new Promise((resolve) => {
        const broker = process.env.MQTT_BROKER || 'mqtt://mqtt.slbus.in:1883';
        console.log('🔌 Connecting to MQTT:', broker);
        
        mqttClient = mqtt.connect(broker, {
            connectTimeout: 10000,
            reconnectPeriod: 5000,
            keepalive: 60
        });

        mqttClient.on('connect', () => {
            console.log('✅ MQTT Connected');
            isConnected = true;
            
            const custid = process.env.MQTT_CUSTID;
            const uuid = process.env.MQTT_UUID;
            
            if (custid && uuid) {
                const topic = `slbus/all/${custid}/${uuid}/devsts`;
                console.log(`📡 Subscribing to: ${topic}`);
                mqttClient.subscribe(topic, (err) => {
                    if (err) {
                        console.error('❌ Subscribe error:', err.message);
                    } else {
                        console.log('✅ Subscribed successfully to:', topic);
                    }
                });
            }
            
            resolve(true);
        });

        mqttClient.on('error', (error) => {
            console.error('❌ MQTT Error:', error.message);
            isConnected = false;
            resolve(false);
        });

        mqttClient.on('offline', () => {
            console.log('⚠️ MQTT Offline');
            isConnected = false;
        });

        mqttClient.on('reconnect', () => {
            console.log('🔄 MQTT Reconnecting...');
        });

        mqttClient.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                console.log('📨 MQTT Message received');
                handleMQTTMessage(payload);
            } catch (err) {
                console.error('❌ MQTT parse error:', err.message);
            }
        });

        setTimeout(() => resolve(true), 3000);
    });
}

function handleMQTTMessage(payload) {
    try {
        if (payload.devsts && payload.devsts.islands) {
            const islands = payload.devsts.islands;
            
            islands.forEach(island => {
                if (island.nodes) {
                    island.nodes.forEach(node => {
                        const address = node.ad;
                        const value = node.vl;
                        
                        if (address !== undefined && value !== undefined) {
                            const isOn = value > 0;
                            console.log(`💡 Node ${address}: ${isOn ? 'ON' : 'OFF'} (${value})`);
                            
                            // Update backend device store
                            const existing = devices.find(
    d => Number(d.node) === Number(address)
);

if (!existing) {
    console.warn(`⚠️ MQTT update for unknown node ${address}`);
    return;
}

// Update existing device only
existing.power = isOn;
existing.brightness = value;
existing.online = true;
existing.lastUpdate = Date.now();
                            
                            // Emit full devices array
                            if (global.io) {
                                global.io.emit('devices_updated', devices);
                                console.log('📤 Emitted devices_updated');
                            }
                        }
                    });
                }
            });
        }
    } catch (err) {
        console.error('❌ MQTT message error:', err.message);
    }
}

function subscribeToDevices(custid, uuid) {
    if (!custid || !uuid) {
        console.log('❌ Invalid custid or uuid');
        return false;
    }

    if (!mqttClient || !isConnected) {
        console.log('⏳ MQTT not ready');
        return false;
    }

    const topic = `slbus/all/${custid}/${uuid}/devsts`;
    console.log(`📡 Subscribing to: ${topic}`);
    
    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error('❌ Subscribe error:', err.message);
        } else {
            console.log('✅ Subscribed successfully to:', topic);
        }
    });
    
    return true;
}

function getDevices() {
    return devices;
}

function getDevice(node) {
    return devices.find(
        d => Number(d.node) === Number(node)
    );
}

function setDevices(newDevices) {
    devices = newDevices.map(device => ({
        ...device,
        node: Number(device.node),
        power: device.power ?? false,
        brightness: device.brightness ?? 0,
        temperature: device.temperature ?? 4000,
        online: true,
        lastUpdate: Date.now()
    }));

    console.log("📦 Loaded Devices:");
    console.table(
        devices.map(d => ({
            node: d.node,
            name: d.name,
            type: d.type || d.nodeType,
            group: d.groupName
        }))
    );
}

function getMQTTStatus() {
    return { connected: isConnected };
}

module.exports = {
    initMQTT,
    subscribeToDevices,
    getDevices,
    getDevice,
    setDevices,
    getMQTTStatus
};