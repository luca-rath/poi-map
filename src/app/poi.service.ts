import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type POI } from './poi.types';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PoiService {
  private apiUrl = 'http://localhost:3000/pois';

  constructor(private http: HttpClient) {}

  getAll() {
    return lastValueFrom(this.http.get<POI[]>(this.apiUrl));
  }

  create(data: Omit<POI, 'id'>) {
    return lastValueFrom(this.http.post<POI>(this.apiUrl, data));
  }

  update(id: number, data: Partial<Omit<POI, 'id'>>) {
    return lastValueFrom(this.http.patch<POI>(`${this.apiUrl}/${id}`, data));
  }

  delete(id: number) {
    return lastValueFrom(this.http.delete<POI>(`${this.apiUrl}/${id}`));
  }
}
