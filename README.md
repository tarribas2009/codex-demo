# Mini Apps

Aplicacion web estatica con dos mini apps en una sola pagina:

- `App Hola`: un boton que muestra `Hola`
- `App Dados`: una tirada de dados 3D con confeti cuando sale un 6

## Abrir en local

1. Abre una terminal en `G:\Mi unidad\Codex\Proyecto 1`
2. Ejecuta `python -m http.server 8000`
3. Abre [http://localhost:8000](http://localhost:8000)

## Navegacion

Usa el menu lateral izquierdo para cambiar entre las apps.

## Archivos principales

- `index.html`: estructura de ambas vistas y del menu lateral
- `styles.css`: layout general y estilos de las dos apps
- `src/main.js`: selector de vistas y logica interactiva
