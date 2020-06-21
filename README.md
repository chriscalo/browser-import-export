# browser-import-export
A lightweight ES modules-inspired module system for rapid prototyping in the browser


# Getting started

With this simple module system, it becomes possible to have asynchronous modules
in the browser for rapid prototyping. This makes it easier to write your
JavaScript within an HTML file in the order that makes sense to you, instead of
trying to ensure that you order all of your JavaScript code is authored in
dependency order.

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
