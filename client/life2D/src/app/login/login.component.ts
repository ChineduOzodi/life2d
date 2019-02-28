import { LoginService } from './../login.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  user: any;
  private userSub: Subscription;
  constructor(
    private loginService: LoginService
  ) { }

  ngOnInit() {
    this.userSub = this.loginService.user.subscribe( (user: any) => {
      console.log('got user');
      console.log(user);
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  login(username: string) {
    this.loginService.login(username);
  }

}
