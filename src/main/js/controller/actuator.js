"use strict";


const SERIALPORT = "/dev/ttyACM0";
const SERIALBAUDRATE = 9600;
const SerialCommands = {
    "GETSTATUS":"STATUS",
    "STARTHEATER":"HEATER_ON",
    "STOPHEATER":"HEATER_OFF"
};
var raspi, Serial;



/**
 * @typedef ActuatorStatus
 * @property {number} temperature - The temperature on °C
 * @property {string} status - "On" if the heater is on, otherwise "off" 
 */

/**
 * @callback ActuatorCallback
 * @param {ActuatorStatus} status - The read status from the actuator
 */


class Actuator {
    constructor() {
        var boundInit = raspi.init.bind(this);
        boundInit( () => {
            this.serial = new Serial({"portId":SERIALPORT, "baudRate":SERIALBAUDRATE});
            this.serial.open();
        });
    }
    /**
     * Requests status data from the actuator which is returned to the callback
     * @param {ActuatorCallback} callback 
     */
    getStatus(callback) {
        this.serial.on("data", callback);
        this.serial.write(SerialCommands.GETSTATUS);        
    }

    startHeater() {
        this.serial.write(SerialCommands.STARTHEATER);
    }

    stopHeater() {
        this.serial.write(SerialCommands.STOPHEATER);
    }
}

 /**
  * Dummy Actuator for tests
  */
 class DummyActuator {
    constructor() {
        this.heaterOn = false;
        this.temperature = 35.0;
        this.ambientTemperature = 25.0;
        this.temperatureTime = new Date().valueOf();
    }

    /**
     * 
     * @param {ActuatorCallback} callback 
     */
    getStatus(callback) {
        this.updateTemperature();
        setImmediate(callback, { "temperature":this.temperature, "status": (this.heaterOn ? "On":"Off")} )
        
    }

    updateTemperature() {
        let currentTime = new Date().valueOf();
        let ellapsedTime = currentTime-this.temperatureTime;
        if (this.heaterOn) {
            this.temperature = this.temperature + 0.48*(ellapsedTime/(1000*60*60));
        } else {
            this.temperature = (this.ambientTemperature + (this.temperature - this.ambientTemperature)*Math.pow(Math.E, -0.02*(ellapsedTime/1000)))
        }
        this.temperatureTime = currentTime;
    }

    startHeater() {
        console.debug("Starting heater");
        this.updateTemperature();
        this.heaterOn = true;
    }

    stopHeater() {
        console.debug("Stopping heater");
        this.updateTemperature();
        this.heaterOn = false;
    }
}

try {
    raspi = require('raspi');
    Serial = require('raspi-serial').Serial;
    module.exports.Actuator = Actuator;
} catch (err) {
    module.exports.Actuator = DummyActuator;
}
