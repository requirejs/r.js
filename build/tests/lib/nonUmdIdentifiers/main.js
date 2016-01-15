(function (global) {
   var loadEvents = (function loadTimerObj() {
   }()).add('main-init');

   define('loadEvents', [], loadEvents);

   if (global.__gsnConfig) {
       define('gsnConfig', [], global.__gsnConfig);
   } else {
       define('gsnConfig', [], { empty: true });
   }

   if (global.__requireConfig) {
       define('requireConfig', [], global.__requireConfig);
   } else {
       define('requireConfig', [], { empty: true });
   }

   if (global.__gaq) {
       define('gaq', [], global._gaq);
   } else {
       define('gaq', [], []);
   }

   if (global.__index) {
       define('index', [], global.__index);
   } else {
       define('index', [], {});
   }

   define('modernizr', [], global.Modernizr);

   require(['requireConfig', 'gsnConfig'], function (requireConfig, gsnConfig) {
       'use strict';

       var paymentsShim = {}, legacyShim = {}, debugFilter;

       gsnConfig.dropInHeader = global.__dropInHeader;

       define('legacyShim', [], legacyShim);
       if (gsnConfig.useLegacyShim) {
           global.redesignShim = legacyShim;
       }


       define('paymentsShim', [], paymentsShim);
       if (gsnConfig.usePaymentsShim) {
           global.paymentsShim = {};
       }

       var
           jqKeys = { jquery: 'jquery', ui: 'jqueryui' },
           jQueryAlreadyDefined = global.jQuery,
           jQueryUIAlreadyDefined = global.jQuery && global.jQuery.ui;
       if (jQueryAlreadyDefined) {
           define(jqKeys.jquery, [], function() { return global.jQuery; });
       }
       if (jQueryUIAlreadyDefined) {
           define(jqKeys.ui, [], function () { return {}; });
       }

       require(['jquery'], function ($) {
       });

       require([
           'jquery',
           'gsn',
           'gsn-extensions',
           'debug',

           'jqueryui'
       ], function ($, gsn, gsnExtensions, debugLogger) {
          function start() {}

           require([
               'app',
               'angular',
               'modernizr',

               'states'
           ], start);
       });
   });
})(this);
