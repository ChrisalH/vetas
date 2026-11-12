(function () {
  'use strict';

  /* ==========================================================
     Configuración
     La publishable key es pública: está pensada para ir en la página.
     Nunca pongas acá la secret key (sb_secret_...).
     ========================================================== */

  var CONFIG = {
    supabaseUrl: 'https://gffazflvzodgywnmaisp.supabase.co',
    supabaseKey: 'sb_publishable_ACoziBCbm3jgDse3zKNb2A_K18KKohB',
    maxStories: 40,
    mapStyle: 'https://tiles.openfreemap.org/styles/positron',
    zoneRadiusMeters: 300,
  };

  /* ==========================================================
     Colores
     ========================================================== */

  var PALETTE = [
    { base: '#4f2026', line: '#b5525c' },
    { base: '#23382f', line: '#64977e' },
    { base: '#24324a', line: '#6a8abd' },
    { base: '#3d2640', line: '#9c6ea5' },
  ];

  var MAP_COLORS = {
    ground: '#222322',
    river: '#2b2d2c',
    land: '#262726',
    building: '#2a2b2a',
    cream: '#c5c2bb',
    label: '#94918b',
    gold: '#c9a24b',
  };

  function randomColor(except) {
    var options = PALETTE.filter(function (color) {
      return color.base !== except;
    });
    return options[Math.floor(Math.random() * options.length)].base;
  }

  function lineColor(base) {
    var match = PALETTE.find(function (color) {
      return color.base === base;
    });
    return match ? match.line : PALETTE[0].line;
  }

  /* ==========================================================
     Historias de ejemplo (hasta conectar Supabase)
     Coordenadas aproximadas.
     ========================================================== */

  var SAMPLE_STORIES = [
    {
      id: 'verano-martes',
      title: 'El verano de los martes',
      summary: 'Un mes de bares chicos y ninguna definición.',
      song: 'Persiana americana, Soda Stereo',
      thought: 'No hizo falta ponerle nombre para que fuera real.',
      stops: [
        {
          place: 'Un bar en Palermo',
          text: 'Nos habíamos hablado una semana y me sorprendió lo fácil que fue. Nos quedamos hasta que levantaron las sillas.',
          lng: -58.4305,
          lat: -34.5884,
        },
        {
          place: 'Parque Centenario',
          text: 'Llevó mate y yo llevé el frío, porque no paraba de temblar de los nervios. No hablamos de qué éramos, ni ese día ni nunca. Volví caminando treinta cuadras porque no quería que se terminara el día.',
          lng: -58.436,
          lat: -34.6065,
        },
        {
          place: 'Una librería en Almagro',
          text: 'Cada uno eligió un libro para el otro. Todavía tengo el mío y no lo terminé.',
          lng: -58.4195,
          lat: -34.604,
        },
        {
          place: 'Costanera',
          text: 'Fue la última, aunque ninguno lo dijo. Nos sentamos a ver los aviones.',
          lng: -58.409,
          lat: -34.56,
        },
      ],
    },
    {
      id: 'casi-novios',
      title: 'Casi novios en Almagro',
      summary: 'Caminatas largas y una despedida en el 60.',
      song: 'Tu misterioso alguien, Miranda!',
      thought: 'Aprendí que algo puede ser corto y entero.',
      stops: [
        {
          place: 'Una pizzería en Almagro',
          text: 'Comimos parados y hablamos de todo menos de nosotros.',
          lng: -58.421,
          lat: -34.6035,
        },
        {
          place: 'Caminata por Boedo',
          text: 'Caminamos sin rumbo hasta que se hizo de noche.',
          lng: -58.416,
          lat: -34.63,
        },
        {
          place: 'Un cine en Caballito',
          text: 'No me acuerdo de la película.',
          lng: -58.4395,
          lat: -34.6185,
        },
        {
          place: 'La parada del 60',
          text: 'Nos despedimos sin decir que era una despedida.',
          lng: -58.41,
          lat: -34.598,
        },
      ],
    },
    {
      id: 'tres-cafes',
      title: 'Tres cafés y chau',
      summary: 'Duró poco y todavía me acuerdo de cómo se reía.',
      song: 'Fue amor, Fito Páez',
      thought: 'Hay gente que pasa poco tiempo y se queda mucho.',
      stops: [
        {
          place: 'Un café en Colegiales',
          text: 'Llegué antes y cambié de mesa dos veces.',
          lng: -58.449,
          lat: -34.5745,
        },
        {
          place: 'Otro café en Belgrano',
          text: 'Se rió tanto que el mozo se acercó a preguntar.',
          lng: -58.458,
          lat: -34.561,
        },
        {
          place: 'El último café',
          text: 'No hubo drama. Un abrazo largo y cada uno para su lado.',
          lng: -58.464,
          lat: -34.547,
        },
      ],
    },
  ];

  /* ==========================================================
     Datos: Supabase
     Si Supabase no está configurado, se usan las historias de ejemplo.
     ========================================================== */

  var stories = [];
  var storiesStatus = 'loading'; // loading | ready | error

  var db = null;
  if (CONFIG.supabaseUrl && CONFIG.supabaseKey && window.supabase) {
    db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  function summarize(text) {
    return text.length > 90 ? text.slice(0, 90).trim() + '…' : text;
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function fromRow(row) {
    var stops = (row.stops || [])
      .slice()
      .sort(function (a, b) {
        return a.position - b.position;
      })
      .map(function (stop) {
        return { place: stop.place, text: stop.body, lat: stop.lat, lng: stop.lng };
      });
    return {
      id: row.id,
      title: row.title,
      summary: stops.length ? summarize(stops[0].text) : '',
      song: row.song,
      thought: row.thought,
      color: PALETTE.some(function (c) { return c.base === row.color; }) ? row.color : randomColor(),
      stops: stops,
    };
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('Tiempo de espera agotado'));
        }, ms);
      }),
    ]);
  }

  // Trae las últimas historias visibles y las mezcla, para que cada visita sea distinta.
  function loadStories() {
    storiesStatus = 'loading';

    if (!db) {
      stories = SAMPLE_STORIES.map(function (story) {
        return Object.assign({}, story, { color: randomColor() });
      });
      storiesStatus = 'ready';
      return Promise.resolve();
    }

    var query = db
      .from('stories')
      .select('id, title, color, song, thought, created_at, stops (position, place, body, lat, lng)')
      .order('created_at', { ascending: false })
      .limit(CONFIG.maxStories);

    return withTimeout(query, 12000)
      .then(function (result) {
        if (result.error) throw result.error;
        stories = shuffle(
          result.data.map(fromRow).filter(function (story) {
            return story.stops.length > 0;
          }),
        );
        storiesStatus = 'ready';
      })
      .catch(function (error) {
        console.warn('No se pudieron cargar las historias.', error);
        stories = [];
        storiesStatus = 'error';
      });
  }

  // Publica con la función publish_story, que valida y guarda todo junto.
  function publishStory(draftStory) {
    var story = {
      id: 'local-' + Date.now(),
      title: draftStory.title,
      summary: summarize(draftStory.stops[0].text),
      song: draftStory.song,
      thought: draftStory.thought,
      color: draftStory.color,
      stops: draftStory.stops.map(function (stop) {
        return { place: stop.place, text: stop.text, lng: stop.lng, lat: stop.lat };
      }),
    };

    if (!db) return Promise.resolve(story);

    var request = db.rpc('publish_story', {
      p_title: story.title,
      p_color: story.color,
      p_song: story.song,
      p_thought: story.thought,
      p_stops: story.stops,
    });

    return withTimeout(request, 15000).then(function (result) {
      if (result.error) throw result.error;
      story.id = result.data;
      return story;
    });
  }

  function findStory(id) {
    return (
      stories.find(function (story) {
        return story.id === id;
      }) || null
    );
  }

  /* ==========================================================
     Ayudas para armar el HTML
     Todo el texto entra con textContent, así nadie puede inyectar código.
     ========================================================== */

  function h(tag, attributes) {
    var element = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);

    Object.keys(attributes || {}).forEach(function (name) {
      var value = attributes[name];
      if (name.indexOf('on') === 0 && typeof value === 'function') {
        element.addEventListener(name.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(name, value);
      }
    });

    children.forEach(function (child) {
      element.append(child);
    });
    return element;
  }

  function vaseIcon() {
    var template = document.createElement('template');
    template.innerHTML =
      '<svg width="28" height="38" viewBox="0 0 24 33" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="12" cy="3" rx="5.3" ry="1.1"></ellipse>' +
      '<path d="M6.7 3.3C7.4 5.4 8.7 7.2 8.7 9C8.7 12 7.6 13.2 6.1 14.2C4.2 15.2 3 17.2 3 19.8C3 23.4 5 26.6 7.8 28.6C10 29.6 14 29.6 16.2 28.6C19 26.6 21 23.4 21 19.8C21 17.2 19.8 15.2 17.9 14.2C16.4 13.2 15.3 12 15.3 9C15.3 7.2 16.6 5.4 17.3 3.3"></path>' +
      '<path d="M7.8 28.6V30.4C10 32 14 32 16.2 30.4V28.6"></path>' +
      '</svg>';
    return template.content.firstElementChild;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ==========================================================
     Mapa
     Uno solo para toda la app, fijo detrás de las pantallas.
     ========================================================== */

  var EMPTY = { type: 'FeatureCollection', features: [] };

  var MapView = (function () {
    var map = null;
    var ready = Promise.resolve(false);
    var lastFocus = null;
    var interactive = false;
    var storiesVisible = true;

    function init(container) {
      if (!window.maplibregl) {
        console.warn('No se pudo cargar MapLibre.');
        return ready;
      }

      try {
        map = new maplibregl.Map({
          container: container,
          style: CONFIG.mapStyle,
          center: [-58.437, -34.6075],
          zoom: 12.2,
          minZoom: 10,
          maxZoom: 17,
          maxBounds: [
            [-59.2, -35.1],
            [-57.85, -34.2],
          ],
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });
      } catch (error) {
        console.warn('No se pudo iniciar el mapa.', error);
        map = null;
        return ready;
      }

      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');
      setInteractive(interactive);

      ready = new Promise(function (resolve) {
        map.once('load', function () {
          applyPalette();
          addStoryLayers();
          resolve(true);
        });
        map.once('error', function (event) {
          if (!map.isStyleLoaded()) {
            console.warn('No se pudo cargar el mapa.', event.error);
            resolve(false);
          }
        });
      });
      return ready;
    }

    function setPaint(id, property, value) {
      try {
        map.setPaintProperty(id, property, value);
      } catch (error) {
        // La capa no tiene esa propiedad.
      }
    }

    function hide(id) {
      map.setLayoutProperty(id, 'visibility', 'none');
    }

    // Recolorea el mapa base con la paleta de Vetas.
    function applyPalette() {
      map.getStyle().layers.forEach(function (layer) {
        var id = layer.id;
        var type = layer.type;

        if (type === 'background') {
          setPaint(id, 'background-color', MAP_COLORS.ground);
        } else if (type === 'fill') {
          if (id === 'water') {
            setPaint(id, 'fill-color', MAP_COLORS.river);
          } else if (id === 'building' || id.indexOf('aeroway') === 0 || id.indexOf('road_area') === 0) {
            setPaint(id, 'fill-color', MAP_COLORS.building);
            setPaint(id, 'fill-opacity', 0.6);
          } else {
            setPaint(id, 'fill-color', MAP_COLORS.land);
            setPaint(id, 'fill-opacity', 0.7);
          }
        } else if (type === 'line') {
          if (id.indexOf('casing') !== -1 || id.indexOf('dashline') !== -1 || id.indexOf('boundary') === 0) {
            hide(id);
          } else if (id === 'waterway') {
            setPaint(id, 'line-color', MAP_COLORS.river);
          } else {
            var opacity = 0.08;
            if (id.indexOf('motorway') !== -1) opacity = 0.3;
            else if (id.indexOf('major') !== -1) opacity = 0.26;
            else if (id.indexOf('minor') !== -1 || id.indexOf('pier') !== -1) opacity = 0.14;
            else if (id.indexOf('railway') !== -1) opacity = 0.1;
            setPaint(id, 'line-color', MAP_COLORS.cream);
            setPaint(id, 'line-opacity', opacity);
          }
        } else if (type === 'symbol') {
          if (id.indexOf('shield') !== -1 || id === 'airport') {
            hide(id);
          } else {
            setPaint(id, 'text-color', MAP_COLORS.label);
            setPaint(id, 'text-halo-color', MAP_COLORS.ground);
            setPaint(id, 'text-halo-width', 1.2);
          }
        } else if (type === 'fill-extrusion') {
          hide(id);
        }
      });
    }

    function addStoryLayers() {
      ['routes', 'zones', 'focus-zones', 'draft-zones', 'draft-route', 'draft-line'].forEach(function (name) {
        map.addSource(name, { type: 'geojson', data: EMPTY });
      });
      // lineMetrics permite pintar el camino de oro de punta a punta.
      map.addSource('focus-route', { type: 'geojson', data: EMPTY, lineMetrics: true });

      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: { 'fill-color': MAP_COLORS.gold, 'fill-opacity': 0.06 },
      });
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: { 'line-color': MAP_COLORS.gold, 'line-opacity': 0.3, 'line-width': 1 },
      });
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': MAP_COLORS.gold, 'line-opacity': 0.35, 'line-width': 1.5 },
      });
      // Línea invisible y ancha, para que los caminos finos sean fáciles de tocar.
      map.addLayer({
        id: 'routes-hit',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 24 },
      });
      map.addLayer({
        id: 'focus-zones-fill',
        type: 'fill',
        source: 'focus-zones',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: 'focus-zones-outline',
        type: 'line',
        source: 'focus-zones',
        paint: { 'line-color': ['get', 'color'], 'line-width': 1.5 },
      });
      map.addLayer({
        id: 'focus-route-line',
        type: 'line',
        source: 'focus-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-gradient': MAP_COLORS.gold, 'line-width': 4 },
      });

      // Borrador de la historia que se está contando.
      map.addLayer({
        id: 'draft-zones-fill',
        type: 'fill',
        source: 'draft-zones',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: 'draft-zones-outline',
        type: 'line',
        source: 'draft-zones',
        paint: { 'line-color': ['get', 'color'], 'line-width': 1.5 },
      });
      map.addLayer({
        id: 'draft-route-line',
        type: 'line',
        source: 'draft-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 3 },
      });
      map.addLayer({
        id: 'draft-line-dashed',
        type: 'line',
        source: 'draft-line',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': MAP_COLORS.cream, 'line-width': 2, 'line-dasharray': [2, 2.5] },
      });

      applyStoriesVisibility();
    }

    // Círculo de radio fijo en metros, para que el zoom nunca dé más precisión.
    function zone(lng, lat, properties) {
      var steps = 48;
      var radius = CONFIG.zoneRadiusMeters;
      var dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
      var dLat = radius / 110540;
      var ring = [];
      for (var i = 0; i <= steps; i++) {
        var angle = (i / steps) * Math.PI * 2;
        ring.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
      }
      return {
        type: 'Feature',
        properties: properties || {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    }

    function route(stops, properties) {
      return {
        type: 'Feature',
        properties: properties || {},
        geometry: {
          type: 'LineString',
          coordinates: stops.map(function (stop) {
            return [stop.lng, stop.lat];
          }),
        },
      };
    }

    function collection(features) {
      return { type: 'FeatureCollection', features: features };
    }

    function showStories(list) {
      return ready.then(function (ok) {
        if (!ok) return;
        map.getSource('routes').setData(
          collection(
            list
              .filter(function (story) {
                return story.stops.length > 1;
              })
              .map(function (story) {
                return route(story.stops, { id: story.id });
              }),
          ),
        );
        var zones = [];
        list.forEach(function (story) {
          story.stops.forEach(function (stop) {
            zones.push(zone(stop.lng, stop.lat, { id: story.id }));
          });
        });
        map.getSource('zones').setData(collection(zones));
      });
    }

    function applyStoriesVisibility() {
      if (!map || !map.getLayer('routes-line')) return;
      ['zones-fill', 'zones-outline', 'routes-line', 'routes-hit'].forEach(function (id) {
        map.setLayoutProperty(id, 'visibility', storiesVisible ? 'visible' : 'none');
      });
    }

    function setStoriesVisible(visible) {
      storiesVisible = visible;
      applyStoriesVisibility();
    }

    // Destaca una historia y mueve la cámara para que entre en el área visible.
    function focusStory(story, options) {
      options = options || {};
      var upTo = options.upTo || story.stops.length;
      lastFocus = { story: story, upTo: upTo, padding: options.padding };

      return ready.then(function (ok) {
        if (!ok || !lastFocus || lastFocus.story !== story) return;

        var color = lineColor(story.color);
        var shown = story.stops.slice(0, Math.max(1, upTo));

        stopGold();
        setRouteGradient(color, color, 0);
        map.getSource('focus-route').setData(
          collection(shown.length > 1 ? [route(shown, { color: color, id: story.id })] : []),
        );
        map.getSource('focus-zones').setData(
          collection(
            shown.map(function (stop) {
              return zone(stop.lng, stop.lat, { color: color, id: story.id });
            }),
          ),
        );

        frame(story.stops, options.padding, options.animate);
      });
    }

    // Encuadra las zonas completas, no solo sus centros.
    function frame(stops, padding, animate) {
      var bounds = new maplibregl.LngLatBounds();
      stops.forEach(function (stop) {
        var dLng = CONFIG.zoneRadiusMeters / (111320 * Math.cos((stop.lat * Math.PI) / 180));
        var dLat = CONFIG.zoneRadiusMeters / 110540;
        bounds.extend([stop.lng - dLng, stop.lat - dLat]);
        bounds.extend([stop.lng + dLng, stop.lat + dLat]);
      });
      map.fitBounds(bounds, {
        padding: padding || 60,
        maxZoom: 14.5,
        duration: animate === false || prefersReducedMotion() ? 0 : 900,
      });
    }

    function frameStops(stops, padding) {
      return ready.then(function (ok) {
        if (ok && stops.length) frame(stops, padding, true);
      });
    }

    var goldFrame = null;

    function stopGold() {
      if (goldFrame) cancelAnimationFrame(goldFrame);
      goldFrame = null;
    }

    // Pinta el camino con oro hasta "progress" (0 a 1) y con su color el resto.
    function setRouteGradient(gold, rest, progress) {
      var p = Math.max(0.0001, Math.min(0.9998, progress));
      map.setPaintProperty('focus-route-line', 'line-gradient', [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        gold,
        p,
        gold,
        p + 0.0001,
        rest,
        1,
        rest,
      ]);
    }

    // El camino entero se vuelve dorado, de la primera parada a la última.
    function goldStory(story) {
      return ready.then(function (ok) {
        if (!ok || !lastFocus || lastFocus.story !== story) return;

        stopGold();
        var color = lineColor(story.color);
        var duration = prefersReducedMotion() ? 0 : 2200;
        var start = performance.now();

        function paintZones() {
          map.getSource('focus-zones').setData(
            collection(
              story.stops.map(function (stop) {
                return zone(stop.lng, stop.lat, { color: MAP_COLORS.gold, id: story.id });
              }),
            ),
          );
        }

        function step(now) {
          var progress = duration ? Math.min(1, (now - start) / duration) : 1;
          var eased = 1 - Math.pow(1 - progress, 3);
          setRouteGradient(MAP_COLORS.gold, color, eased);
          if (progress < 1) {
            goldFrame = requestAnimationFrame(step);
          } else {
            goldFrame = null;
            setRouteGradient(MAP_COLORS.gold, MAP_COLORS.gold, 1);
            paintZones();
          }
        }

        if (story.stops.length < 2) {
          paintZones();
          return;
        }
        goldFrame = requestAnimationFrame(step);
      });
    }

    function clearFocus() {
      lastFocus = null;
      stopGold();
      return ready.then(function (ok) {
        if (!ok) return;
        map.getSource('focus-route').setData(EMPTY);
        map.getSource('focus-zones').setData(EMPTY);
      });
    }

    function setInteractive(enabled) {
      interactive = enabled;
      if (!map) return;
      [map.dragPan, map.scrollZoom, map.doubleClickZoom, map.touchZoomRotate, map.keyboard].forEach(
        function (handler) {
          if (enabled) handler.enable();
          else handler.disable();
        },
      );
      if (enabled) map.touchZoomRotate.disableRotation();
    }

    // Vista general de la ciudad, sin ninguna historia destacada.
    function overview(animate) {
      lastFocus = null;
      return ready.then(function (ok) {
        if (!ok) return;
        map.easeTo({
          center: [-58.437, -34.6075],
          zoom: 12.4,
          duration: animate === false || prefersReducedMotion() ? 0 : 900,
        });
      });
    }

    /* ---------- Borrador al contar una historia ---------- */

    var DEFAULT_CENTER = { lng: -58.437, lat: -34.6075 };

    function getCenter() {
      if (!map) return DEFAULT_CENTER;
      var center = map.getCenter();
      return { lng: center.lng, lat: center.lat };
    }

    // Cuántos píxeles mide en pantalla una distancia en metros, en el centro del mapa.
    function metersToPixels(meters) {
      if (!map) return 30;
      var lat = map.getCenter().lat;
      var metersPerPixel = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * Math.pow(2, map.getZoom()));
      return meters / metersPerPixel;
    }

    function onMove(callback) {
      if (!map) return function () {};
      map.on('move', callback);
      return function () {
        map.off('move', callback);
      };
    }

    // Centra un punto; offsetY lo sube para que quede visible encima de una hoja.
    function centerOn(point, offsetY) {
      return ready.then(function (ok) {
        if (!ok) return;
        map.easeTo({
          center: [point.lng, point.lat],
          offset: [0, offsetY || 0],
          zoom: Math.max(map.getZoom(), 13.5),
          duration: prefersReducedMotion() ? 0 : 700,
        });
      });
    }

    function setDraft(stops, color) {
      return ready.then(function (ok) {
        if (!ok) return;
        var line = lineColor(color);
        map.getSource('draft-zones').setData(
          collection(
            stops.map(function (stop) {
              return zone(stop.lng, stop.lat, { color: line });
            }),
          ),
        );
        map.getSource('draft-route').setData(
          collection(stops.length > 1 ? [route(stops, { color: line })] : []),
        );
      });
    }

    // Línea punteada desde la última zona hasta el centro, mientras se arrastra el mapa.
    function setDraftLine(from) {
      if (!map || !map.getSource('draft-line')) return;
      if (!from) {
        map.getSource('draft-line').setData(EMPTY);
        return;
      }
      map.getSource('draft-line').setData(collection([route([from, getCenter()])]));
    }

    function clearDraft() {
      return ready.then(function (ok) {
        if (!ok) return;
        ['draft-zones', 'draft-route', 'draft-line'].forEach(function (name) {
          map.getSource(name).setData(EMPTY);
        });
      });
    }

    /* ---------- Tocar un camino en el mapa ---------- */

    var TAP_LAYERS = ['focus-route-line', 'focus-zones-fill', 'routes-hit', 'zones-fill'];

    // Busca la historia que está bajo el dedo, con un margen para que sea fácil acertar.
    function storyAt(point) {
      if (!map || !map.getLayer('routes-hit')) return null;
      var margin = 12;
      var layers = TAP_LAYERS.filter(function (id) {
        return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
      });
      var features = map.queryRenderedFeatures(
        [
          [point.x - margin, point.y - margin],
          [point.x + margin, point.y + margin],
        ],
        { layers: layers },
      );
      for (var i = 0; i < features.length; i++) {
        if (features[i].properties && features[i].properties.id) return features[i].properties.id;
      }
      return null;
    }

    function onStoryTap(callback) {
      if (!map) return function () {};

      function handleClick(event) {
        var id = storyAt(event.point);
        if (id) callback(id);
      }

      function handleHover(event) {
        map.getCanvas().style.cursor = storyAt(event.point) ? 'pointer' : '';
      }

      map.on('click', handleClick);
      map.on('mousemove', handleHover);
      return function () {
        map.off('click', handleClick);
        map.off('mousemove', handleHover);
        map.getCanvas().style.cursor = '';
      };
    }

    // Indica si un punto de la pantalla cae sobre el río.
    function isWater(x, y) {
      if (!map || !map.isStyleLoaded() || !map.getLayer('water')) return false;
      return map.queryRenderedFeatures([x, y], { layers: ['water'] }).length > 0;
    }

    function refocus() {
      if (lastFocus) {
        focusStory(lastFocus.story, {
          upTo: lastFocus.upTo,
          padding: lastFocus.padding,
          animate: false,
        });
      }
    }

    return {
      init: init,
      showStories: showStories,
      setStoriesVisible: setStoriesVisible,
      focusStory: focusStory,
      goldStory: goldStory,
      clearFocus: clearFocus,
      setInteractive: setInteractive,
      overview: overview,
      getCenter: getCenter,
      metersToPixels: metersToPixels,
      onMove: onMove,
      centerOn: centerOn,
      frameStops: frameStops,
      setDraft: setDraft,
      setDraftLine: setDraftLine,
      clearDraft: clearDraft,
      onStoryTap: onStoryTap,
      isWater: isWater,
      refocus: refocus,
    };
  })();

  /* ==========================================================
     Pantalla: bienvenida
     ========================================================== */

  function mountWelcome(root) {
    MapView.setInteractive(false);
    MapView.setStoriesVisible(false);
    MapView.clearFocus();
    MapView.overview(false);

    var drawing = document.createElementNS(SVG_NS, 'svg');
    drawing.setAttribute('class', 'welcome__drawing');
    drawing.setAttribute('aria-hidden', 'true');

    root.append(
      h(
        'section',
        { class: 'screen welcome' },
        h('div', { class: 'welcome__backdrop' }, drawing, h('div', { class: 'welcome__veil' })),
        h(
          'div',
          { class: 'welcome__content' },
          h('h1', { class: 'brand' }, 'Vetas'),
          h(
            'p',
            {},
            'Este es un lugar para reivindicar las mini historias de amor, ver qué camino generan en la ciudad de Buenos Aires y, de la misma manera, ver qué camino queda en nosotros.',
          ),
          h(
            'p',
            {},
            '¿Significa que son una historia hermosa? No. ¿Sin dolor? No. Pero es una historia, en fin.',
          ),
          h(
            'p',
            {},
            'Como un jarrón, vamos llevando nuestros caminos encima. Apretá el jarroncito y contá tu historia.',
          ),
          h('a', { class: 'button', href: '#/mapa' }, 'Entrar'),
        ),
      ),
    );

    var stopAnimation = animateWelcomeRoutes(drawing);

    return function () {
      stopAnimation();
      MapView.setStoriesVisible(true);
    };
  }

  /* ----------------------------------------------------------
     Caminos al azar que se van uniendo detrás de la bienvenida
     ---------------------------------------------------------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DRAW_SPEED = 85; // píxeles por segundo
  var HOLD_SECONDS = 3;
  var FADE_SECONDS = 1.5;
  var ROUTE_COUNT = 5;

  function animateWelcomeRoutes(svg) {
    var size = { w: 390, h: 844 };
    var still = prefersReducedMotion();
    var frame = null;

    function measure() {
      var box = svg.getBoundingClientRect();
      size = { w: box.width || size.w, h: box.height || size.h };
      svg.setAttribute('viewBox', '0 0 ' + size.w + ' ' + size.h);
    }

    function randomPoint(from) {
      for (var i = 0; i < 40; i++) {
        var x;
        var y;
        if (from) {
          var angle = Math.random() * Math.PI * 2;
          var step = 60 + Math.random() * 90;
          x = from[0] + Math.cos(angle) * step;
          y = from[1] + Math.sin(angle) * step;
        } else {
          x = 24 + Math.random() * (size.w - 48);
          y = 40 + Math.random() * (size.h - 80);
        }
        var inside = x > 16 && x < size.w - 16 && y > 24 && y < size.h - 24;
        if (inside && !MapView.isWater(x, y)) return [x, y];
      }
      return from || [size.w / 2, size.h / 2];
    }

    function createRoute(slot, startAt) {
      var points = [randomPoint(null)];
      var total = 3 + Math.floor(Math.random() * 4);
      while (points.length < total) points.push(randomPoint(points[points.length - 1]));

      var length = 0;
      for (var i = 1; i < points.length; i++) {
        length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      }

      var color = PALETTE[Math.floor(Math.random() * PALETTE.length)].line;
      slot.group.setAttribute('stroke', color);
      slot.dots.setAttribute('fill', color);
      slot.points = points;
      slot.length = length;
      slot.startAt = startAt;
    }

    function render(slot, now) {
      var t = (now - slot.startAt) / 1000;
      if (t < 0) {
        slot.group.setAttribute('opacity', '0');
        return;
      }

      var drawEnd = slot.length / DRAW_SPEED;
      if (!still && t > drawEnd + HOLD_SECONDS + FADE_SECONDS) {
        createRoute(slot, now + Math.random() * 1500);
        slot.group.setAttribute('opacity', '0');
        return;
      }

      var remaining = still ? slot.length : Math.min(slot.length, t * DRAW_SPEED);
      var first = slot.points[0];
      var line = 'M' + first[0].toFixed(1) + ' ' + first[1].toFixed(1);
      var reached = [first];

      for (var i = 1; i < slot.points.length && remaining > 0; i++) {
        var a = slot.points[i - 1];
        var b = slot.points[i];
        var segment = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var part = Math.min(1, remaining / segment);
        line += ' L' + (a[0] + (b[0] - a[0]) * part).toFixed(1) + ' ' + (a[1] + (b[1] - a[1]) * part).toFixed(1);
        if (part === 1) reached.push(b);
        remaining -= segment;
      }

      var dots = reached
        .map(function (p) {
          return 'M' + (p[0] - 9).toFixed(1) + ' ' + p[1].toFixed(1) + ' a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0';
        })
        .join(' ');

      var fade = still ? 1 : 1 - (t - drawEnd - HOLD_SECONDS) / FADE_SECONDS;
      slot.line.setAttribute('d', line);
      slot.dots.setAttribute('d', dots);
      slot.group.setAttribute('opacity', String(Math.max(0, Math.min(1, fade))));
    }

    measure();

    var now = performance.now();
    var slots = [];
    for (var i = 0; i < ROUTE_COUNT; i++) {
      var group = document.createElementNS(SVG_NS, 'g');
      var linePath = document.createElementNS(SVG_NS, 'path');
      var dotsPath = document.createElementNS(SVG_NS, 'path');
      group.setAttribute('fill', 'none');
      group.setAttribute('stroke-width', '2');
      group.setAttribute('stroke-linecap', 'round');
      group.setAttribute('stroke-linejoin', 'round');
      dotsPath.setAttribute('fill-opacity', '0.3');
      dotsPath.setAttribute('stroke-width', '1.2');
      group.append(linePath, dotsPath);
      svg.append(group);

      var slot = { group: group, line: linePath, dots: dotsPath };
      createRoute(slot, still ? now - 60000 : now + i * 1700);
      slots.push(slot);
    }

    function tick(time) {
      slots.forEach(function (slot) {
        render(slot, time);
      });
      if (!still) frame = requestAnimationFrame(tick);
    }

    tick(performance.now());
    window.addEventListener('resize', measure);

    return function stop() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }

  /* ==========================================================
     Pantalla: inicio con el mapa
     ========================================================== */

  // Cada visita arranca en una historia distinta.
  var currentIndex = Math.floor(Math.random() * stories.length);

  function outingsLabel(count) {
    return count === 1 ? '1 salida' : count + ' salidas';
  }

  function homeHeader() {
    return [
      h('a', { class: 'brand home-brand', href: '#/', 'aria-label': 'Volver a la bienvenida' }, 'Vetas'),
      h('a', { class: 'vase-button', href: '#/contar', 'aria-label': 'Contar tu historia' }, vaseIcon()),
    ];
  }

  // Tarjeta sola para cuando no hay historias que mostrar.
  function mountMessageHome(root, titleText, summaryText, action) {
    MapView.overview(true);
    var header = homeHeader();
    var body = [
      h('span', { class: 'story-card__title' }, titleText),
      h('span', { class: 'story-card__summary' }, summaryText),
    ];
    var content = action
      ? h('div', { class: 'story-card__link' }, body[0], body[1], action)
      : h('a', { class: 'story-card__link', href: '#/contar' }, body[0], body[1]);
    var screen = h(
      'section',
      { class: 'screen' },
      header[0],
      header[1],
      h('article', { class: 'story-card story-card--empty' }, content),
    );
    screen.style.setProperty('--story-color', PALETTE[0].base);
    root.append(screen);
  }

  function mountHome(root) {
    MapView.setInteractive(true);
    MapView.setStoriesVisible(true);

    if (storiesStatus === 'loading') {
      mountMessageHome(root, 'Cargando historias…', 'Un momento.');
      return;
    }
    if (storiesStatus === 'error') {
      mountMessageHome(
        root,
        'No pudimos cargar las historias',
        'Revisá tu conexión y probá de nuevo.',
        h(
          'button',
          {
            class: 'button story-card__retry',
            type: 'button',
            onClick: function () {
              loadStories().then(afterLoad);
              navigate();
            },
          },
          'Reintentar',
        ),
      );
      return;
    }
    if (stories.length === 0) {
      mountMessageHome(root, 'Todavía no hay historias', 'Apretá el jarroncito y contá la primera.');
      return;
    }
    currentIndex = currentIndex % stories.length;

    var title = h('span', { class: 'story-card__title' });
    var count = h('span', { class: 'story-card__count' });
    var summary = h('span', { class: 'story-card__summary' });
    var link = h(
      'a',
      { class: 'story-card__link', draggable: 'false' },
      h('span', { class: 'story-card__heading' }, title, count),
      summary,
    );

    var card = h(
      'article',
      { class: 'story-card' },
      link,
      h('p', { class: 'story-card__hint' }, 'Deslizá o tocá un camino'),
      h(
        'div',
        { class: 'story-card__arrows' },
        h(
          'button',
          {
            class: 'icon-button',
            type: 'button',
            'aria-label': 'Historia anterior',
            onClick: function () {
              move(-1);
            },
          },
          '←',
        ),
        h(
          'button',
          {
            class: 'icon-button',
            type: 'button',
            'aria-label': 'Historia siguiente',
            onClick: function () {
              move(1);
            },
          },
          '→',
        ),
      ),
    );

    var header = homeHeader();
    var screen = h('section', { class: 'screen' }, header[0], header[1], card);

    function show(animate) {
      var story = stories[currentIndex];
      title.textContent = story.title;
      count.textContent = outingsLabel(story.stops.length);
      summary.textContent = story.summary;
      link.href = '#/historia/' + encodeURIComponent(story.id);
      screen.style.setProperty('--story-color', story.color);
      MapView.focusStory(story, {
        animate: animate,
        padding: { top: 110, bottom: card.offsetHeight + 70, left: 48, right: 48 },
      });
    }

    function move(step) {
      var previous = stories[currentIndex].color;
      currentIndex = (currentIndex + step + stories.length) % stories.length;
      stories[currentIndex].color = randomColor(previous);
      show(true);
    }

    // Deslizar la tarjeta para cambiar de historia, sin abrirla por accidente.
    var start = null;
    var swiped = false;
    card.addEventListener('pointerdown', function (event) {
      start = { x: event.clientX, y: event.clientY };
      swiped = false;
    });
    card.addEventListener('pointercancel', function () {
      start = null;
    });
    card.addEventListener('pointerup', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x;
      var dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        move(dx < 0 ? 1 : -1);
      }
    });
    link.addEventListener('click', function (event) {
      if (swiped) {
        event.preventDefault();
        swiped = false;
      }
    });

    // Tocar un camino en el mapa: la primera vez lo elige, la segunda lo abre.
    var stopTap = MapView.onStoryTap(function (id) {
      var current = stories[currentIndex];
      if (current && current.id === id) {
        location.hash = '#/historia/' + encodeURIComponent(id);
        return;
      }
      var index = stories.findIndex(function (story) {
        return story.id === id;
      });
      if (index === -1) return;
      var previous = current ? current.color : null;
      currentIndex = index;
      stories[currentIndex].color = randomColor(previous);
      show(true);
    });

    root.append(screen);
    show(false);

    return function () {
      stopTap();
    };
  }

  /* ==========================================================
     Pantalla: historia (el paso entre salidas llega en la etapa 4)
     ========================================================== */

  function mountStory(root, params, from) {
    // Si alguien entra con el link directo, espera a que carguen las historias.
    if (storiesStatus === 'loading') {
      MapView.setInteractive(false);
      root.append(
        h('section', { class: 'screen' }, h('div', { class: 'sheet sheet--compose sheet--short' }, h('p', { class: 'note' }, 'Cargando la historia…'))),
      );
      return null;
    }

    var story = findStory(params.id);

    if (!story) {
      location.hash = '#/mapa';
      return null;
    }

    MapView.setInteractive(false);
    MapView.setStoriesVisible(false);

    // Una pantalla por salida y una última para lo que se lleva.
    var total = story.stops.length + 1;
    var step = 0;

    var bars = h('div', { class: 'progress', 'aria-hidden': 'true' });
    for (var i = 0; i < total; i++) {
      bars.append(h('span', { class: i === total - 1 ? 'progress__bar progress__bar--gold' : 'progress__bar' }));
    }

    var body = h('div', { class: 'sheet__body', 'aria-live': 'polite' });
    var backButton = h(
      'button',
      { class: 'icon-button', type: 'button', 'aria-label': 'Salida anterior', onClick: function () { go(-1); } },
      '←',
    );
    var nextButton = h('button', { class: 'text-button', type: 'button', onClick: function () { go(1); } });

    var sheet = h(
      'div',
      { class: from === 'home' ? 'sheet sheet--story sheet--grow' : 'sheet sheet--story' },
      bars,
      h(
        'div',
        { class: 'sheet__top' },
        h('span', {}, story.title),
        h('a', { class: 'icon-button', href: '#/mapa', 'aria-label': 'Cerrar historia' }, '×'),
      ),
      body,
      h('div', { class: 'sheet__footer' }, backButton, nextButton),
    );

    var screen = h('section', { class: 'screen' }, sheet);
    screen.style.setProperty('--story-color', story.color);

    function outingScreen(stop, index) {
      return [
        h('p', { class: 'note' }, 'Salida ' + (index + 1) + ' de ' + story.stops.length),
        h('h1', { class: 'sheet__title' }, stop.place),
        h('p', { class: 'sheet__text' }, stop.text),
      ];
    }

    function closingScreen() {
      return [
        h('h1', { class: 'sheet__title' }, 'Lo que me llevo'),
        h(
          'div',
          { class: 'keepsake' },
          h('span', { class: 'note' }, 'Una canción'),
          h('span', { class: 'keepsake__song' }, story.song),
        ),
        h(
          'div',
          { class: 'keepsake' },
          h('span', { class: 'note' }, 'Un pensamiento'),
          h('span', { class: 'keepsake__thought' }, story.thought),
        ),
      ];
    }

    // La hoja ocupa el 60% de abajo; el camino tiene que entrar en el 40% de arriba.
    function padding() {
      return { top: 70, bottom: root.clientHeight * 0.6 + 40, left: 48, right: 48 };
    }

    function render() {
      var closing = step === total - 1;
      Array.prototype.forEach.call(bars.children, function (bar, index) {
        bar.classList.toggle('is-done', index <= step);
      });

      body.replaceChildren.apply(
        body,
        closing ? closingScreen() : outingScreen(story.stops[step], step),
      );
      body.scrollTop = 0;
      body.classList.remove('is-changing');
      void body.offsetWidth;
      body.classList.add('is-changing');

      backButton.style.visibility = step === 0 ? 'hidden' : 'visible';
      nextButton.textContent = closing ? 'Ver otra historia' : 'Tocá para seguir';

      if (closing) {
        MapView.focusStory(story, { padding: padding() }).then(function () {
          MapView.goldStory(story);
        });
      } else {
        MapView.focusStory(story, { upTo: step + 1, padding: padding() });
      }
    }

    function anotherStory() {
      var others = stories.filter(function (other) {
        return other.id !== story.id;
      });
      if (others.length === 0) {
        location.hash = '#/mapa';
        return;
      }
      var next = others[Math.floor(Math.random() * others.length)];
      next.color = randomColor(story.color);
      currentIndex = stories.indexOf(next);
      location.hash = '#/historia/' + encodeURIComponent(next.id);
    }

    function go(direction) {
      if (direction > 0 && step === total - 1) {
        anotherStory();
        return;
      }
      var target = Math.max(0, Math.min(total - 1, step + direction));
      if (target === step) return;
      step = target;
      render();
    }

    // Tocar el texto avanza; tocar el borde izquierdo vuelve.
    // Si la persona estaba desplazando el texto, no cuenta como toque.
    var touchStart = null;
    body.addEventListener('pointerdown', function (event) {
      touchStart = { x: event.clientX, y: event.clientY, scroll: body.scrollTop };
    });
    body.addEventListener('pointerup', function (event) {
      if (!touchStart) return;
      var moved =
        Math.abs(event.clientX - touchStart.x) > 10 ||
        Math.abs(event.clientY - touchStart.y) > 10 ||
        body.scrollTop !== touchStart.scroll;
      touchStart = null;
      if (moved) return;
      var box = sheet.getBoundingClientRect();
      go(event.clientX - box.left < box.width * 0.3 ? -1 : 1);
    });

    function onKey(event) {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Escape') location.hash = '#/mapa';
    }
    document.addEventListener('keydown', onKey);

    root.append(screen);
    render();

    return function () {
      document.removeEventListener('keydown', onKey);
      MapView.setStoriesVisible(true);
    };
  }

  /* ==========================================================
     Pantalla: contar (el formulario llega en la etapa 5)
     ========================================================== */

  var LIMITS = {
    title: 80,
    place: 80,
    text: 1500,
    song: 120,
    thought: 300,
    stops: 12,
  };

  // El borrador sobrevive si la persona sale y vuelve sin querer.
  var draft = null;

  function newDraft() {
    return { title: '', color: randomColor(), stops: [], song: '', thought: '' };
  }

  function draftHasContent() {
    return Boolean(draft && (draft.title || draft.stops.length));
  }

  window.addEventListener('beforeunload', function (event) {
    if (draftHasContent()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  function field(id, label, options) {
    var input = h(options.multiline ? 'textarea' : 'input', {
      id: id,
      class: options.multiline ? 'field__input field__input--area' : 'field__input',
      maxlength: String(options.max),
      placeholder: options.placeholder,
      autocomplete: 'off',
    });
    if (!options.multiline) input.type = 'text';
    input.value = options.value || '';
    return {
      input: input,
      element: h(
        'div',
        { class: options.multiline ? 'field field--grow' : 'field' },
        h('label', { class: 'field__label', for: id }, label),
        input,
      ),
    };
  }

  function mountCompose(root) {
    if (!draft) draft = newDraft();

    MapView.setStoriesVisible(false);
    MapView.clearFocus();
    MapView.setDraft(draft.stops, draft.color);

    var screen = h('section', { class: 'screen' });
    screen.style.setProperty('--story-color', draft.color);
    root.append(screen);

    var stopMoveListener = function () {};
    var step = draft.stops.length ? 'write' : 'title';
    var editing = draft.stops.length - 1;

    function sheetTop(label, onBack) {
      var close = h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Cancelar' }, '×');
      close.addEventListener('click', askDiscard);
      return h(
        'div',
        { class: 'sheet__top' },
        onBack
          ? h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Volver', onClick: onBack }, '←')
          : h('span', { class: 'sheet__spacer' }),
        h('span', { class: 'sheet__label' }, label),
        close,
      );
    }

    function errorLine() {
      return h('p', { class: 'field__error', role: 'alert' });
    }

    // Cancelar con contenido pide confirmación dentro de la misma hoja.
    function askDiscard() {
      if (!draftHasContent()) {
        finish();
        return;
      }
      var sheet = screen.querySelector('.sheet');
      if (!sheet || sheet.querySelector('.discard')) return;
      var box = h(
        'div',
        { class: 'discard', role: 'alertdialog', 'aria-label': 'Descartar historia' },
        h('p', {}, 'Se va a borrar lo que escribiste.'),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'button button--ghost', type: 'button', onClick: function () { box.remove(); } }, 'Seguir'),
          h('button', { class: 'button', type: 'button', onClick: function () { draft = null; finish(); } }, 'Descartar'),
        ),
      );
      sheet.prepend(box);
      box.querySelector('button').focus();
    }

    function finish() {
      location.hash = '#/mapa';
    }

    function show(nextStep) {
      stopMoveListener();
      stopMoveListener = function () {};
      MapView.setDraftLine(null);
      step = nextStep;
      screen.replaceChildren();

      if (step === 'title') showTitle();
      else if (step === 'pick') showPick();
      else if (step === 'write') showWrite();
      else if (step === 'closing') showClosing();
      else if (step === 'done') showDone();
    }

    /* ---------- 1. Título ---------- */

    function showTitle() {
      MapView.setInteractive(false);
      var title = field('compose-title', 'Ponele un título', {
        max: LIMITS.title,
        placeholder: 'El verano de los martes',
        value: draft.title,
      });
      var error = errorLine();
      title.input.addEventListener('input', function () {
        error.textContent = '';
      });

      var form = h(
        'form',
        { class: 'sheet sheet--compose', novalidate: '' },
        sheetTop('Contá tu historia'),
        h('h1', { class: 'sheet__title' }, 'Contá tu historia'),
        h('p', { class: 'sheet__lead' }, 'Es anónima. No pongas nombres reales ni direcciones.'),
        title.element,
        error,
        h('button', { class: 'button sheet__submit', type: 'submit' }, 'Empezar'),
      );
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = title.input.value.trim();
        if (!value) {
          error.textContent = 'Ponele un título para seguir.';
          title.input.focus();
          return;
        }
        draft.title = value;
        show('pick');
      });
      screen.append(form);
      title.input.focus();
    }

    /* ---------- 2. Marcar la zona ---------- */

    function showPick() {
      MapView.setInteractive(true);
      var number = draft.stops.length + 1;
      var last = draft.stops[draft.stops.length - 1] || null;
      if (last) MapView.centerOn(last, 0);

      var marker = h('div', { class: 'zone-picker', 'aria-hidden': 'true' }, h('span', {}, String(number)));
      function sizeMarker() {
        var diameter = Math.max(24, MapView.metersToPixels(CONFIG.zoneRadiusMeters) * 2);
        marker.style.width = diameter + 'px';
        marker.style.height = diameter + 'px';
        MapView.setDraftLine(last);
      }
      stopMoveListener = MapView.onMove(sizeMarker);

      var sheet = h(
        'div',
        { class: 'sheet sheet--compose sheet--short' },
        sheetTop('Salida ' + number, function () {
          if (draft.stops.length) {
            editing = draft.stops.length - 1;
            show('write');
          } else {
            show('title');
          }
        }),
        h('p', { class: 'sheet__lead' }, 'Arrastrá el mapa hasta la zona de la salida. No hace falta que sea exacta.'),
        h(
          'button',
          {
            class: 'button',
            type: 'button',
            onClick: function () {
              var center = MapView.getCenter();
              draft.stops.push({ lng: center.lng, lat: center.lat, place: '', text: '' });
              editing = draft.stops.length - 1;
              MapView.setDraft(draft.stops, draft.color);
              show('write');
            },
          },
          'Marcar esta zona',
        ),
      );

      screen.append(marker, sheet);
      sizeMarker();
    }

    /* ---------- 3. Escribir la salida ---------- */

    function showWrite() {
      MapView.setInteractive(false);
      var stop = draft.stops[editing];
      MapView.setDraft(draft.stops, draft.color);
      MapView.frameStops(draft.stops, { top: 50, bottom: root.clientHeight * 0.6 + 30, left: 48, right: 48 });

      var place = field('compose-place', '¿A dónde fueron?', {
        max: LIMITS.place,
        placeholder: 'Un bar, una plaza, su casa',
        value: stop.place,
      });
      var text = field('compose-text', '¿Qué pasó? ¿Qué sentiste?', {
        max: LIMITS.text,
        placeholder: 'Escribí lo que quieras',
        value: stop.text,
        multiline: true,
      });
      var error = errorLine();
      [place.input, text.input].forEach(function (input) {
        input.addEventListener('input', function () {
          error.textContent = '';
          stop.place = place.input.value;
          stop.text = text.input.value;
        });
      });

      function valid() {
        stop.place = place.input.value.trim();
        stop.text = text.input.value.trim();
        if (!stop.place || !stop.text) {
          error.textContent = 'Completá el lugar y lo que pasó.';
          (stop.place ? text.input : place.input).focus();
          return false;
        }
        return true;
      }

      var full = draft.stops.length >= LIMITS.stops;
      var another = h(
        'button',
        {
          class: 'button button--ghost',
          type: 'button',
          onClick: function () {
            if (valid()) show('pick');
          },
        },
        'Otra salida',
      );
      if (full) another.disabled = true;

      var sheet = h(
        'form',
        { class: 'sheet sheet--compose', novalidate: '' },
        sheetTop('Salida ' + (editing + 1), function () {
          // Volver a marcar esta misma zona.
          draft.stops.splice(editing, 1);
          MapView.setDraft(draft.stops, draft.color);
          show('pick');
        }),
        place.element,
        text.element,
        error,
        full ? h('p', { class: 'note' }, 'Llegaste al máximo de ' + LIMITS.stops + ' salidas.') : '',
        h(
          'div',
          { class: 'actions' },
          another,
          h('button', { class: 'button', type: 'submit' }, 'Terminar'),
        ),
      );
      sheet.addEventListener('submit', function (event) {
        event.preventDefault();
        if (valid()) show('closing');
      });

      screen.append(sheet);
      place.input.focus({ preventScroll: true });
    }

    /* ---------- 4. Lo que te llevás ---------- */

    function showClosing() {
      MapView.setInteractive(false);
      var song = field('compose-song', 'Una canción', {
        max: LIMITS.song,
        placeholder: 'Persiana americana, Soda Stereo',
        value: draft.song,
      });
      var thought = field('compose-thought', 'Un pensamiento', {
        max: LIMITS.thought,
        placeholder: 'No hizo falta ponerle nombre',
        value: draft.thought,
        multiline: true,
      });
      var error = errorLine();
      [song.input, thought.input].forEach(function (input) {
        input.addEventListener('input', function () {
          error.textContent = '';
          draft.song = song.input.value;
          draft.thought = thought.input.value;
        });
      });

      var submit = h('button', { class: 'button sheet__submit', type: 'submit' }, 'Publicar');
      var sheet = h(
        'form',
        { class: 'sheet sheet--compose', novalidate: '' },
        sheetTop('Para terminar', function () {
          editing = draft.stops.length - 1;
          show('write');
        }),
        h('h1', { class: 'sheet__title' }, '¿Qué te llevás de esa persona?'),
        song.element,
        thought.element,
        error,
        submit,
      );
      sheet.addEventListener('submit', function (event) {
        event.preventDefault();
        if (submit.disabled) return;
        draft.song = song.input.value.trim();
        draft.thought = thought.input.value.trim();
        if (!draft.song || !draft.thought) {
          error.textContent = 'Sumá la canción y el pensamiento.';
          (draft.song ? thought.input : song.input).focus();
          return;
        }
        submit.disabled = true;
        submit.textContent = 'Publicando…';
        publish().catch(function (problem) {
          console.warn('No se pudo publicar.', problem);
          submit.disabled = false;
          submit.textContent = 'Publicar';
          error.textContent = 'No se pudo publicar. Revisá tu conexión y probá de nuevo. Lo que escribiste sigue acá.';
        });
      });

      screen.append(sheet);
      song.input.focus({ preventScroll: true });
    }

    /* ---------- 5. Publicar ---------- */

    function publish() {
      return publishStory(draft).then(function (story) {
        stories.unshift(story);
        currentIndex = 0;
        draft = null;
        published = story;
        MapView.clearDraft();
        MapView.showStories(stories);
        show('done');
      });
    }

    var published = null;

    function showDone() {
      MapView.setInteractive(false);
      var story = published;
      MapView.focusStory(story, { padding: { top: 70, bottom: root.clientHeight * 0.6 + 40, left: 48, right: 48 } }).then(
        function () {
          MapView.goldStory(story);
        },
      );

      screen.style.setProperty('--story-color', story.color);
      screen.append(
        h(
          'div',
          { class: 'sheet sheet--story' },
          h('h1', { class: 'sheet__title' }, 'Tu historia ya está en el mapa'),
          h('p', { class: 'sheet__lead' }, story.title + ' · ' + outingsLabel(story.stops.length)),
          db ? '' : h('p', { class: 'note' }, 'Vista previa: sin Supabase, se borra al cerrar la página.'),
          h('a', { class: 'button sheet__submit', href: '#/mapa' }, 'Ver el mapa'),
        ),
      );
    }

    show(step);

    return function () {
      stopMoveListener();
      MapView.setDraftLine(null);
      MapView.clearDraft();
      MapView.setStoriesVisible(true);
    };
  }

  /* ==========================================================
     Pantalla: admin
     Se entra con email y contraseña (Supabase Auth). Solo quien está en la
     tabla admins puede ver las historias ocultas, ocultar/mostrar y borrar:
     lo decide la base con sus reglas, esta pantalla solo lo usa.
     ========================================================== */

  var adminDb = null;

  // Cliente aparte, con sesión. Se guarda en sessionStorage: se cierra al cerrar la pestaña.
  function getAdminDb() {
    if (!adminDb && CONFIG.supabaseUrl && CONFIG.supabaseKey && window.supabase) {
      adminDb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
        auth: {
          storageKey: 'vetas-admin-auth',
          storage: window.sessionStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return adminDb;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function mountAdmin(root) {
    document.body.classList.add('is-admin');

    var client = getAdminDb();
    var alive = true;
    var inner = h('div', { class: 'admin__inner' });
    root.append(h('section', { class: 'screen admin' }, inner));

    var adminStories = [];
    var filter = 'all'; // all | visible | hidden
    var openIds = {};

    function show() {
      if (!alive) return;
      inner.replaceChildren.apply(inner, arguments);
    }

    function header(extra) {
      return h(
        'div',
        { class: 'admin__header' },
        h('a', { class: 'brand admin__brand', href: '#/' }, 'Vetas'),
        extra || h('span'),
      );
    }

    function errorLine(text) {
      var line = h('p', { class: 'field__error', role: 'alert' });
      line.textContent = text || '';
      return line;
    }

    /* ---------- Entrar ---------- */

    function showMessage(text) {
      show(header(), h('h1', { class: 'admin__title' }, 'Administración'), h('p', { class: 'admin__text' }, text));
    }

    function showLogin(message) {
      var email = field('admin-email', 'Email', { max: 200, placeholder: '' });
      email.input.type = 'email';
      email.input.setAttribute('autocomplete', 'username');
      email.input.setAttribute('autocapitalize', 'none');
      email.input.setAttribute('spellcheck', 'false');

      var password = field('admin-password', 'Contraseña', { max: 200, placeholder: '' });
      password.input.type = 'password';
      password.input.setAttribute('autocomplete', 'current-password');

      var error = errorLine(message);
      var submit = h('button', { class: 'button', type: 'submit' }, 'Entrar');
      var form = h('form', { class: 'admin__login', novalidate: '' }, email.element, password.element, error, submit);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var emailValue = email.input.value.trim();
        if (!emailValue || !password.input.value) {
          error.textContent = 'Completá el email y la contraseña.';
          return;
        }
        error.textContent = '';
        submit.disabled = true;

        withTimeout(client.auth.signInWithPassword({ email: emailValue, password: password.input.value }), 15000)
          .then(function (result) {
            if (!alive) return;
            if (result.error) {
              error.textContent = /invalid login/i.test(result.error.message || '')
                ? 'Email o contraseña incorrectos.'
                : 'No se pudo entrar. Probá de nuevo en un rato.';
              submit.disabled = false;
              return;
            }
            checkAdmin();
          })
          .catch(function () {
            if (!alive) return;
            error.textContent = 'No se pudo conectar. Revisá tu conexión y probá de nuevo.';
            submit.disabled = false;
          });
      });

      show(header(), h('h1', { class: 'admin__title' }, 'Administración'), form);
      email.input.focus();
    }

    // Tener cuenta no alcanza: tiene que estar en la tabla admins.
    function checkAdmin() {
      show(header(), h('p', { class: 'admin__text' }, 'Verificando…'));
      withTimeout(client.rpc('is_admin'), 12000)
        .then(function (result) {
          if (result.error) throw result.error;
          if (result.data === true) {
            loadAll();
            return;
          }
          client.auth.signOut();
          showLogin('Esta cuenta no tiene permisos de administración.');
        })
        .catch(function (error) {
          console.warn('No se pudo verificar el acceso.', error);
          showLogin('No se pudo verificar tu acceso. Probá de nuevo.');
        });
    }

    function signOut() {
      client.auth.signOut().then(function () {
        adminStories = [];
        showLogin();
      });
    }

    /* ---------- Lista ---------- */

    function loadAll() {
      show(header(), h('p', { class: 'admin__text' }, 'Cargando historias…'));
      var query = client
        .from('stories')
        .select('id, title, color, song, thought, hidden, created_at, stops (position, place, body)')
        .order('created_at', { ascending: false })
        .limit(500);

      withTimeout(query, 15000)
        .then(function (result) {
          if (result.error) throw result.error;
          adminStories = result.data;
          showList();
        })
        .catch(function (error) {
          console.warn('No se pudieron cargar las historias del admin.', error);
          var retry = h('button', { class: 'button button--small', type: 'button', onClick: loadAll }, 'Reintentar');
          show(header(), h('p', { class: 'admin__text' }, 'No se pudieron cargar las historias.'), retry);
        });
    }

    var listElement = null;
    var filtersElement = null;

    function showList() {
      var signOutButton = h(
        'button',
        { class: 'button button--ghost button--small', type: 'button', onClick: signOut },
        'Salir',
      );
      filtersElement = h('div', { class: 'admin__filters', role: 'group', 'aria-label': 'Filtrar historias' });
      listElement = h('ul', { class: 'admin__list' });
      show(header(signOutButton), h('h1', { class: 'admin__title' }, 'Historias'), filtersElement, listElement);
      renderList();
    }

    function countWhere(predicate) {
      return adminStories.filter(predicate).length;
    }

    function renderFilters() {
      var options = [
        { key: 'all', label: 'Todas', count: adminStories.length },
        {
          key: 'visible',
          label: 'Visibles',
          count: countWhere(function (story) {
            return !story.hidden;
          }),
        },
        {
          key: 'hidden',
          label: 'Ocultas',
          count: countWhere(function (story) {
            return story.hidden;
          }),
        },
      ];
      filtersElement.replaceChildren.apply(
        filtersElement,
        options.map(function (option) {
          return h(
            'button',
            {
              class: 'chip',
              type: 'button',
              'aria-pressed': String(filter === option.key),
              onClick: function () {
                filter = option.key;
                renderList();
              },
            },
            option.label + ' (' + option.count + ')',
          );
        }),
      );
    }

    function renderList() {
      if (!alive || !listElement) return;
      renderFilters();
      var shown = adminStories.filter(function (story) {
        return filter === 'all' || (filter === 'hidden') === story.hidden;
      });
      if (!shown.length) {
        listElement.replaceChildren(h('li', { class: 'admin__text' }, 'No hay historias para mostrar.'));
        return;
      }
      listElement.replaceChildren.apply(listElement, shown.map(renderCard));
    }

    function renderStops(story) {
      var stops = (story.stops || []).slice().sort(function (a, b) {
        return a.position - b.position;
      });
      var list = h('ol', { class: 'admin__stops' });
      stops.forEach(function (stop) {
        list.append(h('li', {}, h('strong', {}, stop.place), h('p', {}, stop.body)));
      });
      return list;
    }

    function renderCard(story) {
      var card = h('li', { class: 'admin__story' + (story.hidden ? ' is-hidden' : '') });
      card.style.setProperty('--story-color', lineColor(story.color));

      var stopCount = (story.stops || []).length;
      var meta = formatDate(story.created_at) + ' · ' + stopCount + (stopCount === 1 ? ' salida' : ' salidas');

      var details = h('details', { class: 'admin__details' }, h('summary', {}, 'Ver historia'));
      details.open = Boolean(openIds[story.id]);
      details.addEventListener('toggle', function () {
        openIds[story.id] = details.open;
      });
      details.append(h('p', {}, 'Canción: ' + story.song), h('p', {}, story.thought), renderStops(story));

      var error = errorLine();
      var actions = h('div', { class: 'admin__actions' });

      function showActions() {
        var toggle = h(
          'button',
          { class: 'button button--ghost button--small', type: 'button' },
          story.hidden ? 'Mostrar' : 'Ocultar',
        );
        toggle.addEventListener('click', function () {
          changeHidden(story, !story.hidden, toggle, error);
        });
        var remove = h('button', { class: 'button button--small button--danger', type: 'button' }, 'Borrar');
        remove.addEventListener('click', showConfirm);
        error.textContent = '';
        actions.className = 'admin__actions';
        actions.replaceChildren(toggle, remove);
      }

      function showConfirm() {
        var confirm = h('button', { class: 'button button--small button--danger-solid', type: 'button' }, 'Sí, borrar');
        confirm.addEventListener('click', function () {
          removeStory(story, confirm, error);
        });
        var cancel = h('button', { class: 'button button--ghost button--small', type: 'button' }, 'Cancelar');
        cancel.addEventListener('click', showActions);
        actions.className = 'admin__confirm';
        actions.replaceChildren(
          h('p', {}, '¿Borrar esta historia para siempre? Se borran también sus salidas.'),
          h('div', { class: 'admin__actions' }, confirm, cancel),
        );
      }

      var title = h('span', { class: 'admin__story-title' }, story.title);
      var status = h(
        'span',
        { class: 'status' + (story.hidden ? ' status--hidden' : '') },
        story.hidden ? 'Oculta' : 'Visible',
      );

      card.append(
        h(
          'div',
          { class: 'admin__story-head' },
          h('span', { class: 'admin__swatch', 'aria-hidden': 'true' }),
          h('div', { class: 'admin__story-text' }, title, h('span', {}, meta)),
          status,
        ),
        details,
        error,
        actions,
      );
      showActions();
      return card;
    }

    /* ---------- Cambios ---------- */

    // Pide la fila de vuelta: si la base no dejó cambiarla, no vuelve nada.
    function changeHidden(story, hidden, button, error) {
      button.disabled = true;
      error.textContent = '';
      withTimeout(client.from('stories').update({ hidden: hidden }).eq('id', story.id).select('id'), 12000)
        .then(function (result) {
          if (result.error) throw result.error;
          if (!result.data || !result.data.length) throw new Error('La base no aplicó el cambio.');
          story.hidden = hidden;
          renderList();
        })
        .catch(function (failure) {
          console.warn('No se pudo cambiar la historia.', failure);
          if (!alive) return;
          error.textContent = 'No se pudo cambiar. Probá de nuevo.';
          button.disabled = false;
        });
    }

    function removeStory(story, button, error) {
      button.disabled = true;
      error.textContent = '';
      withTimeout(client.from('stories').delete().eq('id', story.id).select('id'), 12000)
        .then(function (result) {
          if (result.error) throw result.error;
          if (!result.data || !result.data.length) throw new Error('La base no borró la historia.');
          adminStories = adminStories.filter(function (item) {
            return item.id !== story.id;
          });
          renderList();
        })
        .catch(function (failure) {
          console.warn('No se pudo borrar la historia.', failure);
          if (!alive) return;
          error.textContent = 'No se pudo borrar. Probá de nuevo.';
          button.disabled = false;
        });
    }

    /* ---------- Arranque ---------- */

    if (!client) {
      showMessage('No se pudo conectar con Supabase.');
    } else {
      show(header(), h('p', { class: 'admin__text' }, 'Cargando…'));
      client.auth
        .getSession()
        .then(function (result) {
          if (!alive) return;
          if (result.data && result.data.session) checkAdmin();
          else showLogin();
        })
        .catch(function () {
          showLogin();
        });
    }

    return function () {
      alive = false;
      document.body.classList.remove('is-admin');
    };
  }

  /* ==========================================================
     Navegación
     ========================================================== */

  var routes = [
    { name: 'home', pattern: /^#\/mapa$/, mount: mountHome },
    { name: 'story', pattern: /^#\/historia\/([^/]+)$/, mount: mountStory, params: ['id'] },
    { name: 'compose', pattern: /^#\/contar$/, mount: mountCompose },
  ];

  var screens = document.getElementById('screens');
  var cleanup = null;
  var previousRoute = null;

  function resolve(hash) {
    for (var i = 0; i < routes.length; i++) {
      var match = hash.match(routes[i].pattern);
      if (match) {
        var params = {};
        (routes[i].params || []).forEach(function (name, index) {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { name: routes[i].name, mount: routes[i].mount, params: params };
      }
    }
    return { name: 'welcome', mount: mountWelcome, params: {} };
  }

  function navigate() {
    if (cleanup) cleanup();
    screens.replaceChildren();
    var target = resolve(location.hash);
    cleanup = target.mount(screens, target.params, previousRoute) || null;
    previousRoute = target.name;
  }

  // Cuando llegan las historias, se redibuja la pantalla actual si las necesita.
  function afterLoad() {
    MapView.showStories(stories);
    if (previousRoute === 'home' || previousRoute === 'story') navigate();
  }

  // La página /admin define window.VETAS_ADMIN: monta solo el admin, sin mapa ni rutas.
  if (window.VETAS_ADMIN) {
    mountAdmin(screens);
  } else {
    MapView.init(document.getElementById('map'));
    loadStories().then(afterLoad);

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(MapView.refocus, 200);
    });
    window.addEventListener('hashchange', navigate);
    navigate();
  }
})();
