function encodePkt(pkt) {
    let out = "w";
    for (let val of pkt) {
        if (val <= 59) {
            out += ";";
            val += 59;
        } else if (val >= 119) {
            let t = val - 63;
            if (t >= 119) {
                t = val - 126;
                if (t >= 119) {
                    out += "x";
                    val -= 189;
                } else {
                    out += "y";
                    val = t;
                }
            } else {
                out += "z";
                val = t;
            }
        }
        if (val === 92) out += "\\";
        else out += String.fromCharCode(val);
    }
    return out;
}

function decodePkt(encoded) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const packet = [];
    let i = 1;
    while (packet.length < 8 && i < encoded.length) {
        const char = encoded[i];
        if (char === ';') {
            i++;
            packet.push(chars.indexOf(encoded[i]));
        } else if (char === 'z') {
            i++;
            packet.push(chars.indexOf(encoded[i]) + 119);
        } else if (char === 'y') {
            i++;
            packet.push(chars.indexOf(encoded[i]) + 127);
        } else if (char === 'x') {
            i++;
            packet.push(chars.indexOf(encoded[i]) + 135);
        } else if (char === '\\') {
            i++;
            packet.push(92);
        } else {
            packet.push(chars.indexOf(char));
        }
        i++;
    }
    return packet;
}

module.exports = { encodePkt, decodePkt };