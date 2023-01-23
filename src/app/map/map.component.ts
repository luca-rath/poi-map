import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat, transform } from 'ol/proj';
import { PoiService } from '../poi.service';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature, MapBrowserEvent, Overlay } from 'ol';
import { Point } from 'ol/geom';
import { type POI } from '../poi.types';
import LayerGroup from 'ol/layer/Group';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  @ViewChild('overlay') overlayRef!: ElementRef<HTMLDivElement>;
  @ViewChild('form') formRef!: ElementRef<HTMLFormElement>;
  @ViewChild('id') idRef!: ElementRef<HTMLInputElement>;
  @ViewChild('title') titleRef!: ElementRef<HTMLInputElement>;
  @ViewChild('address') addressRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cancel') cancelRef!: ElementRef<HTMLButtonElement>;

  map!: Map;
  overlay!: Overlay;
  pois: POI[] = [];
  markersLayer?: LayerGroup;

  constructor(private poiService: PoiService) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.initOverlay();
    this.loadPOIs();

    this.map.on('click', this.handleMapClick);
    this.formRef.nativeElement.addEventListener('submit', this.handleSubmit);
    this.cancelRef.nativeElement.addEventListener('click', this.handleCancel);
  }

  initMap = () => {
    this.map = new Map({
      view: new View({
        center: transform(
          [9.289173811645158, 47.389594468010614],
          'EPSG:4326',
          'EPSG:3857'
        ),
        zoom: 10,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: 'map',
    });
  };

  initOverlay = () => {
    this.overlay = new Overlay({
      element: this.overlayRef.nativeElement,
    });
    this.map.addOverlay(this.overlay);
  };

  handleMapClick = (event: MapBrowserEvent<any>): void => {
    const coordinate = event.coordinate;
    this.overlay.setPosition(coordinate);

    const feature = this.map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => feature
    );

    if (feature) {
      const featureData = feature.get('poi') as POI;
      this.idRef.nativeElement.value = featureData.id.toString();
      this.titleRef.nativeElement.value = featureData.title;
      this.addressRef.nativeElement.value = featureData.address;
    } else {
      this.idRef.nativeElement.value = '';
      this.titleRef.nativeElement.value = '';
      this.addressRef.nativeElement.value = '';
    }
  };

  handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();

    const id = this.idRef.nativeElement.value,
      title = this.titleRef.nativeElement.value,
      address = this.addressRef.nativeElement.value;

    if (!title || !address) {
      return;
    }

    if (id) {
      this.poiService.update(parseInt(id), { title, address });
      this.loadPOIs();
      this.overlay.setPosition(undefined);

      return;
    }

    const lonLat = toLonLat(this.overlay.getPosition()!);
    this.poiService.create({
      title,
      address,
      longitude: lonLat[0],
      latitude: lonLat[1],
    });

    this.loadPOIs();
    this.overlay.setPosition(undefined);
  };

  handleCancel = (event: Event): void => {
    this.overlay.setPosition(undefined);
  };

  loadPOIs = async (): Promise<void> => {
    const pois = await this.poiService.getAll();
    this.pois = pois;
    this.refreshPOIs();
  };

  refreshPOIs = (): void => {
    if (this.markersLayer) {
      this.map.removeLayer(this.markersLayer);
    }

    this.markersLayer = new LayerGroup({
      layers: this.pois.map((poi) => {
        return new VectorLayer({
          source: new VectorSource({
            features: [
              new Feature({
                poi,
                geometry: new Point(fromLonLat([poi.longitude, poi.latitude])),
              }),
            ],
          }),
          style: () => {
            return [
              new Style({
                image: new Icon({
                  scale: 0.05,
                  anchor: [0.5, 1],
                  src: 'data:image/png;base64,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',
                }),
              }),
            ];
          },
        });
      }),
    });

    this.map.addLayer(this.markersLayer);
  };
}