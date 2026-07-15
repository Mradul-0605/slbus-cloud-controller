const axios = require('axios');
const { encodePkt } = require('./encoder');

class SLBusClient {
    constructor(config) {
        this.email = config.email;
        this.password = config.password;
        this.uuid = '';
        this.accessToken = '';
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
            if (data.login && data.login.status === 'pass') {
                this.email = email;
                this.password = password;
                this.uuid = data.login.data.dnsListData[0].uuid;
                this.gatewayName = data.login.data.dnsListData[0].ipAddress || 'SL BUS Gateway';
                
                const groupList = data.login.data.dnsListData[0].groupList || [];
                this.devices = groupList.map((group, index) => ({
                    node: index,
                    name: group.groupName || `Light ${index + 1}`,
                    type: 'light'
                }));

                if (this.devices.length === 0) {
                    this.devices = [
                        { node: 0, name: 'Light One', type: 'light' },
                        { node: 1, name: 'Light Two', type: 'light' }
                    ];
                }

                this.connected = true;
                await this.getAccessToken(email, password);
                return { success: true, uuid: this.uuid, devices: this.devices };
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
        const response = await this.sendPacket(packet);
        // Return whatever the gateway says
        return { data: response };
    }

    async queryBrightness(node) {
        const packet = [0, 2, node * 2, 160, 0, 0, 128, 20];
        const response = await this.sendPacket(packet);
        return { data: response };
    }

    getStatus() {
        return {
            connected: this.connected,
            gateway: this.gatewayName,
            uuid: this.uuid,
            devices: this.devices
        };
    }
}

module.exports = { SLBusClient };