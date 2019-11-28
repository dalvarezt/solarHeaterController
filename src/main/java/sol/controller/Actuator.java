package sol.controller;

public abstract class Actuator {
	public abstract ActuatorStatus getStatus();
	public abstract void startHeater();
	public abstract void stopHeater();
	
}
