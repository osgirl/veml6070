const chai = require('chai');
const veml6070 = require('../veml6070');
const expect = chai.expect;
var Veml6070;

const maxRawUV = 2054;  // just at the 11 index

describe('VEML6070', function() {
  before(function(done) {
    
    Veml6070 = new veml6070({bus: 2});

    // takes just a wee bit of time to startup
    var waiting = setTimeout(function wait() {
      if (Veml6070.deviceActive()) {
          clearTimeout(waiting);
          done();
      }
      else {
          waiting = setTimeout(wait, 50);
      }
    }, 50);

  });

  it ('should activate the sensor device', function() {
    expect(Veml6070.deviceActive()).to.be.true;
  });

  it ('should set basic device info', function() {
    const ver = require('../package').version;
    expect(Veml6070.deviceName()).to.equal('Veml6070');
    expect(Veml6070.deviceType()).to.equal('sensor');
    expect(Veml6070.deviceVersion()).to.equal(ver);
  });

  it ('should have two parameters', function() {
    expect(Veml6070.deviceNumValues()).to.equal(2);
  });

  it ('should set parameter names', function() {
    expect(Veml6070.nameAtIndex(0)).to.equal('uv');
    expect(Veml6070.nameAtIndex(1)).to.equal('uv_index');
  });

  it ('should set parameter types', function() {
    for (let i = 0; i < Veml6070.deviceNumValues(); i++) {
      expect(Veml6070.typeAtIndex(i)).to.equal('integer');
    }
  });

  it ('should asynchronously get data from the sensor device without error', async () => {
    const data = await Veml6070.readSensorData();
    expect(data).to.be.a('number');
    expect(data).to.be.within(0, maxRawUV);
  });

  it ('should asyncronously collect raw UV value', function(done){
    Veml6070.valueAtIndex(0, function(err, value) {
      if (err) {
        done(err);
      }
      else {
        expect(value).to.be.within(0, maxRawUV);
        done();
      }
    });
  });

  it ('should asyncronously collect a UV index', function(done){
    Veml6070.valueAtIndex(1, function(err, value) {
      if (err) {
        done(err);
      }
      else {
        expect(value).to.be.within(0, 12);
        done();
      }
    });
  });

  it ('should synchronously collect raw UV value', function() {
    expect(Veml6070.valueAtIndexSync(0)).to.be.within(0, maxRawUV);
  });

  it ('should synchronously collect a UV index', function() {
    expect(Veml6070.device.parameters[1].value).to.be.within(0, 12);
  });

  it ('should asyncronously error if an out-of-bounds index is requested', function(done) {
    Veml6070.valueAtIndex(3, function(err, value) {
      if (err) {
        done();
      }
      else {
        done('Error: out-of-bounds index was not rejected');
      }
    });
  })

  it ('should synchronously error if an out-of-bounds index is requested', function(){
    expect(Veml6070.valueAtIndexSync(-1)).to.be.NaN;
  }); 

});
