# browser-import-export
A lightweight ES modules-inspired module system for rapid prototyping in the browser


## Getting started

With this simple module system, it becomes possible to have asynchronous modules
in the browser for rapid prototyping. This makes it easier to write your
JavaScript within an HTML file in the order that makes sense to you, instead of
trying to ensure that all of your JavaScript is authored in dependency order.

```html
<!DOCTYPE html>
<meta charset="utf-8"/>

<script src="https://cdn.jsdelivr.net/npm/browser-import-export/index.js"></script>

<script type="module">
(async () => {
  const foo = await module.import("foo");
  document.body.appendChild(document.createTextNode(foo.msg));
})();
</script>

<script type="module">
  module.export("foo", { msg: "Hello, World!"});
</script>
```

## `require()` and `define()`

Also available are some AMD-inspired `require()` and `define()` functions.

``` html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <script src="https://cdn.jsdelivr.net/npm/browser-import-export/index.js"></script>
  </head>
  <body>
    <script>
      require(["msg", "name"], (msg, name) => {
        const textNode = document.createTextNode(msg(name));
        document.body.appendChild(textNode);
      });
    </script>
    
    <script>
      define("msg", () => {
        return (name) => `Hello, ${name}!`;
      });
    </script>
    
    <script>
      define("name", () => {
        return "World";
      });
    </script>
    
  </body>
</html>
```


## Debugging

If something doesn't seem to be working as expected, you can use the
`module.debug()` method to inspect what is going on.

``` html
<!DOCTYPE html>
<meta charset="utf-8"/>

<script src="https://cdn.jsdelivr.net/npm/browser-import-export/index.js"></script>

<script type="module">
(async () => {
  const foo = await module.import("foo");
  document.body.appendChild(document.createTextNode(foo.msg));
})();
</script>

<script type="module">
  module.export("bar", { msg: "Hello, World!"});
</script>

<script>
  // use this to debug module loading issues
  console.log(module.debug());
</script>
```

If you open the DevTools console, you'll see something like the following, which
gives you a clue that the module `foo` has been requested but not resolved.

``` js
Object
bar: {isResolved: true, data: Promise, resolve: ƒ}
foo: {isResolved: false, data: Promise, resolve: ƒ}
__proto__: Object
```
