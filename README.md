## Driver for VEML6070 sensor

##### This driver should work on any Linux platform, and has been thoroughly tested on BBB and RPi

### Install
```
npm install @agilatech/veml6070
```

### Usage
##### Load the module and create an instance
```
const Veml6070 = require('@agilatech/veml6070');
const veml6070 = new Veml6070();
// creates an driver with all default options, including i2c-1 bus 

// after instantiation, the device may be polled/queried
if (veml6070.isActive()) {
    
    veml6070.readSensorData().then((data) => {
        console.log(`Raw asynchronous read UV: ${data}`);
    }).catch((err) => {
        console.error(`Raw asynchronous read err: ${err}`);
    });

    veml6070.valueAtIndex(1, (err, val) => {
        if (!err) {
            console.log(`Asynchronous UV index value fetch : ${val}`);
        }
    });
}
```

**Options**
```
Veml6070([options])
```
The constructor can be supplied with options to specify certain driver characteristics. The options object allows the following parameters:
* bus : The number of the I2C bus. The number 1 indicates '/dev/i2c-1'. Defaults to 1.
* name : The name given to this particular driver instance. Defaults to 'Veml6070'.
* type : The type given to this particular driver instance. Defaults to 'sensor'.
* integration: An index from 0-3 realting the time period in milliseconds for which the radiation is sampled. Defaults to 1. (0x00 = 63ms, 0x01 = 125ms, 0x02 = 250ms, 0x03 = 500ms)

Here is an example of a constuctor with all options specified:
```
const veml6070 = new Veml6070({bus: 2, name: 'uv-1', type: 'light', integration: 0x02});
```

Most options are fairly self-explanitory, but integration time requires further explanation:

##### integration
Four possible integration times are selectable. Associated result counts are strictly linear by a factor of 2^i. This means an integration of 2 results in a factor of 4 in output data counts. The greater the integration time, the more sample counts will be made. In theory, this will result in a more accurate result, but will also require more time, up to half-second. 


### Get basice device info
```
const name = veml6070.deviceName();  // returns string with name of device
const type = veml6070.deviceType();  // returns string with type of device
const version = veml6070.deviceVersion(); // returns this driver software version
const active = veml6070.deviceActive(); // true if initialized and acgtive, false if inactive
const numVals =  veml6070.deviceNumValues(); // returns the number of paramters sensed
```


#### device object
The Veml6070.device object contains the basic information as given in the above getters, and also the 'parameters' array. The 'parameters' array contains the name, data type, and current value of each and every parameter for the device.
```
Veml6070.device.parameters[0] = {
    name: 'uv',
    type: 'integeer',
    value: <raw UV reading>
}

Veml6070.device.parameters[1] = {
    name: 'uv_index',
    type: 'integer',
    value: <calculated UV index>
}
```


### Get individual parameter values by index
Asynchronously:
```
veml6070.valueAtIndex(index, (err, value) => {
    if (!err) {
        val = value;
    }
});
```
Synchronously:
```
val = veml6070.getValueAtIndexSync(index);
// returns NaN if upon error
```

### Poll sensor for raw UV reading
```
Veml6070.readSensorData()
```
Asyncronously polls the device and returns a promise. Successful resolution returns the raw UV sensor reading. Note that the raw UV reading is increased linearly with the integration time. What this means is that an integration of 0x03 will reaulst in a raw reading EIGHT times greater that an intergration of 0x00. Similarly, an integration of 0x01 and 0x02 will be twice and four times greater, respectively, than an integration of 0x00.


### Operation Notes
This driver is specific to the VEML6070 UVA sensor, and will not work with the related VEML6075 sensor.

The photodiode in this sensor has its peak sensitivity at 355nm, which is smack dab in the middle of the UVA spectrum. It does not measure UVB or any other light frequency well.

The integration time parameter simply controls the number of samples collected by a factor of 2^i. However, the sensor makes no internal adjustment for the fact that 8 times as much radiation is collected at integration 0x03 as 0x00.  Therefore, the raw UV reading is 2x as much for integration 0x01, 4x as much for integration 0x02, and 8x as much for 0x03. 

The UV index given by this driver is a rough estimate at best. Actually, UV index itself is questionable, even when sensed by more accurate devices and carefully calculated. See https://web.archive.org/web/20100613192249/http://www.serc.si.edu/labs/photobiology/UVIndex_calculation.aspx

The code takes a simplistic approach of dividing the raw value by 93.3 to obtain a UV index. This asusmes a 0 degree alignment with the sun and a 270k ohm resistor at pin 4. 

The code is currently keeping track of the highest raw UV value collected. This is held in a file called 'highuv' and can be found in the same directory as the module itself.


### Dependencies
* i2c-bus is used to communicate with the device on the i2c bus


### Copyright
Copyright © 2019 Agilatech. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
