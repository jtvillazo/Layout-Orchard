# SAF Layout App — Cuestionario de Ambigüedades

Responde debajo de cada pregunta (podés borrar la pregunta y dejar solo tu respuesta, o simplemente escribir después de cada una). No hace falta que seas técnico/a en las respuestas, solo lo más concreto posible.

---

## 1. Jerarquía de datos

**1.1** ¿Un Orchard tiene muchos Blocks, y cada Block puede tener varios Projects (layouts distintos a través del tiempo)? ¿O un Project ES un Block específico en un momento dado?

*Respuesta:*


**1.2** ¿Se puede tener 2 layouts activos para el mismo Block (por ejemplo, layout 2024 vs layout 2025)? ¿O cuando editás, se pierde la versión anterior?

*Respuesta:*


**1.3** Dentro de un Project podés crear más de un "bloque de grid". ¿Ese bloque de grid es lo mismo que la entidad "Block" que mencionaste separada? Es decir: ¿un Project contiene varios Grids, y cada Grid representa un Block?

*Respuesta:*


---

## 2. Grid — la unidad física

**2.1** Cuando creás una grid con filas y columnas, ¿eso define los bays automáticamente, o el bay se define de otra forma?

*Respuesta:*


**2.2** ¿El usuario define el tamaño físico real (metros entre postes, entre plantas), o solo la cantidad de filas/columnas, sin medida real asociada?

*Respuesta:*


**2.3** ¿Se puede cambiar el tamaño de una grid después de creada sin perder las vines ya puestas?

*Respuesta:*


---

## 3. Escala del canvas

**3.1** ¿Necesitás que el layout represente distancias reales (para usarlo como mapa físico al caminar el bloque), o es puramente esquemático?

*Respuesta:*


**3.2** Si es real: ¿qué unidad se usa en terreno (metros entre postes, entre plantas, etc.)?

*Respuesta:*


---

## 4. Objetos

**4.1** ¿"Objeto" y "Objeto de orientación" son la misma entidad con una categoría/tipo, o son dos cosas separadas?

*Respuesta:*


**4.2** ¿Cada tipo de objeto (cámara, tag Xsense, toilet, entrada, etc.) tiene un ícono fijo predefinido, o el usuario puede elegir o subir su propio ícono?

*Respuesta:*


**4.3** ¿Los objetos se pueden rotar y escalar, o solo mover de lugar?

*Respuesta:*


---

## 5. Treatments (tratamientos)

**5.1** Si editás el color o nombre de un Treatment que ya está en uso, ¿se actualiza automáticamente en todas las vines que lo tienen?

*Respuesta:*


**5.2** ¿Se puede borrar un Treatment que ya tiene vines asignadas? Si sí, ¿esas vines quedan "sin tratamiento" o el borrado se bloquea?

*Respuesta:*


---

## 6. Vines — numeración y identidad

**6.1** La "Number" de la vine, ¿es única por Row, por Grid, o por todo el Project?

*Respuesta:*


**6.2** ¿Se autogenera al crear la vine (según su posición) o el usuario siempre la escribe a mano?

*Respuesta:*


**6.3** Dijiste "hasta 3 vines por bay", pero el checkbox "add trees" pone 2 automáticamente. ¿El 3er tree se agrega manualmente después? ¿En qué posición relativa a los otros 2?

*Respuesta:*


---

## 7. El editor (interacciones)

**7.1** Click simple (corto) sobre una vine u objeto ya creado: ¿selecciona algo, o no hace nada? (ya definiste que crear/editar es con long-press de 1.5s, pero falta el click corto)

*Respuesta:*


**7.2** ¿Se puede arrastrar (mover) un objeto o vine ya creado, o solo se borra y se vuelve a crear en otro lugar?

*Respuesta:*


**7.3** ¿Necesitás Undo/Redo en el MVP, o puede esperar para después?

*Respuesta:*


**7.4** Selección múltiple: ¿por click + shift, por "lazo" (arrastrar un rectángulo de selección), o con el botón "Select" y después click uno por uno?

*Respuesta:*


---

## 8. Export a Excel — columnas exactas

**8.1** ¿Qué columnas exactas necesitás y en qué orden? (ejemplo: N° Vine, Row, Bay, Género, Treatment, Label, Comment)

*Respuesta:*


**8.2** ¿El orden de las filas en el Excel debe ser el orden físico de caminata del bloque (row por row, en el orden en que se recorre), o alcanza con agrupar por treatment?

*Respuesta:*


**8.3** ¿Necesitás un Excel separado para "labels de árbol" vs "labels de caña" (cane), o todo junto con una columna que indique el tipo?

*Respuesta:*


---

## 9. Autosave y versionado

**9.1** Autosave: ¿cada cierto tiempo fijo, o al detectar cambios? ¿Guarda historial de versiones o solo pisa la última?

*Respuesta:*


**9.2** ¿Qué pasa si dos personas editan el mismo Project al mismo tiempo? ¿Puede pasar esto en la práctica?

*Respuesta:*


---

## 10. Identidad sin login

**10.1** Aunque no haya login, ¿necesitás saber quién hizo cada layout o cada cambio (aunque sea con un nombre tipeado, sin autenticación)? Esto importa para trazabilidad de errores humanos, que mencionaste como parte del problema original.

*Respuesta:*


---

## 11. Orden de prioridad (para el MVP)

**11.1** De todo lo de arriba, marcá con una X lo que es indispensable para la primera versión (MVP), y lo que puede esperar:

| Feature | MVP | Después |
|---|---|---|
| Crear grid + vines |  |  |
| Treatments |  |  |
| Objetos (cámaras, tags, etc.) |  |  |
| Objetos de orientación |  |  |
| Textos libres |  |  |
| Vista de lista de vines |  |  |
| Export Excel |  |  |
| Export imagen (JPG) |  |  |
| Autosave |  |  |
| Undo/Redo |  |  |

