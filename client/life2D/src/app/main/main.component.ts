import { SimulationService } from './../simulation.service';
import { Socket } from 'ngx-socket-io';
import { LoginService } from './../login.service';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  title = 'life2D';
  user: any;
  userSub: Subscription;
  error: string;
  errorSub: Subscription;
  constructor(
    private simulationService: SimulationService,
    private loginService: LoginService
    ) { }

  ngOnInit() {
    this.errorSub = this.simulationService.error.subscribe( (err: string) => {
      this.error = err;
    });
    this.userSub = this.loginService.user.subscribe( (user) => {
      this.user = user;
    });
  }

}
