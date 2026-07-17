const axios = require('axios');
const { encodePkt } = require('../utils/encoder');
const { getDevices, setDevices } = require('./mqttService');

function getDeviceType(nt, nst) {

    nt = Number(nt);

    switch (nt) {

        case 7:
        case 100:
            return "switch";

        case 101:
            return "dimmer";

        case 102:
            return "fan";

        case 103:
            return "curtain";

        case 106:
            return "ac";

        case 107:
            return "plug";

        case 108:
            return "water";

        case 6:
            return "led";

        case 8:
            return nst === "tc"
                ? "white_tunable"
                : "rgb";

        default:
            return "unknown";
    }
}

class SLBusClient {
    constructor(config) {
        this.email = config.email;
        this.password = config.password;
        this.uuid = '';
        this.accessToken = '';
        this.custid = '';
        this.gatewayName = '';
        this.devices = [];
        this.connected = false;
    }

    async login(email, password) {
        try {
            const response = await axios.post('https://oath2.vadactro.org.in/slbus/api', {
                cmd: {
                    login: {
                        user: email,
                        password: password,
                        devices: 'online'
                    }
                }
            });

            const data = response.data;
            console.log('📋 Login Response:', JSON.stringify(data, null, 2));
            
            if (data.login && data.login.status === 'pass') {
                this.email = email;
                this.password = password;
                const dnsList = data.login?.data?.dnsListData || [];

                if (dnsList.length === 0) {
                    return {
                        success: false,
                        error: "No online SL BUS gateway found."
                    };
                }

                const gateway = dnsList[0];
                console.log(
    JSON.stringify(gateway.groupList, null, 2)
);

                this.uuid = gateway.uuid || '';
                this.custid = data.login.cid || '';
                this.gatewayName = gateway.dname || gateway.ipAddress || "SL BUS Gateway";

                console.log(`✅ UUID: ${this.uuid}`);
                console.log(`✅ CUSTID: ${this.custid}`);

                const groupList = gateway.groupList || [];

this.devices = [];

for (const group of groupList) {
    const nodes = group.ns || [];

    for (const node of nodes) {
        this.devices.push({
            node: Number(node.nk),          // real node key
            name: node.nn || "Unnamed",
            nodeType: Number(node.nt),
            nodeSubType: node.nst || null,

            groupId: group.groupId,
            groupName: group.groupName,
            groupKey: group.gk,

            power: false,
            brightness: 127,
            temperature: 4000,
            online: true,
            lastUpdate: Date.now()
        });
    }
}

                if (this.devices.length === 0) {
                    this.devices = [
                        { node: 0, name: 'Light 0', type: 'light', power: false, brightness: 127, temperature: 4000, online: true, lastUpdate: Date.now() },
                        { node: 1, name: 'Light 1', type: 'light', power: false, brightness: 127, temperature: 4000, online: true, lastUpdate: Date.now() }
                    ];
                }

                // Store devices in backend store
                setDevices(this.devices);

                this.connected = true;
                await this.getAccessToken(email, password);
                
                // Subscribe to MQTT
                try {
                    const mqttService = require('../services/mqttService');
                    console.log(`🔗 Subscribing MQTT with custid: ${this.custid}, uuid: ${this.uuid}`);
                    mqttService.subscribeToDevices(this.custid, this.uuid);
                } catch (err) {
                    console.log('MQTT subscription skipped:', err.message);
                }
                
                return { success: true, uuid: this.uuid, custid: this.custid, devices: this.devices };
            }
            return { success: false, error: 'Login failed' };
        } catch (error) {
            this.connected = false;
            return { success: false, error: error.message };
        }
    }

    async getAccessToken(email, password) {
        try {
            const response = await axios.post('https://slcontrol.vadactro.org.in/getaccesstoken', {
                grant_type: 'smartapp_token',
                user: email,
                password: password
            });
            this.accessToken = response.data.access_token;
            return this.accessToken;
        } catch (error) {
            throw new Error('Failed to get access token');
        }
    }

    async sendPacket(packet) {
        if (!this.accessToken || !this.uuid) {
            throw new Error('Not authenticated');
        }

        const encoded = encodePkt(packet);
        const payload = {
            cmd: {
                dlpkt: {
                    fwd: encoded
                }
            },
            uuid: this.uuid,
            access_token: this.accessToken
        };

        try {
            const response = await axios.post(
                'https://slcontrol.vadactro.org.in/slbus/alexa/cmd',
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Command failed: ${error.message}`);
        }
    }

    async turnOn(node) {
        const packet = [0, 2, (node * 2) + 1, 5, 0, 0, 0, 120];
        return this.sendPacket(packet);
    }

    async turnOff(node) {
        const packet = [0, 2, (node * 2) + 1, 0, 0, 0, 0, 120];
        return this.sendPacket(packet);
    }

    async setBrightness(node, level) {
        const packet = [0, 2, node * 2, level, 0, 0, 128, 120];
        return this.sendPacket(packet);
    }

    async setTemperature(node, kelvin) {
        const mirek = Math.round(1000000 / kelvin);
        const low = mirek & 0xFF;
        const high = (mirek >> 8) & 0xFF;
        const addr = (node * 2) + 1;

        const packets = [
            [0, 2, 165, 0, 0, 0, 0, 40],
            [0, 2, 165, 0, 0, 0, 0, 120],
            [0, 2, 163, low, 0, 0, 0, 120],
            [0, 2, 195, high, 0, 0, 0, 120],
            [0, 2, 193, 8, 0, 0, 0, 120],
            [0, 2, addr, 231, 0, 0, 0, 120],
            [0, 2, 193, 8, 0, 0, 0, 120],
            [0, 2, addr, 226, 0, 0, 0, 120],
            [0, 2, 161, 0, 0, 0, 0, 40],
            [0, 2, 161, 0, 0, 0, 0, 120]
        ];

        let lastResponse = null;
        for (const pkt of packets) {
            lastResponse = await this.sendPacket(pkt);
        }
        return lastResponse;
    }

    async queryStatus(node) {
        const packet = [0, 2, (node * 2) + 1, 144, 0, 0, 128, 20];
        return this.sendPacket(packet);
    }

    async queryBrightness(node) {
        const packet = [0, 2, node * 2, 160, 0, 0, 128, 20];
        return this.sendPacket(packet);
    }

    getStatus() {
        return {
            connected: this.connected,
            gateway: this.gatewayName,
            uuid: this.uuid,
            custid: this.custid,
            devices: this.devices
        };
    }
}

const slbusService = {
    _client: null,

    login: async (email, password) => {
        const client = new SLBusClient({ email, password });
        const result = await client.login(email, password);
        if (result.success) {
            slbusService._client = client;
        }
        return result;
    },

    getStatus: () => {
        if (slbusService._client) {
            return slbusService._client.getStatus();
        }
        return {
            connected: false,
            gateway: 'Not Connected',
            uuid: '',
            custid: '',
            devices: []
        };
    },

    getDevices: () => {
        if (slbusService._client) {
            return slbusService._client.devices || [];
        }
        return [];
    },

    turnOn: async (node) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.turnOn(node);
    },

    turnOff: async (node) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.turnOff(node);
    },

    setBrightness: async (node, level) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.setBrightness(node, level);
    },

    setTemperature: async (node, kelvin) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.setTemperature(node, kelvin);
    },

    queryStatus: async (node) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.queryStatus(node);
    },

    queryBrightness: async (node) => {
        if (!slbusService._client) throw new Error('Not logged in');
        return slbusService._client.queryBrightness(node);
    },

    getClient: () => slbusService._client
};

module.exports = { SLBusClient, slbusService };