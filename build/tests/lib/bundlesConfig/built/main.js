require.config({
  bundles: {
    rollup: [
      "a",
      "b",
      "c"
    ]
  }
});

require(['a'], function(a) {
  console.log(a);
});
