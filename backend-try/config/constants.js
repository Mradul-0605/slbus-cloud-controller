module.exports = {
  API: {
    LOGIN: 'https://oath2.vadactro.org.in/slbus/api',
    ACCESS_TOKEN: 'https://slcontrol.vadactro.org.in/getaccesstoken',
    COMMAND: 'https://slcontrol.vadactro.org.in/slbus/alexa/cmd'
  },
  MQTT: {
    BROKER: 'mqtt://mqtt.slbus.in:1883',
    TOPIC_TEMPLATE: 'slbus/all/{custid}/{uuid}/devsts'
  },
  NODE_TYPES: {
    6: { type: 'led', name: 'LED Light', hasBrightness: true, hasTemperature: true },
    7: { type: 'switch', name: 'Switch', hasBrightness: false, hasTemperature: false },
    8: { type: 'rgb_tunable', name: 'RGB/Tunable', hasBrightness: true, hasTemperature: true },
    100: { type: 'white_tunable', name: 'Tunable White', hasBrightness: true, hasTemperature: true },  // ← Added Temperature
    101: { type: 'dimmer', name: 'Dimmer', hasBrightness: true, hasTemperature: false },
    102: { type: 'fan', name: 'Fan', hasBrightness: false, hasTemperature: false },
    103: { type: 'curtain', name: 'Curtain', hasBrightness: false, hasTemperature: false },
    106: { type: 'ac', name: 'Air Conditioner', hasBrightness: false, hasTemperature: false },
    107: { type: 'plug', name: 'Smart Plug', hasBrightness: false, hasTemperature: false },
    108: { type: 'water', name: 'Water Level', hasBrightness: false, hasTemperature: false },
    200: { type: 'reserved', name: 'Reserved', hasBrightness: false, hasTemperature: false },
    201: { type: 'controller', name: 'Controller', hasBrightness: false, hasTemperature: false }
  }
};