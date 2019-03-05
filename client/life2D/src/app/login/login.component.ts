import { User } from './../user';
import { LoginService } from './../login.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loggingIn = false;
  user: User;
  private userSub: Subscription;
  constructor(
    private loginService: LoginService
  ) { }

  ngOnInit() {
    this.userSub = this.loginService.userEvent.subscribe( (user: User) => {
      console.log('got user');
      console.log(user);
      this.user = user;
      this.loginService.setUser(user);
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  login(username: string) {
    this.loginService.login(username);
    this.loggingIn = true;
  }

}
