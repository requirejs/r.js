require.config({
  bundles: {
    rollup1: [
      "refine",
      "refine!d",
      "Promise",
      "c"
    ],
    rollup2: [
      "b",
      "a"
    ]
  }
});

require(['a'], function(a) {
  console.log(a);
});
