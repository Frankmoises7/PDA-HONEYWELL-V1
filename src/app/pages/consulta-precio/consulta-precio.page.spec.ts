import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultaPrecioPage } from './consulta-precio.page';

describe('ConsultaPrecioPage', () => {
  let component: ConsultaPrecioPage;
  let fixture: ComponentFixture<ConsultaPrecioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultaPrecioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
