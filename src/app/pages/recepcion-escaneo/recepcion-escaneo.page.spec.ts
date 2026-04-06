import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecepcionEscaneoPage } from './recepcion-escaneo.page';

describe('RecepcionEscaneoPage', () => {
  let component: RecepcionEscaneoPage;
  let fixture: ComponentFixture<RecepcionEscaneoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecepcionEscaneoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
