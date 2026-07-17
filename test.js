const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://mqtt.slbus.in:1883");

client.on("connect", () => {
    console.log("Connected");

    client.subscribe("slbus/#", (err, granted) => {
        console.log("Subscribe Error:", err);
        console.log("Granted:", granted);
    });
});

client.on("message", (topic, msg) => {
    const text = msg.toString();

    if (text.includes("3834393432011971a841f4184521")) {   // your UUID here
        console.log(topic);
        console.log(text);
    }
});

client.on("error", (err) => {
    console.log("MQTT Error:", err);
});

client.on("close", () => {
    console.log("Connection Closed");
});