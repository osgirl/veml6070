const i2c = require('i2c-bus');
const fs = require('fs');

module.exports = class Veml6070 {
    constructor(options) {
        this.highUvFile = __dirname + '/highuv';

        let opts = options || {};

        this.device = {};
        this.device.name = (opts.hasOwnProperty('name')) ? opts.name : 'VEML6070';
        this.device.type = (opts.hasOwnProperty('type')) ? opts.type : 'sensor';
        this.device.integrationTime = (opts.hasOwnProperty('integration')) ? opts.integration : 0x01;
        this.device.bus = (opts.hasOwnProperty('bus')) ? opts.bus : 1;
        this.device.addr_l = 0x38;
        this.device.addr_h = 0x39;
        this.device.addr_a = 0x0C;
        this.device.active = false;
        this.device.version = require('./package.json').version;
        this.device.correctedRaw = 0;
        this.device.parameters = [
            { name: 'uv', type: 'integer', value: NaN },
            { name: 'uv_index', type: 'integer', value: NaN }
        ];

        this.bus = i2c.openSync(this.device.bus);

        this.initialize()
        .then(() => {
            this.device.active = true;
        })
        .catch((err) => {
            this.logError('did not initialize. Not active');
        });
    }

    initialize() {
        this.readHighUV();

        // make sure the supplied integration time is valid
        if ((typeof this.device.integrationTime != 'number') || (this.device.integrationTime < 0) || (this.device.integrationTime > 3)) {
            this.device.integrationTime = 0x01;
        }

        return new Promise((resolve, reject) => {
            const cmd = (this.device.integrationTime & 0x03) << 2;
            this.bus.i2cWrite(this.device.addr_a, 1, Buffer.from([0x01]), (err, bytes, buffer) => {
                if (err) { return reject(err);}
                this.bus.i2cWrite(this.device.addr_l, 1, Buffer.from([cmd]), (err, bytesWritten, buffer) => {
                    err ? reject(err) : resolve();
                });
            });
            
        });
    }

    deviceName() {
        return this.device.name;
    }

    deviceType() {
        return this.device.type;
    }

    deviceVersion() {
        return this.device.version;
    }

    deviceNumValues() {
        return this.device.parameters.length;
    }

    typeAtIndex(idx) {
        return this.device.parameters[idx].type;
    }

    nameAtIndex(idx) {
        return this.device.parameters[idx].name;
    }

    deviceActive() {
        return this.device.active;
    }

    valueAtIndex(idx, callback) {
        if (!this.isIdxInRange(idx)) {
            callback(`Veml6070 Error: index ${idx} out of range`, null);
            return;
        }

        this.readSensorData()
        .then((data) => {
            // need to account for any increases due to integration time
            this.device.correctedRaw = Math.round(data/(this.device.integrationTime + 1));

            // keep track of the highest value sensed
            if (this.device.correctedRaw > this.device.high) { this.writeHighUV(this.device.correctedRaw); }
            this.device.parameters[0].value = data;
            this.device.parameters[1].value = this.calculateUvIndex();
            callback(null, this.device.parameters[idx].value);
        })
        .catch((err) => {
            callback(`${this.device.name} ERROR: ${err}`);
        });
    }

    valueAtIndexSync(idx) {
        if (!this.isIdxInRange(idx)) {
            this.logError(`index ${idx} out of range`);
            return NaN;
        }
        else {
            return this.device.parameters[idx].value;
        }
    }

    readSensorData() {
        this.waitForNext();

        return new Promise((resolve, reject) => {
            this.bus.receiveByte(this.device.addr_h, (err, msb) => {
                if (err) {
                    return reject(err);
                }
                this.bus.receiveByte(this.device.addr_l, (err, lsb) => {
                    err ? reject(err) : resolve(msb << 8 | lsb);
                });
            });
        });
    }

    async waitForNext() {
        var refreshTime = 0;

        // Refresh times in ms as gathered from page 8 of the datasheet.  Note that
        // these times assume a RSET resistor value of 300k ohms.
        switch (this.device.integrationTime) {
            case 0:
                refreshTime = 63;
                break;
            case 1:
                refreshTime = 125;
                break;
            case 2:
                refreshTime = 250;
                break;
            case 3:
                refreshTime = 500;
                break;
            default:
                refreshTime = 125;
        }

        await this.sleep(refreshTime);
    }

    calculateUvIndex() {
        // There are so many variables in play here, including the value of the external
        // resistor at pin 4, the angle of the sensor to the sun, the clarity of the 
        // material covering the sensor, and so on, that a meaningful index ehre is nearly
        // impossible. Likely the user of this code will need to make adjustments to 
        // calibrate the index calculation. We're gonna take a simplistic approach and
        // divide by 93.33, the step value given in the data sheet.

        // Actually, the data sheet gives a step value of 186.66, but that is for 
        // integration time 1T. The correctedRaw UV value used here has been divided
        // by 2^i (i = integration), so it is already at the lowest 0T integration value.

        // This calculation also assumes a external resister value of 270k ohms at pin 4.

        return Math.round(this.device.correctedRaw/93.33);
    }

    sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    logError(err) {
        console.error(`${this.device.name} ERROR: ${err}`);
    }

    isIdxInRange(idx) {
        if ((idx < 0) || (idx >= this.device.parameters.length)) {
            return false;
        }
        return true;
    }

    // We're keeping track of the highest raw UV value just to assist in proper calibration
    // of the index calculation. The code doesn't currently use the highest value however.
    
    readHighUV() {
        this.device.high = parseInt(fs.readFileSync(this.highUvFile, 'utf8'), 10);
    }

    writeHighUV(val) {
        this.device.high = val;
        fs.writeFileSync(this.highUvFile, val);
    }
}
