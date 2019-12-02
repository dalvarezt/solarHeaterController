#define RELAY1 8
#define RELAY2 9
#define TEMPSENSOR 0
#define MAXTEMPC 75
#define MAXTIME 7200000

float Vin=5.0;     // [V]        
float Rt=1000;    // Resistor t [ohm]
float R0=10000;    // value of rct in T0 [ohm]
float T0=298.15;   // use T0 in Kelvin [K]
float Vout=0.0;    // Vout in A0 
float Rout=0.0;    // Rout in A0
// use the datasheet to get this data.
float T1=273.15;      // [K] in datasheet 0º C
float T2=373.15;      // [K] in datasheet 100° C
float RT1=35563;   // [ohms]  resistence in T1
float RT2=549;    // [ohms]   resistence in T2
float beta=0.0;    // initial parameters [K]
float Rinf=0.0;    // initial parameters [ohm]   
float TempK=0.0;   // variable output
float TempC=0.0;   // variable output
boolean onStatus = false;
int onTime = 0;
int offTime = 0;


void setup() {
  pinMode(TEMPSENSOR, INPUT);
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  Serial.begin(9600);
  offTime = millis();
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);
  //parâmetros
  beta=(log(RT1/RT2))/((1/T1)-(1/T2));
  Rinf=R0*exp(-beta/T0);
}

void loop()
{

  Vout=Vin*((float)(analogRead(0))/1024.0); // calc for ntc
  Rout=(Rt*Vout/(Vin-Vout));

  TempK=(beta/log(Rout/Rinf)); // calc for temperature
  TempC=TempK-273.15;
  
  boolean switchOn = false;
  //Read commands from serial if any
  while(Serial.available() > 0) {
    char inC = Serial.read();
    switch (inC) {
      case '+':
        if(!onStatus && TempC < MAXTEMPC && millis()-onTime < MAXTIME) {
          digitalWrite(RELAY1, LOW);
          digitalWrite(RELAY2, LOW);
          onTime=millis();
          onStatus=true;
        }
        break;
      case '-':
        if(onStatus) {
          digitalWrite(RELAY1, HIGH);
          digitalWrite(RELAY2, HIGH);
          onTime=0;
          onStatus=false;
        }
        break;
      case 'r': 
        onTime=0;
    }
  }

  if(TempC>=MAXTEMPC && onStatus) {
    digitalWrite(RELAY1, HIGH);
    digitalWrite(RELAY2, HIGH);
    onStatus = false;
    onTime = 0;
  }

  if(onStatus && millis()-onTime >= MAXTIME) {
    digitalWrite(RELAY1, HIGH);
    digitalWrite(RELAY2, HIGH);
    onStatus = false;
  }
  
  Serial.println("{\"temp\":" + String(TempC) + ",\"status\":" + String(onStatus) + "}" );
  delay(1000);
}
