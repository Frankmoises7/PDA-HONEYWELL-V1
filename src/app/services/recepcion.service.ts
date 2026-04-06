import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token.service';
import { HttpParams, HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class RecepcionService {

  constructor(
    private http: HttpClient,
    private token: TokenStorageService
  ) { }

  /**
   * Obtener recepciones del usuario
   */

  getRecepciones(datos: { id_usuario: number }): Observable<any> {
    const body = new HttpParams().set('id_usuario', datos.id_usuario.toString());

    return this.http.post(
      `${environment.api_url}getRecepciones/${this.token.getToken()}`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        responseType: 'json'
      }
    );
  }


  /**
 * Obtener recepciones por sucursal y estado
 */
  getRecepcionesPorEstado(datos: { id_sucursal: number, estado?: string }): Observable<any> {
    return this.http.post(environment.api_url + 'getRecepcionesPorEstado/' + this.token.getToken(), datos, {
      responseType: 'json'
    });
  }

  /**
   * Obtener productos de una recepción
   */


  getProductosRecepcion(idRecepcion: number): Observable<any> {
    const body = new HttpParams().set('id_recepcion', idRecepcion.toString());

    // console.log('📡 Llamando getProductosRecepcion con:', idRecepcion);

    return this.http.post(
      `${environment.api_url}getProductosRecepcion/${this.token.getToken()}`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        responseType: 'json'
      }
    );
  }

  getProductosEscaneados(idRecepcion: number) {
    const id_user = this.token.getUser().datos.id;

    // Armar el body con los parámetros
    const body = new HttpParams()
      .set('id_recepcion', idRecepcion.toString())
      .set('id_usuario', id_user.toString());

    console.log(this.token.getToken());

    return this.http.post<any[]>(
      `${environment.api_url}getProductosEscaneados/${this.token.getToken()}`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        responseType: 'json'
      }
    );
  }


  /**
   * Guardar escaneo de producto
   */
  guardarEscaneoRecepcion(datos: { id_recepcion: any, id_producto: any, cantidad: any, observacion?: any, editar: any }): Observable<any> {
    const body = new HttpParams()
      .set('id_recepcion', datos.id_recepcion.toString())
      .set('id_producto', datos.id_producto.toString())
      .set('cantidad', datos.cantidad.toString())
      .set('observacion', datos.observacion || '')
      // .set('id_usuario_escaneo', datos.id_usuario_escaneo.toString())
      .set('editar', datos.editar.toString());


    return this.http.post(
      `${environment.api_url}guardarEscaneoRecepcion/${this.token.getToken()}`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        responseType: 'json'
      }
    );
  }


  /**
   * Finalizar recepción
   */
  finalizarRecepcion(datos: { id_recepcion: number, observaciones?: string }): Observable<any> {
    return this.http.post(environment.api_url + 'finalizarRecepcion/' + this.token.getToken(), datos, {
      responseType: 'json'
    });
  }
}
