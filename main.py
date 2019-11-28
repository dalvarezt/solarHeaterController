import serial
import json
import asyncio
import datetime 



class Actuator:
    def __init__(self, port, baudrate):
        self.ser = serial.Serial(port, baudrate)


    def read_data(self):
        self.ser.flushInput()
        line = ser.readLine()
        try:
           data = json.loads(line)
        except Exception:
            print("Error parsing data from actuator: "+line)
            return None

    def get_temp(self):
        return self.readData().temp


    def is_on(self):
        return self.readData().status==1

    def turn_on(self):
        self.ser.write("+")
    
    def turn_off(self):
        self.ser.write("-")


class Program:
    def __init__(self, name, start_time, end_time, days_of_week, low_threshold, high_threshold):
        self.name = name
        self.start_time = start_time
        self.end_time = end_time
        self.days_of_week = days_of_week
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold

    def get_name(self):
        return self.name

    def should_run_now(self):
        now = datetime.utcnow()
        day = now.weekday
        try:
            idx = self.days_of_weeek.index(day)
        except Exception:
            return false
        
        return self.start_time <= now.time() <= self.end_time

        
class Controller:
    def __init__(self, actuator):
        self.actuator = actuator
        self.programs = List()

    def add_program(self, pgm):
        self.append(pgm)



def main():
    ac = Actuator("/dev/ttyACM0", 9600)
    print("Temperature %d" % ac.get_temp())

    ac.turn_on()



