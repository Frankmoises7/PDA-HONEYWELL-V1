import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecepcionMercaderiaPage } from './recepcion-mercaderia.page';

describe('RecepcionMercaderiaPage', () => {
  let component: RecepcionMercaderiaPage;
  let fixture: ComponentFixture<RecepcionMercaderiaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecepcionMercaderiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
