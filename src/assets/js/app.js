var map, featureList, departementsSearch = [],
  cantonsSearch = [];

$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});

$(document).on("mouseover", ".feature-row", function(e) {
  var layer = cantons.getLayer($(this).attr('id'));
  highlight.clearLayers().addLayer(L.multiPolygon(layer.feature.geometry.coordinates, highlightStyle));
  //highlight.clearLayers().addLayer(layer,highlightStyle);
  // clearHighlight();
  // highlight.addLayer(layer,highlightStyle);
});

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(departements.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#gwada-extent-btn").click(function() {
  map.setView([16.11179, -61.42044], 9);
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#reu-extent-btn").click(function() {
  map.setView([-21.1255, 55.52078], 9);
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#may-extent-btn").click(function() {
  map.setView([-12.83323, 45.15656], 10);
  $(".navbar-collapse.in").collapse("hide");
  return false;
});


$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}

function sidebarClick(id) {
  var layer = cantons.getLayer(id);
  map.fitBounds(layer.getBounds());
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  /* Loop through theaters layer and add only features which are in the map bounds */
  cantons.eachLayer(function(layer) {
    if (map.hasLayer(cantons)) {
      if (map.getBounds().intersects(layer.getBounds())) {
        $("#feature-list tbody").append(featureRowCanton(layer));
      }
    }
  });

  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"],
    plugins: [ListFuzzySearch()]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
}

function featureRowCanton(layer) {
  var content = '<tr class="feature-row" id="' + L.stamp(layer) + '"><td style="vertical-align: middle;"><i class="fa fa-bar-chart"></i></td><td class="feature-name">' + layer.feature.properties.nom + ' (' + layer.feature.properties.ref + ' / ' + layer.feature.properties.bureau + ')</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>';
  return content;
}

/* Basemap Layers */
var darkGray = L.tileLayer('http://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 16,
  attribution: 'Esri, HERE, DeLorme, MapmyIndia, © OpenStreetMap contributors, and the GIS user community'
});
var gray = L.tileLayer('http://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 16,
  attribution: 'Esri, HERE, DeLorme, MapmyIndia, © OpenStreetMap contributors, and the GIS user community'
});
var topo = L.tileLayer('http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: 'Esri, HERE, DeLorme, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, MapmyIndia, © OpenStreetMap contributors, and the GIS User Community '
});

/* Overlay Layers */
var highlight = L.geoJson(null);
//var highlight = L.layerGroup(null);
var highlightStyle = {
  stroke: true,
  color: "#d35400",
  weight: 3,
  fill: true,
  fillColor: "#2980b9",
  fillOpacity: 1
};

var nuances, firstRoundResults, secondRoundResults;

d3.tsv("data/nuances.tsv", function(error, data) {
  nuances = data;
});

function getParti(nuance) {
  var stop = false;
  var parti = "non disponible";
  for (var i = 0; i < nuances.length && !stop; i++) {
    if (nuances[i]["Nuance"] === nuance) {
      parti = nuances[i]["Libellé"];
    }
  }
  return parti;
}

function getCouleur(nuance) {
  var stop = false;
  var couleur = "#dbdbdb";
  for (var i = 0; i < nuances.length && !stop; i++) {
    if (nuances[i]["Nuance"] === nuance) {
      couleur = nuances[i]["Couleur"];
    }
  }
  return couleur;
}

function getMatchingResult(ref) {
  var flag = false;
  var datum = null;
  var results = firstRoundResults;
  for (var i = 0; i < results.length && !flag; i++) {
    var codeDep = results[i]["Code du département"];
    var codeCanton = results[i]["Code du canton"];
    var code = parseInt(codeDep).toLocaleString('fr-FR', {
      minimumIntegerDigits: 3
    }) + '-' + parseInt(codeCanton).toLocaleString('fr-FR', {
      minimumIntegerDigits: 2
    });
    if (ref === code) {
      flag = true;
      datum = results[i];
    }
  }
  return datum;
}

d3.csv("data/Departementales_2015_Resultats_Tour1_par_canton.csv", function(error, data) {
  firstRoundResults = data;
});

var departements = L.geoJson(null, {
  style: function(feature) {
    return {
      color: "black",
      fill: false,
      opacity: 1,
      clickable: false
    };
  },
  onEachFeature: function(feature, layer) {
    departementsSearch.push({
      name: layer.feature.properties.NOM_DEPT,
      code: layer.feature.properties.CODE_DEPT,
      region: layer.feature.properties.NOM_REGION,
      source: "Departements",
      id: L.stamp(layer),
      bounds: layer.getBounds()
    });
  }
});
$.getJSON("data/departements_simplify.geojson", function(data) {
  departements.addData(data);
});

