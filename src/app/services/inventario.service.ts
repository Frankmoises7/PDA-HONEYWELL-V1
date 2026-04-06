import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {


  constructor(
    private http: HttpClient,
    private token: TokenStorageService
  ) { }

  get(idInventario): Observable<any> {
    return this.http.get(environment.api_url + 'getInventario/'+idInventario, {
      responseType: 'json'
    });
  }

  getProducto(codigoBarra: string): Observable<any> {
    return this.http.get(environment.api_url + 'getProductoPorCodigo/' + codigoBarra, {
      responseType: 'json'
    });
  }


  getInventarios(): Observable<any> {
    return this.http.get(environment.api_url + 'getInventarios/'+this.token.getToken(), {
      responseType: 'json'
    });
  }

  getInventariosProductos(datos): Observable<any> {
    return this.http.post(environment.api_url + 'getInventariosProductos/'+this.token.getToken(), datos, {
      responseType: 'json'
    });
  }

  checkCodigoBarra(datos): Observable<any> {
    return this.http.post(environment.api_url + 'checkCodigoBarra', datos, {
        responseType: 'json'
    });
  }

  guardarCodigoBarra(datos): Observable<any> {
    return this.http.post(environment.api_url + 'guardarCodigoBarra', datos, {
        responseType: 'json'
    });
  }

  guardarCantidadInventario(datos): Observable<any> {
    return this.http.post(environment.api_url + 'guardarCantidadInventario/'+this.token.getToken(), datos, {
        responseType: 'json'
    });
  }


}
