<template>
  <header>
    <div class="wrapper"></div>
  </header>
  <div id="app" style="margin: 0 1.5% 1.5%">
    <a-input
      type="text"
      v-model:value="searchInput"
      placeholder="Bookmark your destination"
      v-on:keyup.enter="searchLocation"
      style="width: 30%; margin-top: 1%"
    />
    <a-space style="margin: 1% 5% 1%">
      <a-button @click="searchLocation">Search</a-button>
      <a-button @click="getCurrentLocation">Get Current Location</a-button>
      <a-button
        type="primary"
        danger
        @click="deleteSelectedLocations(selectedLocations)"
        :disabled="selectedLocations.length == 0"
        >Delete</a-button
      >
    </a-space>
    <div id="map" style="width: 100%; height: 60vh"></div>

    <!-- <div>Time Zone: {{ timeZone }} Local Time: {{ localTime }}</div> -->
    <a-typography-title :level="5"
      >Time Zone: {{ timeZone }}</a-typography-title
    >
    <a-typography-title :level="5"
      >Local Time: {{ localTime }}</a-typography-title
    >
    <a-table
      :row-selection="rowSelection"
      :columns="columns"
      :data-source="locationList"
      bordered
      :pagination="{
        pageSize: 10,
      }"
    />
  </div>
</template>
<script>
/* eslint-disable no-undef */

import { computed, ref, onMounted, onUnmounted, watch, toRaw } from "vue";
import { Loader } from "@googlemaps/js-api-loader";
import axios from "axios";
import process from "process";
let map;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_APP_GOOGLE_API_KEY;
export default {
  name: "Bookmark Your Destination",
  setup() {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
    });

    async function initMap() {
      await loader.load();
      var location = { lat: 43.65107, lng: -79.347015 };
      map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 7,
      });
    }

    initMap();
  },
  data() {
    return {
      markers: [],
      searchInput: "",
      selectedLocations: [],
      totalLocationCount: 0,
      timeZone: "-",
      localTime: "-",
      columns: [
        {
          title: "Address",
          dataIndex: "address",
          key: "address",
        },
        {
          title: "Location (lat, lng)",
          dataIndex: "location",
          key: "location",
        },
      ],
      locationList: [],
      rowSelection: {
        onChange: (selectedRowKeys, selectedRows) => {
          this.selectedLocations = [];
          selectedRows.map((row) => this.selectedLocations.push(row.key));
        },
      },
    };
  },
  methods: {
    // Get user current location by geolocation
    getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          map = new google.maps.Map(document.getElementById("map"), {
            center: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            zoom: 7,
          });
        });
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    },

    // Crreate bookmark on the map
    createMarker(place) {
      if (!place.geometry || !place.geometry.location) return;
      var queryLocation = place.geometry.location;
      const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
      });
      this.markers.push(marker);
      this.totalLocationCount += 1;
      this.locationList.push({
        key: this.totalLocationCount,
        address: this.searchInput,
        location: `(${queryLocation.lat()}, ${queryLocation.lng()})`,
        marker: marker,
      });
    },

    // Get Timezone and local time for search location
    async getTimeZone(latitude, longitude) {
      const TIMEZONE_API = "https://maps.googleapis.com/maps/api/timezone/json";
      var date = new Date();
      var response = await axios.get(TIMEZONE_API, {
        params: {
          location: `${latitude}, ${longitude}`,
          timestamp: 1331766000,
          key: GOOGLE_MAPS_API_KEY,
        },
      });
      this.localTime = "-";
      this.timeZone = "-";
      if (response.status === 200) {
        const { data } = response;
        date = new Date();
        this.localTime = date.toLocaleString("en-US", {
          timeZone: data.timeZoneId,
        });
        this.timeZone = data.timeZoneName;
      }
    },

    // Search for location using goggle api
    searchLocation() {
      const request = {
        query: this.searchInput,
        fields: ["name", "geometry"],
      };
      let service = null;
      service = new google.maps.places.PlacesService(map);
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          var queryLocation = results[0].geometry.location;
          this.getTimeZone(queryLocation.lat(), queryLocation.lng());
          this.createMarker(results[0]);
          map.setCenter(queryLocation);
        }
      });
    },

    // Remove locations that checked in the table, and remove the marker from the map
    deleteSelectedLocations(removeList) {
      var updateLocationList = this.markers;
      removeList.map((index) => {
        var locationIndex = this.locationList.findIndex(
          (location) => location.key === index
        );
        toRaw(this.locationList[locationIndex].marker).setMap(null);
        updateLocationList.splice(index, 1);
      });
      this.markers = updateLocationList;

      this.locationList = this.locationList.filter(
        (location) => !removeList.includes(location.key)
      );
      this.selectedLocations = [];
    },
  },
};
</script>

<style scoped></style>