function updateColor(feature) {
  var couleur = '#9b59b6';
  if (firstRoundResults) {
    var datum = getMatchingResult(feature.properties.ref);
    var maxValue = 0;
    var index = -1;
    if (datum) {
      var stop = false;
      for (var a = 0; a < 11; a++) {
        if (datum['Nuance' + a] === '') {
          stop = true;
        } else {
          if (datum['Voix' + a] > maxValue) {
            maxValue = datum['Voix' + a];
            index = a;
          }
        }
      }
      if (index !== -1) {
        couleur = getCouleur('Nuance' + index);
      }
    }
  }
  return couleur;
}

function d3DD(id, data) {

}

var cantons = L.geoJson(null, {
  style: function(feature) {
    return {
      weight: 2,
      opacity: 0.5,
      color: '#9b59b6',
      dashArray: '3',
      fill: true,
      fillColor: '#9b59b6',
      fillOpacity: 0.1,
      clickable: true
    };
  },
  onEachFeature: function(feature, layer) {
    if (feature.properties) {
      // fill sidebar
      //$("#feature-list tbody").append(featureRowCanton(layer));
      // array for ListJS
      cantonsSearch.push({
        name: layer.feature.properties.nom,
        dept: layer.feature.properties.dep,
        source: "Cantons",
        id: L.stamp(layer),
        bounds: layer.getBounds()
      });
      // click
      if (feature.properties.wikipedia === null) {
        // cleanup
        feature.properties.wikipedia = '';
      }
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Nom</th><td>" + feature.properties.nom + "</td></tr>" + "<tr><th>Référence</th><td>" + feature.properties.ref + "</td></tr>" + "<tr><th>Bureau</th><td>" + feature.properties.bureau + "</td></tr>" + "<tr><th>Wikipedia</th><td><a class='url-break' href='" + encodeURI(feature.properties.wikipedia) + "' target='_blank'>" + feature.properties.wikipedia + "</a></td></tr>" + "<tr><th>jorf</th><td>" + feature.properties.jorf + "</td></tr>" + "<table>";
      layer.on({
        click: function(e) {

          var polygon = L.polygon(layer.feature.geometry.coordinates, {
            clickable: false,
            color: "#0033ff",
            dashArray: null,
            fill: true,
            fillColor: "#f1c40f",
            fillOpacity: 0.7,
            lineCap: null,
            lineJoin: null,
            noClip: false,
            opacity: 0.5,
            smoothFactor: 1,
            stroke: true,
            weight: 5
          });
          highlight.clearLayers().addLayer(polygon); // why it does not work ?

          var ref = feature.properties.ref;
          var contentFirstRound = "<table class='table table-striped table-bordered table-condensed'>";
          var pieData = [];
          var datum = getMatchingResult(ref);
          if (datum) {
            var stop = false;
            for (var a = 0; a < 11; a++) {
              if (datum['Nuance' + a] === '') {
                stop = true;
              } else {
                var parti = getParti(datum['Nuance' + a]);
                var voix = datum['Voix' + a];
                contentFirstRound += "<tr><td><div class='legende " + datum['Nuance' + a] + "'></div><div>&nbsp;" + parti + "</div></td><td> " + datum['Binôme' + a] + "</td><td alagn='right'>" + datum['% Voix/Exp' + a] + "%</</td></tr>";
                var row = {};
                row.parti = parti;
                row.voix = voix;
                pieData.push(row);
                console.log('Nuance:' + datum['Nuance' + a]);
                console.log('Binôme:' + datum['Binôme' + a]);
                console.log('Voix:' + voix);
                console.log('Sièges:' + datum['Sièges' + a]);
                console.log('% Voix/Ins:' + datum['% Voix/Ins' + a]);
                console.log('% Voix/Exp:' + datum['% Voix/Exp' + a]);
              }
            }
            contentFirstRound += "</table><br/><div id=\"pieFisrtRound\"></div>";

            var contentResult = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Inscrits</th><td>" + datum['Inscrits'] + "</td></tr>" + "<tr><th>Participation</th><td>" + datum['Votants'] + " (" + datum['% Vot/Ins'] + "%) </td></tr>" + "</td></tr>" + "<tr><th>Abstention</th><td>" + datum['Abstentions'] + " (" + datum['% Abs/Ins'] + "%) </td></tr>" + "<tr><th>Exprimés</th><td>" + datum['Exprimés'] + " (" + datum['% Exp/Vot'] + "%) </td></tr>" + "<tr><th>Blancs</th><td>" + datum['Blancs'] + " (" + datum['% Blancs/Vot'] + "%) </td></tr>" + "<tr><th>Nuls</th><td>" + datum['Nuls'] + " (" + datum['% Nuls/Vot'] + "%) </td></tr>" + "<table>";

            contentFirstRound += contentResult;
          } else {
            console.log('canton non trouvé ' + ref);
          }


          $("#feature-title").html(feature.properties.nom);
          $("#feature-info").html(content);
          $("#firstRound-info").html(contentFirstRound);
          d3DD('pieFisrtRound', pieData);

          $("#featureModal").modal("show");
        }
      });

    }
  }
});
$.getJSON("data/cantons_2015_simplify.geojson", function(data) {
  cantons.addData(data);
});

