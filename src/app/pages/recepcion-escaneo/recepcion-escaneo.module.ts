import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecepcionEscaneoPageRoutingModule } from './recepcion-escaneo-routing.module';

import { RecepcionEscaneoPage } from './recepcion-escaneo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecepcionEscaneoPageRoutingModule
  ],
  declarations: [RecepcionEscaneoPage]
})
export class RecepcionEscaneoPageModule {}
