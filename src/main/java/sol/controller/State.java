package sol.controller;

public interface State {
	
	public void onEntry();
	
	public Class<State> getNextState();
	
	public void onExit();
	
}