map = L.map("map", {
  zoom: 6,
  center: [46.6, 2.3],
  layers: [darkGray, departements, cantons, highlight],
  //zoomControl: false,
  attributionControl: false
});

/* Layer control listeners */
map.on("overlayadd", function(e) {
  if (e.layer === cantons) {
    syncSidebar();
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === cantons) {
    syncSidebar();
  }
});

/* Filter sidebar feature list to only show features in current map bounds */
map.on("moveend", function(e) {
  syncSidebar();
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}

map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function(map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>créé by <a href='https://github.com/tsamaya'>Arnaud Ferrand</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

// var zoomControl = L.control.zoom({
// //  position: "bottomright"
// }).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "topleft",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "Ma position",
    popup: "Vous êtes à une distance de {distance} {unit}",
    outsideMapBoundsMsg: "Vous êtes en dehors de la carte"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Dark Gray": darkGray,
  "Gray": gray,
  "Topo": topo
};

var groupedOverlays = {
  "Références": {
    "<img src='assets/img/dept.png' width='29' height='28'>&nbsp;Départements": departements,
    "<img src='assets/img/canton.png' width='26' height='28'>&nbsp;Cantons": cantons
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);


/* Highlight search box text on click */
$("#searchbox").click(function() {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function(e) {
  if (e.which === 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function(e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function() {
  $("#loading").hide();
  sizeLayerControl();
  /* Fit map to departements bounds */
  map.fitBounds(departements.getBounds());

  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });

  var departementsBH = new Bloodhound({
    name: "Departements",
    datumTokenizer: function(d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: departementsSearch,
    limit: 10
  });

  var cantonsBH = new Bloodhound({
    name: "Cantons",
    datumTokenizer: function(d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: cantonsSearch,
    limit: 10
  });

  var geonamesBH = new Bloodhound({
    name: "GeoNames",
    datumTokenizer: function(d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: "http://api.geonames.org/searchJSON?username=bootleaf&featureClass=P&maxRows=5&countryCode=US&name_startsWith=%QUERY",
      filter: function(data) {
        return $.map(data.geonames, function(result) {
          return {
            name: result.name + ", " + result.adminCode1,
            lat: result.lat,
            lng: result.lng,
            source: "GeoNames"
          };
        });
      },
      ajax: {
        beforeSend: function(jqXhr, settings) {
          settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
          $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
        },
        complete: function(jqXHR, status) {
          $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
        }
      }
    },
    limit: 10
  });
  departementsBH.initialize();
  cantonsBH.initialize();
  geonamesBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "Departements",
    displayKey: "name",
    source: departementsBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/dept.png' width='29' height='28'>&nbsp;Départements</h4>",
      suggestion: Handlebars.compile(["{{name}}&nbsp;{{code}}<br><small>{{region}}</small>"].join(""))
    }
  }, {
    name: "Cantons",
    displayKey: "name",
    source: cantonsBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/canton.png' width='26' height='28'>&nbsp;Cantons</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{dep}}</small>"].join(""))
    }
  }, {
    name: "GeoNames",
    displayKey: "name",
    source: geonamesBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
    }
  }).on("typeahead:selected", function(obj, datum) {
    if (datum.source === "Departements") {
      map.fitBounds(datum.bounds);
    }
    if (datum.source === "Cantons") {
      map.fitBounds(datum.bounds);
      if (!map.hasLayer(cantons)) {
        map.addLayer(cantons);
      }
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if (datum.source === "GeoNames") {
      map.setView([datum.lat, datum.lng], 14);
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function() {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function() {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
    .disableClickPropagation(container)
    .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}
