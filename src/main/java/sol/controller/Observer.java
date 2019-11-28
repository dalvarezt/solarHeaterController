package sol.controller;

import java.util.concurrent.SynchronousQueue;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;


public class Observer {
	private static SynchronousQueue<Event> eventQueue = new SynchronousQueue<Event>();
	private static HashMap<String,ArrayList<EventListener>> listeners = new HashMap<String, ArrayList<EventListener>>();
	private static ExecutorService executor = Executors.newFixedThreadPool(1);

	public static synchronized void emit(Event e) {
		eventQueue.add(e);
		
		Callable<?> loop = () -> {
			Observer.eventLoop();
			return null;
		};
		
		executor.submit(loop);
	}
	
	private static synchronized void eventLoop() {
		eventQueue.forEach(e -> {
			ArrayList<EventListener> listenerArray = listeners.get(e.getSubject());
			if (listenerArray!=null) {
				listenerArray.forEach(listener -> listener.notify(e));
			}
		});
	}
	
	private static synchronized void registerListener(EventListener el, String subject) {
		ArrayList<EventListener> listenerArray = listeners.get(subject);
		if (listenerArray == null) {
			listenerArray = new ArrayList<EventListener>();
			listenerArray.add(el);
			listeners.put(subject, listenerArray );
		} else {
			listenerArray.add(el);
			listeners.put(subject, listenerArray);
		}
	}
	
	private static synchronized void unregisterListener(EventListener el) {
		listeners.forEach((key,listenerArray) -> {
			listenerArray.forEach(listener -> {
				if (listener.equals(el)) {
					listenerArray.remove(listener);
				}
			});
		});
		
	}
}
