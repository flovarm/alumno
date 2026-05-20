import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../environments/environment";
import {
  UbigeoDepartment,
  UbigeoDistrict,
  UbigeoProvince,
} from "../models/ubigeo";

@Injectable({
  providedIn: "root",
})
export class UbigeoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}Ubigeo`;

  /**
   * Obtiene todos los departamentos del Perú
   * @returns Observable con la lista de departamentos ordenados alfabéticamente
   */
  getDepartments(): Observable<UbigeoDepartment[]> {
    const url = `${this.apiUrl}/departments`;
    return this.http.get<UbigeoDepartment[]>(url);
  }

  /**
   * Obtiene un departamento específico por su ID
   * @param id ID del departamento
   * @returns Observable con el departamento
   */
  getDepartmentById(id: string): Observable<UbigeoDepartment> {
    const url = `${this.apiUrl}/departments/${id}`;
    return this.http.get<UbigeoDepartment>(url);
  }

  /**
   * Obtiene todas las provincias de un departamento específico
   * @param departmentId ID del departamento
   * @returns Observable con la lista de provincias ordenadas alfabéticamente
   */
  getProvincesByDepartment(departmentId: string): Observable<UbigeoProvince[]> {
    const url = `${this.apiUrl}/provinces/department/${departmentId}`;
    return this.http.get<UbigeoProvince[]>(url);
  }

  /**
   * Obtiene una provincia específica por su ID
   * @param id ID de la provincia
   * @returns Observable con la provincia (incluye el departamento)
   */
  getProvinceById(id: string): Observable<UbigeoProvince> {
    const url = `${this.apiUrl}/provinces/${id}`;
    return this.http.get<UbigeoProvince>(url);
  }

  /**
   * Obtiene todos los distritos de una provincia específica
   * @param provinceId ID de la provincia
   * @returns Observable con la lista de distritos ordenados alfabéticamente
   */
  getDistrictsByProvince(provinceId: string): Observable<UbigeoDistrict[]> {
    const url = `${this.apiUrl}/districts/province/${provinceId}`;
    return this.http.get<UbigeoDistrict[]>(url);
  }

  /**
   * Obtiene todos los distritos de un departamento específico
   * @param departmentId ID del departamento
   * @returns Observable con la lista de distritos ordenados alfabéticamente
   */
  getDistrictsByDepartment(departmentId: string): Observable<UbigeoDistrict[]> {
    const url = `${this.apiUrl}/districts/department/${departmentId}`;
    return this.http.get<UbigeoDistrict[]>(url);
  }

  /**
   * Obtiene un distrito específico por su ID
   * @param id ID del distrito
   * @returns Observable con el distrito (incluye la provincia y el departamento)
   */
  getDistrictById(id: string): Observable<UbigeoDistrict> {
    const url = `${this.apiUrl}/districts/${id}`;
    return this.http.get<UbigeoDistrict>(url);
  }
}
