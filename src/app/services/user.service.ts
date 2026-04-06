import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  usuario: any;

  constructor(
    private http: HttpClient,
    private token: TokenStorageService
  ) {

  }

  login(datos): Observable<any> {
    return this.http.post(environment.api_url + 'login2', datos, {
        responseType: 'json'
    });
  }

  almacenarUsuario(usuario: any): void {
    this.usuario = usuario;
    window.localStorage.setItem('user', JSON.stringify(usuario));
  }

  getUsuario(): any {
    const stored = window.localStorage.getItem('user');
    if (stored) {
      this.usuario = JSON.parse(stored);
      return this.usuario;
    }
    return null;
  }


}
