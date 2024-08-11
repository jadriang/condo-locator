"use client";

import React, { useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMarkerRef,
  MapEvent,
} from "@vis.gl/react-google-maps";
import haversine from "haversine-distance";
import { condoLocations } from "./condos";
import { PlaceAutocompleteClassic } from "./PlaceAutocompleteClassic";

interface Location {
  lat: number;
  lng: number;
}

interface Condo {
  name: string;
  lat: number;
  lng: number;
}

const MapComponent: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [nearestCondo, setNearestCondo] = useState<Condo | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);

  const [markerRef, marker] = useMarkerRef();

  const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setLocation({ lat, lng });
    }
  };

  const findNearestCondo = () => {
    if (!location) return;

    let nearest = condoLocations[0];
    let minDistance = haversine(location, nearest);

    condoLocations.forEach((condo) => {
      const distance = haversine(location, { lat: condo.lat, lng: condo.lng });
      if (distance < minDistance) {
        minDistance = distance;
        nearest = condo;
      }
    });
    setNearestCondo(nearest);
    calculateRoute(nearest);
  };

  const calculateRoute = (nearest: Condo) => {
    if (!location || !nearest) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: nearest.lat, lng: nearest.lng },
        destination: { lat: location.lat, lng: location.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setTravelTime(result?.routes[0].legs[0].duration?.text || null);
        } else {
          console.error(`Error fetching directions: ${result}`);
        }
      }
    );
  };

  const handleMapIdle = (event: MapEvent) => {
    const map = event.map;
    console.log("Map idle at", map?.getCenter()?.toString());
  };

  const handleMapDragEnd = (event: MapEvent) => {
    const map = event.map;
    console.log("Map dragged to", map?.getCenter()?.toString());
  };

  const handleZoomChanged = (event: MapEvent) => {
    const map = event.map;
    console.log("Map zoom level changed to", map.getZoom());
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="h-screen">
        <h1>Find Nearest SMDC Condo</h1>

        <PlaceAutocompleteClassic onPlaceSelect={handlePlaceSelect} />

        <button onClick={findNearestCondo}>Find Nearest Condo</button>

        {nearestCondo && (
          <div>
            <h2>Nearest Condo: {nearestCondo.name}</h2>
            <p>
              Latitude: {nearestCondo.lat}, Longitude: {nearestCondo.lng}
            </p>
            {travelTime && <p>Estimated Travel Time: {travelTime}</p>}
          </div>
        )}

        <Map
          zoom={12}
          center={location || { lat: 14.5995, lng: 120.9842 }}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          onIdle={handleMapIdle}
          onDragend={handleMapDragEnd}
          onZoomChanged={handleZoomChanged}
        >
          {location && (
            <Marker
              ref={markerRef}
              position={{ lat: location.lat, lng: location.lng }}
              label="You"
            />
          )}
          {nearestCondo && (
            <Marker
              position={{ lat: nearestCondo.lat, lng: nearestCondo.lng }}
              label={nearestCondo.name}
            />
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default MapComponent;
