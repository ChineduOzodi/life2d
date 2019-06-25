import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import {SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { fromEventPattern } from 'rxjs';
import { SimulationComponent } from './simulation/simulation.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { ChartsComponent } from './simulation/charts/charts.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
const config: SocketIoConfig = {url: 'http://localhost:5000', options: {}};

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainComponent,
    LoginComponent,
    SimulationComponent,
    ChartsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SocketIoModule.forRoot(config),
    NgxChartsModule,
    // LoggerModule.forRoot({serverLoggingUrl: '/api/logs', level: NgxLoggerLevel.DEBUG, serverLogLevel: NgxLoggerLevel.OFF}),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
