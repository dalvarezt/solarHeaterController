
const EventEmitter = require('events');

const Actuator = require("./actuator.js").Actuator;
const Calendar = require("./calendar.js").Calendar;

class ObserverImpl extends EventEmitter {
    asyncEmit(eventName, ...params) {
        setImmediate(this.emit, eventName, ...params);
    }
}

var Observer = new ObserverImpl();

const EventSubjects = {
    "TemperatureReading":"TemperatureReading",
    "ProgramStart":"ProgramStart",
    "ProgramStop":"ProgramStop",
    "ManualHeat":"ManualHeat",
};

function printLog( logString ) {
    let now = new Date();
    console.log(
        now.toLocaleDateString() + " " + now.toLocaleTimeString() + " - "+
        logString
    )
}

class Logger {
    constructor() {
        Observer.addListener(EventSubjects.TemperatureReading, this.onTemperatureReading);
        Observer.addListener(EventSubjects.ProgramStart, this.onProgramStart);
        Observer.addListener(EventSubjects.ProgramStop, this.onProgramStop);
    }



    onTemperatureReading(status) {
        printLog("Temperature reading" + JSON.stringify(status));
    }

    onProgramStart(program) {
        printLog("Program start event: " + program.name);
    }

    onProgramStop(program) {
        printLog("Program stop event: " + program.name);
    }


}



var State  = {
    "nextState":"Initializing",
    "Initializing":{
        "onEntry":function(controller) {
            printLog("Initializing State");
            State.nextState = "StandBy";
            State.controller = controller;
            controller.transition();
        }, 
        "onTransition":function() {
            return;
        }
    },
    "StandBy":{
        "onEntry":function() {
            printLog("Stand-by State")
            Observer.addListener(EventSubjects.ProgramStart, State.StandBy.onProgramStart);
        },
        "onProgramStart":function(program){
            State.program = program;
            State.nextState = "RunningProgramWaiting";
            State.controller.transition()
        },
        "onTransition":function() {
            Observer.removeListener(EventSubjects.ProgramStart, State.StandBy.onProgramStart)
        }
    },
    "RunningProgramWaiting":{
        "onEntry":function() {
            printLog("Running program - no heat state")
            State.controller.getActuator().stopHeater();
            Observer.addListener(EventSubjects.TemperatureReading, State.RunningProgramWaiting.onTemperatureReading);
            Observer.addListener(EventSubjects.ProgramStop, State.RunningProgramWaiting.onProgramStop);
        }, 
        "onTemperatureReading":function(reading) {
            if (reading.temperature < State.program.lowThreshold ) {
                State.nextState = "RunningProgramHeating";
                State.controller.transition();
            }
        },
        "onProgramStop":function() {
            State.nextState = "StandBy";
            State.controller.transition();
        }, 
        "onTransition":function() {
            Observer.removeListener(EventSubjects.TemperatureReading, State.RunningProgramWaiting.onTemperatureReading);
            Observer.removeListener(EventSubjects.ProgramStop, State.RunningProgramWaiting.onProgramStop);
        }
    },
    "RunningProgramHeating": {
        "onEntry":function() {
            printLog("Running program - heating")
            State.controller.getActuator().startHeater();
            Observer.addListener(EventSubjects.TemperatureReading, State.RunningProgramHeating.onTemperatureReading);
            Observer.addListener(EventSubjects.ProgramStop, State.RunningProgramHeating.onProgramStop);
        },
        "onTemperatureReading":function(reading) {
            if (reading.temperature >= State.program.highThreshold ) {
                State.nextState = "RunningProgramWaiting";
                State.controller.transition();
            }
        },
        "onProgramStop":function() {
            State.controller.getActuator().stopHeater();
            State.nextState = "StandBy";
            State.controller.transition();
        },
        "onTransition":function() {
            Observer.removeListener(EventSubjects.TemperatureReading, State.RunningProgramHeating.onTemperatureReading);
            Observer.removeListener(EventSubjects.ProgramStop, State.RunningProgramHeating.onProgramStop);
        }        
    }

}



class Controller {
    constructor() {
        this.actuator = new Actuator();
        this.calendar = new Calendar();
        this.currentState = "Initializing";
        this.nextSchedulle = this.calendar.nextSchedulle();
        console.debug(`Next schedule`, this.nextSchedulle);
        State.Initializing.onEntry(this);

        if (this.nextSchedulle.type=="stop") {
            console.debug(`Program ${this.nextSchedulle.program.name} should have started`);
            setTimeout( (e, pgm) => {
                Observer.emit(e, pgm);
            }, 5000, EventSubjects.ProgramStart, this.nextSchedulle.program)
            
        }

        this.interval = setInterval( actuator => {
            actuator.getStatus(status => {
                Observer.emit(EventSubjects.TemperatureReading, status);
            })
        }, 10000, this.actuator);

        setInterval(this.calendarLoop, 60*1000, this);
    }

    /**
     * 
     * @param {Controller} controller 
     */
    calendarLoop(controller) {
        let now = new Date();
        if (controller.nextSchedulle.schedule<=now) {
            console.debug(`${controller.nextSchedulle.schedule} < ${now}`);
            if (controller.nextSchedulle.type=="start") {
                console.debug("Emiting proram start");
                Observer.emit(EventSubjects.ProgramStart, controller.nextSchedulle.program); 
            } else {
                console.debug("Emiting proram stop");
                Observer.emit(EventSubjects.ProgramStop, controller.nextSchedulle.program);
            }

            controller.nextSchedulle = controller.calendar.nextSchedulle();
            console.debug("Next Schedule", controller.nextSchedulle);
        }
    }

    transition() {
        let nextState = State.nextState;
        console.debug(`Transitioning from ${this.currentState} to ${nextState}` );
        if (this.currentState) {
            State[this.currentState].onTransition();
        }
        State[nextState].onEntry();
        this.currentState = nextState;
    }
    /**
     * @return {Actuator} - Actuator instance of the controller
     */
    getActuator() {
        return this.actuator;
    }

}

module.exports.Controller = Controller;
module.exports.Logger = Logger;

