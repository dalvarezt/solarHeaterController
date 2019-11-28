package sol.controller;

import java.time.LocalTime;

class Program {
    private String name;
    private int[] daysOfWeek;
    private float lowThreshold;
    private float highThreshold;
    private LocalTime startTime;
    private LocalTime endTime;

    public Program(String n, int[] dow, LocalTime st, LocalTime et, float lt, float ht) {
        this.name = n;
        this.daysOfWeek = dow;
        this.lowThreshold = lt;
        this.highThreshold = ht;
        this.startTime = st;
        this.endTime = et;
    }

    public String getName() {
        return this.name;
    }

    public int[] getDaysOfWeek() {
        return this.daysOfWeek;
    }

    public float getLowThreshold() {
        return this.lowThreshold;
    }

    public float getHighThreshold() {
        return this.highThreshold;
    }

    public LocalTime getStartTime() {
        return this.startTime;
    }

    public LocalTime getEndtime() {
        return this.endTime;
    }

    public boolean highThresholdReached(float temp) {
        return temp>=this.highThreshold;
    }

    public boolean lowThresholdReached(float temp) {
        return temp<=this.lowThreshold;
    }


}