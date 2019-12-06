"use strict";



const logger = require("./logger").logger.child({ module: "actuator" });
const SerialCommands = {
    "GETSTATUS": "STATUS\n",
    "STARTHEATER": "HEATER_ON\n",
    "STOPHEATER": "HEATER_OFF\n"
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
    constructor(observer) {
        var boundInit = raspi.init.bind(this);
        boundInit(() => {
            this.observer = observer;
            this.serial = new Serial({ "portId": process.env.actuator_serialPort, "baudRate": parseInt(process.env.actuator_serialBaudRate) });
            this.serial.open();
            this.chunks = [];

            this.on("data", chunk => {
                this.chunks.push(chunk);
                let data = Buffer.concat(this.chunks).toString();
                if (data.endsWith("}")) {
                    this.observer.emit("TemperatureReading", JSON.parse(data));
                    this.chunks = [];
                }
            }).bind(this);
        });
    }

    /**
     * Requests status data from the actuator which is returned to the callback
     * @param {ActuatorCallback} callback 
     */
    getStatus() {
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
        setImmediate(callback, { "temperature": this.temperature, "status": (this.heaterOn ? "On" : "Off") })

    }

    updateTemperature() {
        let currentTime = new Date().valueOf();
        let ellapsedTime = currentTime - this.temperatureTime;
        if (this.heaterOn) {
            this.temperature = this.temperature + 0.48 * (ellapsedTime / (1000 * 600));
        } else {
            this.temperature = (this.ambientTemperature + (this.temperature - this.ambientTemperature) * Math.pow(Math.E, -0.02 * (ellapsedTime / 1000)))
        }
        this.temperatureTime = currentTime;
    }

    startHeater() {
        logger.log('debug', "Starting heater");
        this.updateTemperature();
        this.heaterOn = true;
    }

    stopHeater() {
        logger.log('debug', "Stopping heater");
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
