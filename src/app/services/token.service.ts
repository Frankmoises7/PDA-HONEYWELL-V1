import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const EXPIRES = 'token-expires';

@Injectable({
  providedIn: 'root'
})

export class TokenStorageService {

  constructor() { }


  public saveToken(token): void {

    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token.token);
    window.localStorage.removeItem(EXPIRES);
    window.localStorage.setItem(EXPIRES, token.fecha_expiracion);
  }

  public checkToken(): boolean {
    
    if (!localStorage.getItem(TOKEN_KEY)){
      return false;
    }
    const token = localStorage.getItem(TOKEN_KEY);

    if (token.length < 2){
      return false;
    }

    const expira = Date.parse(localStorage.getItem(EXPIRES));
    const expiraFecha = new Date();
    expiraFecha.setTime(expira);

    if (expiraFecha > new Date()) {
      return true;
    } else {
      return false;
    }
  }

  public getToken(): string{
    return localStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    return JSON.parse(localStorage.getItem(USER_KEY));
  }
}