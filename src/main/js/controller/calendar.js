/**
 * @typedef Program
 * @property {string} name - Name of the program
 * @property {Array<integer>} daysOfWeek - Array of days of week on which the program should run 0=sun, 6=sat
 * @property {string} startTime - ISO time string for the start time of the program
 * @property {string} endTime - ISO time string for the end time of the program
 * @property {number} lowThreshold - Lowest value for the temperature range of the program
 * @property {number} highThreshold - Highest value for the temperature range of the program
 */

 /**
  * @typedef Schedule 
  * @property {Program} program - The Program to which this schedule makes reference
  * @property {Date} schedule - The datetime for this schedule
  * @property {string} type - "start" or "stop"
  */

/**
 * Provides schedules for controller programs
 */
class Calendar {

    constructor() {
        this.programs = require("../calendar.json").programs;
    }
    /**
     * Returns the schedule ocurring sooner
     * @return {Schedule}
     */
    nextSchedulle() {
        let nextSchedulles = [];

        for(let pgm of this.programs){
            let pgmNextStart = this._nextOccurringDatetime(pgm.daysOfWeek, pgm.startTime);
            let pgmNextStop = this._nextOccurringDatetime(pgm.daysOfWeek, pgm.endTime);
            nextSchedulles.push({"program":pgm, "schedule":pgmNextStart, "type":"start"});
            nextSchedulles.push({"program":pgm, "schedule":pgmNextStop, "type":"stop"});
        }
        //sort all schedulles ascending
        nextSchedulles.sort( (a,b) =>{
            return a.schedule.valueOf()-b.schedule.valueOf();
        });
        //console.debug("Schedules sorted", nextSchedulles);
        return nextSchedulles.shift();

    }
    /**
     * For a given list of weekdays, finds the schedule ocurring sooner given a time string
     * @private
     * @param {Array<integer>} daysOfWeek 
     * @param {string} time 
     * @returns {Date}
     */
    _nextOccurringDatetime(daysOfWeek, time) {
        let now = new Date();
        let date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
        if(daysOfWeek.indexOf(now.getDay())>=0) {
            let dt = this._joinDateAndTime(date, time);
            if (dt > now) {
                return dt;
            } else {
                date = new Date(date.valueOf() + 24*60*60*1000);
            }
        }
        while (daysOfWeek.indexOf(date.getDay())<0) {
            date = new Date(date.valueOf() + 24*60*60*1000);
        }
        return this._joinDateAndTime(date, time);
    }
    /**
     * Constructs a timestamp joining the date part with the time part
     * @private 
     * @param {Date} date 
     * @param {string} time
     * @returns {Date} 
     */
    _joinDateAndTime(date, time) {
        let dateStr = date.toISOString().substr(0, date.toISOString().indexOf("T"));
        try {
            let timeStamp = new Date(dateStr + "T" + time);
            return timeStamp;
        } catch (err) {
            console.error(`Invalid date value ${timestamp}`, err);
            return null;
        }
    }

}
module.exports.Calendar = Calendar;