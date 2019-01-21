
const driver = require('../veml6070');

var hardware = new driver({bus: 2});

const test = function() { 

    console.log("\nStarting test ...");

    for (var i = 0; i < hardware.deviceNumValues(); i++) {
        hardware.valueAtIndex(i, (err, val) => {
            console.log(`Asynchronous value fetch return : ${val}`);
        });
    }

    hardware.readSensorData().then((data) => {
        console.log(`Raw asynchronous read UV: ${data}`);
    }).catch((err) => {
        console.error(`Raw asynchronous read err: ${err}`);
    });

    var output = {
        data: {
            names: [],
            types: [],
            values: []
        }
    }

    output['name'] = hardware.deviceName();
    output['type'] = hardware.deviceType();
    output['version'] = hardware.deviceVersion();
    output['active'] = hardware.deviceActive();
        
    for (var i = 0; i < hardware.deviceNumValues(); i++) {
        output.data.names.push(hardware.nameAtIndex(i));
        output.data.types.push(hardware.typeAtIndex(i));
        output.data.values.push(hardware.valueAtIndexSync(i));
    }

    console.log("\nData retrieval via valueAtIndexSync method:");
    console.log(JSON.stringify(output, null, 2));

    setTimeout(() => {
        console.log('\nNow testing again. (ctrl-c to quit this merry-go-round)');
        test();  
    }, 4000);
}

test();
