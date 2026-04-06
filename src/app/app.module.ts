import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';



import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NoCacheInterceptor } from './no-cache.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      // Evita que Ionic desplace automáticamente el contenido al enfocar inputs.
      // Con modales custom + teclado nativo puede provocar "saltos" excesivos.
      scrollAssist: false
    }),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: NoCacheInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
