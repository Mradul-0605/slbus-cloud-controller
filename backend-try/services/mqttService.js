const mqtt = require('mqtt');
const deviceStore = require('../state/deviceStore');
const { MQTT } = require('../config/constants');

class MQTTService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.reconnectTimer = null;
  }

  async init() {
    return new Promise((resolve) => {
      const broker = process.env.MQTT_BROKER || MQTT.BROKER;
      console.log('🔌 Connecting to MQTT:', broker);
      
      this.client = mqtt.connect(broker, {
        connectTimeout: MQTT.TIMEOUT || 10000,
        reconnectPeriod: MQTT.RECONNECT_INTERVAL || 5000,
        keepalive: 60
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT Connected');
        this.connected = true;
        deviceStore.setMQTTConnected(true);
        
        // Subscribe if we have credentials
        const gateway = deviceStore.getGateway();
        if (gateway.custid && gateway.uuid) {
          this.subscribe(gateway.custid, gateway.uuid);
        }
        resolve(true);
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Error:', error.message);
        this.connected = false;
        deviceStore.setMQTTConnected(false);
        resolve(false);
      });

      this.client.on('offline', () => {
        console.log('⚠️ MQTT Offline');
        this.connected = false;
        deviceStore.setMQTTConnected(false);
      });

      this.client.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
      });

      this.client.on('message', (topic, message) => {
        this._handleMessage(message);
      });

      setTimeout(() => resolve(true), 3000);
    });
  }

  subscribe(custid, uuid) {
    if (!custid || !uuid) {
      console.error('❌ Invalid custid or uuid for MQTT subscription');
      return false;
    }

    if (!this.client || !this.connected) {
      console.log('⏳ MQTT not ready, will subscribe when connected');
      return false;
    }

    const topic = MQTT.TOPIC_TEMPLATE.replace('{custid}', custid).replace('{uuid}', uuid);
    console.log(`📡 Subscribing to: ${topic}`);
    
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error('❌ Subscribe error:', err.message);
      } else {
        console.log('✅ Subscribed successfully to:', topic);
      }
    });
    
    return true;
  }

  _handleMessage(message) {
    try {
      const payload = JSON.parse(message.toString());
      
      if (payload.devsts && payload.devsts.islands) {
        const islands = payload.devsts.islands;
        
        islands.forEach(island => {
          if (island.nodes) {
            island.nodes.forEach(node => {
              const address = node.ad;
              const value = node.vl;
              
              if (address !== undefined && value !== undefined) {
                // Update existing device only - DON'T CREATE NEW DEVICES
                deviceStore.updateDeviceFromMQTT(address, value);
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('❌ MQTT parse error:', err.message);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
      deviceStore.setMQTTConnected(false);
      console.log('🔌 MQTT Disconnected');
    }
  }

  getStatus() {
    return { connected: this.connected };
  }
}

const mqttService = new MQTTService();
module.exports = { mqttService };