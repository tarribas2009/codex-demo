# Mini Apps

Aplicacion web estatica con dos mini apps en una sola pagina:

- `App Hola`: un boton que muestra `Hola`
- `App Dados`: dos dados 3D con historial persistente en IndexedDB

## App de dados

La app de dados:

- guarda las ultimas 100 tiradas en IndexedDB
- muestra una grafica historica de las sumas
- muestra una grafica de densidad/probabilidad de las sumas

## Abrir en local

1. Abre una terminal en `G:\Mi unidad\Codex\Proyecto 1`
2. Ejecuta `python -m http.server 8000`
3. Abre [http://localhost:8000](http://localhost:8000)

## Archivos principales

- `index.html`: estructura de ambas vistas y del panel analitico
- `styles.css`: layout general, dados y graficas
- `src/main.js`: selector de vistas, IndexedDB y logica interactiva
