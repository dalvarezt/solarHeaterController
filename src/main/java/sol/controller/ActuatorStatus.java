package sol.controller;

public class ActuatorStatus {
	private float temperature;
	private boolean isHeating;
	
	public ActuatorStatus(float t, boolean h) {
		this.temperature = t;
		this.isHeating = h;
	}
	
	public float getTemperature() {
		return temperature;
	}

	public boolean isHeating() {
		return isHeating;
	}

	
	

}
