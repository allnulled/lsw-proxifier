# lsw-proxifier

Class proxifier tool for LSW.

## Installation

```sh
npm install -s lsw-proxifier
```

## Importation

In node.js:

```js
require("@allnulled/lsw-proxifier");
```

In browser:

```html
<script src="node_modules/@allnulled/lsw-proxifier/proxifier.unbundled.js"></script>
```

## ¿Para qué es?

Sirve para crear proxies de objetos y listas usando clases previamente registradas.

## ¿Qué features tiene?

- Nombre de espacios y API vía clase.
- Inyección global a todos los proxis vía instanciación del Proxifier.
- Definición centralizada de clases proxi.
- API básica para listas (arrays, opcional).
- Ciclo de inicialización incluído en el flujo normal de la API.
- Te deja obtener un factory para abreviar 1 acceso, del `proxifier` a su método `proxy`. Na, chorradas.
- Te permite tener tu propio sistema de jerarquía de clases independiente del sistema: el sistema se acuerda de usar el `initialize` que llama al `onInitialize`, y de guardarte en un árbol la indexación de clases que tú luego abrevias con el `.` en el `name`.
- Es una API que sí respeta las interfaces nativas del lenguaje.
- Bueno, ocupa el namespace `Proxifier`.


## ¿Cuál es la idea de uso?

Primero instancias un proxifier:

```js
const proxifier = new Proxifier({
  // Aquí inyectas para todos manualmente (no prototipo sino Object.assign en el constructor):
  $api: mi.super.api()
});
```

Segundo registras tus propias clases de proxis:

```js
proxifier.define("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii", class extends proxifier.Item {
  // Aquí inyectas para los proxis de objetos:
}, class extends proxifier.List {
  // Aquí inyectas para los proxis de listas:
  constructor(other, args) {
    // Este método se llama automáticametne al proxificar.
  }
  onInitialize(initialize, args) {
    // Este método [es especial porque] se llama automáticamente al proxificar [y no es el constructor].
  }
});
```

Tercero instancias tus propios proxis:

```js
proxifier.proxify({}).as("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii");
proxifier.proxify([]).as("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii");
proxifier.proxify([]).as("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii", "item");
proxifier.proxify([]).as("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii", "list");
// Quizá esta línea explique el ejemplo anterior, los nombres de los parámetros:
proxifier.proxify([]).as("Mi.Super.Proxy.Con.Namespaces.Automatico.Siii", "list", ["other", "args"], ["initialize", "args"]);
```

## Test

The test goes as follows:

```js
require(__dirname + "/proxifier.unbundled.js");

// Definir "SomeClass"
const proxifier = new Proxifier({
  // This object is for global, manual injections:
  saludate(somebody) {
    console.log("Hi, " + somebody);
    return this;
  }
});
proxifier.define("SomeClass",
  // This class is for objects:
  class extends proxifier.Item {
    print() {
      console.log("item", this.value);
      return this;
    }
  },
  // This class is for arrays:
  class extends proxifier.List {
    print() {
      console.log("list", this.value);
      console.log("items", this.value.length);
      return this;
    }
  }
);
proxifier.proxify({}).as("SomeClass").print();  // Debería imprimir "item {}"
proxifier.proxify([1, 2, 3]).as("SomeClass").print();  // Debería imprimir la lista y la cantidad de elementos
proxifier.proxify([1, 2, 3]).as("SomeClass").sort((a,b) => a<b?1:-1).print();
proxifier.proxify([1, 2, 3]).as("SomeClass").map(i => i*2).print();
proxifier.proxify([1, 2, 3]).as("SomeClass").filter(i => (i % 2) === 0).print();
proxifier.proxify([{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1}]).as("SomeClass").onlyProp("b").print();
proxifier.proxify([{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1}]).as("SomeClass").onlyProps(["a","d"]).print();
proxifier.proxify([{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1}]).as("SomeClass").removeProp("a").print();
proxifier.proxify([{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1},{a:0,b:1,c:1,d:1}]).as("SomeClass").removeProps(["a","d"]).print();
proxifier.proxify([1,1,2,3,2,4,5,5,6,2,2,2,1]).as("SomeClass").deduplicate().print().saludate("user!").print();

proxifier.define("com.namespaced.async.RandomClass", class extends proxifier.Item {
  // Fill randomly:
}, class extends proxifier.List {
  constructor(value, a, b, c) {
    super(value);
    console.log(a,b,c);

  }
  // Fill randomly:
  onInitialize(a,b,c) {
    console.log(a,b,c);
    this.value = 500; // This is bad because you break compatibility, but you still could do it, it's JS.
    return;
  }
});

// Check that namespaces are naturally made by using . as separator:
console.log(proxifier.classes.com.namespaced.async.RandomClass.Item);
console.log(proxifier.classes.com.namespaced.async.RandomClass.List);

proxifier.proxify({}).as("com.namespaced.async.RandomClass").saludate("Hi!");

// To force typage you can:
const forcedList = proxifier.proxify({}).as("com.namespaced.async.RandomClass", "list");
const forcedItem = proxifier.proxify({}).as("com.namespaced.async.RandomClass", "item");
console.log(forcedList, forcedItem);

// You can use the factory to abbreviate:
const proxy = proxifier.getFactory();
proxy({}).as("com.namespaced.async.RandomClass", "item").saludate("user");
// This is a demo on how to use the [constructor args], [initialize args] on proxification:
proxy({}).as("com.namespaced.async.RandomClass", "list", [400,500,600], [100, 200, 300]).saludate("user");
```