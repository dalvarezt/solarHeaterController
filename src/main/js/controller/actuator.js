"use strict";



const logger = require("./logger").logger.child({ module: "actuator" });
const SerialCommands = {
    "GETSTATUS": "ST\n",
    "STARTHEATER": "HON\n",
    "STOPHEATER": "HOF\n"
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
        this.commandQueue = []
        setInterval(this._sendCommand, 1000, this);
        var boundInit = raspi.init.bind(this);
        boundInit(() => {
            this.observer = observer;
            this.serial = new Serial({ "portId": process.env.actuator_serialPort, "baudRate": parseInt(process.env.actuator_serialBaudRate) });
            this.serial.open();
            this.chunks = [];

            this.serial.on("data", chunk => {
                this.chunks.push(chunk);
                let data = Buffer.concat(this.chunks).toString();
                if (data.indexOf("\n")>0) {
                    let reading = data.substr(0, data.indexOf("}")+1)
                    try {
                       this.observer.emit("TemperatureReading", JSON.parse(reading));
                     } catch (err) {
                         logger.error("Can convert reading to JSON: " + data, err);
                     }
                    this.chunks = [];
                    //this.chunks.push(Buffer.from(data.substr(data.indexOf("\n"), data.length-data.indexOf("\n")-1 )))
                }
            });
        });
    }

    _sendCommand(act) {
        let cmd = act.commandQueue.shift()
        if (cmd) {
            act.serial.write(cmd);
        }
    }

    /**
     * Requests status data from the actuator which is returned to the callback
     * @param {ActuatorCallback} callback 
     */
    getStatus() {
        this.commandQueue.push(SerialCommands.GETSTATUS);
    }

    startHeater() {
        this.commandQueue.push(SerialCommands.STARTHEATER);
    }

    stopHeater() {
        this.commandQueue.push(SerialCommands.STOPHEATER);
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
