﻿////////// AUTHOR & APPLICATION INFORMATION ////////////////////////////////////////  
//  
//   Author: Chris Sergent  
//   Date:   January 6, 2014  
//   Application: GIS Mobile  
//  
////////////////////////////////////////////////////////////////////////////////////  
/// <reference path="jquery-1.9.1.js" />  
/// <reference path="jquery.ui.touch-punch.js" />  
/// <reference path="jquery-ui-1.10.3.custom.min.js" />  


var map, toolbar, symbol, pt, graphic, geomTask, app = {};
// Comments describing require statements are definition from https://developers.arcgis.com/javascript/jsapi/   
// and http://dojotoolkit.org/reference-guide/1.9/  


// Get references to modules to be used  
require(["esri/map",                                // mapSection  
         "esri/config",                             // The default values for all JS API configuration options.   


         "esri/Color",  // measurementDiv  


         "esri/dijit/Geocoder",                     // search  
         "esri/dijit/HomeButton", // Home Button  
         "esri/dijit/Measurement", // measurementDiv  
         "esri/dijit/OverviewMap", // Overview Map  
         "esri/dijit/Scalebar", // Scalebar  


         "esri/geometry/Extent", // The minimum and maximum X- and Y- coordinates of a bounding box. Used to set custom extent  
         "esri/geometry/Point",
         "esri/geometry/screenUtils", // search  


         "esri/graphic", // search  

         "esri/layers/ArcGISDynamicMapServiceLayer",
         "esri/layers/ArcGISTiledMapServiceLayer",
         "esri/layers/LayerDrawingOptions", // measurementDiv  
         "esri/layers/FeatureLayer",


         "esri/renderers/SimpleRenderer", // measurementDiv  


         "esri/SnappingManager", // measurementDiv    -add snapping capability  


         "esri/sniff", // measurementDiv  

         "esri/SpatialReference", 


         "esri/symbols/SimpleFillSymbol", // measurementDiv  
         "esri/symbols/SimpleLineSymbol", // measurementDiv  
         "esri/symbols/SimpleMarkerSymbol", // search  


         "esri/tasks/GeometryService",    // Represents a geometry service resource exposed by the ArcGIS Server REST API.  
         "esri/tasks/PrintTask",          // printer  
         "esri/tasks/PrintParameters",    // printer  
         "esri/tasks/PrintTemplate",      // printer  
         "esri/tasks/ProjectParameters",

         "esri/toolbars/draw",

         "dijit/registry",

         "dojo/_base/array",
         "dojo/_base/Color",                    // search         


         "dojo/dom",                            // It is used for code like - dom.byId("someNode")  
         "dojo/keys",
         "dojo/on",                             // This module is used based on an even such as on("click")  
         "dojo/parser",                         // The Dojo Parser is an optional module.  
         "dojo/query",                      // search  

         "dijit/form/Button",
         "dijit/layout/BorderContainer",
         "dijit/layout/ContentPane",
         "dijit/TitlePane",
         "dijit/form/CheckBox",
         "dijit/WidgetSet",
         "dojo/domReady!"],    // An AMD loaded plugin that will wait until the DOM has finished loading before returning.  


// Set variables to be used with references (write variables and references in the same order and be careful of typos on your references)  
         function (Map, esriConfig, Color, Geocoder, HomeButton, Measurement, OverviewMap, Scalebar, Extent, Point, screenUtils, Graphic,
                   ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, LayerDrawingOptions,
                   FeatureLayer, SimpleRenderer, SnappingManager, has, SpatialReference, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, GeometryService,
                   PrintTask, PrintParameters, PrintTemplate, ProjectParameters, Draw, registry, arrayUtils, Color, dom, keys, on, parser, query) {


             parser.parse();


             /* The proxy comes before all references to web services */
             /* Files required for security are proxy.config, web.config and proxy.ashx  
             - set security in Manager to Private, available to selected users and select  
             Allow access to all users who are logged in 
             (Roles are not required) 
             /* 
             Information on the proxy can be found at: https://developers.arcgis.com/javascript/jshelp/ags_proxy.html 
             */


             // Proxy Definition Begin   
             //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.  
             //If this null or not available the project and lengths operation will not work.   
             // Otherwise it will do a http post to the proxy.  
             esriConfig.defaults.io.proxyUrl = "proxy.ashx";
             esriConfig.defaults.io.alwaysUseProxy = false;


             // Proxy Definition End  


             //-----------------------------------------------------------  
             // Map Services Begin  
             //-----------------------------------------------------------  


             // declare geometry service  
             esriConfig.defaults.geometryService =
             new GeometryService("http://maps.decaturil.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer");


             // set custom extent  
             var initialExtent = new Extent({
                 "xmin": 777229.03,
                 "ymin": 1133467.92,
                 "xmax": 848340.14,
                 "ymax": 1185634.58,
                 "spatialReference": {
                     "wkid": 3435
                 }
             });


             // create map and set slider style to small  
             map = new Map("mapSection", {
                 showAttribution: false,
                 sliderStyle: "small",
                 extent: initialExtent,
                 logo: false
             });


             // add imagery  
             var tiled = new ArcGISTiledMapServiceLayer("http://maps.decaturil.gov/arcgis/rest/services/Aerial_2014_Tiled/MapServer");
             map.addLayer(tiled);
             // set operational layers  
             var operationalLayer = new ArcGISDynamicMapServiceLayer("http://maps.decaturil.gov/arcgis/rest/services/Public/InternetVector/MapServer", { "opacity": 0.5 });
             // add operational layers  
             map.addLayer(operationalLayer);


             // add point feature layer  
             var pointFeatureLayer = new FeatureLayer("http://maps.decaturil.gov/arcgis/rest/services/Test/FeatureServer/0");
             map.addLayer(pointFeatureLayer);


             //-----------------------------------------------------------  
             // Map Services End  
             //-----------------------------------------------------------  

             // Drawing Tools Start  
             map.on("load", createToolbar);


             // loop through all dijits, connect onClick event  
             // listeners for buttons to activate drawing tools  
             registry.forEach(function (d) {
                 // d is a reference to a dijit  
                 // could be a layout container or a button  
                 if (d.declaredClass === "dijit.form.Button") {
                     d.on("click", activateTool);
                 }
             });


             function activateTool() {
                 var tool = this.label.toUpperCase().replace(/ /g, "_");
                 toolbar.activate(Draw[tool]);
                 map.hideZoomSlider();
             }


             function createToolbar(themap) {
                 toolbar = new Draw(map);
                 toolbar.on("draw-end", addToMap);
             }




             function addToMap(evt) {
                 var symbol;
                 toolbar.deactivate();
                 map.showZoomSlider();
                 switch (evt.geometry.type) {
                     case "point":
                     case "multipoint":
                         symbol = new SimpleMarkerSymbol();
                         break;
                     case "polyline":
                         symbol = new SimpleLineSymbol();
                         break;
                     default:
                         symbol = new SimpleFillSymbol();
                         break;
                 }
                 var graphic = new Graphic(evt.geometry, symbol);
                 map.graphics.add(graphic);
             }


             // Drawing Tools End  




             // Allow drawing tools to move with mouse  
             jQuery(function () {
                 jQuery("#header").draggable();
             });


             // Show drawing tools  
             on(dom.byId("showDrawingTools"), "click", function () {
                 document.getElementById("header").style.visibility = 'visible';
             });


             // Hide drawing tools  
             on(dom.byId("closeDrawingTools"), "click", function () {
                 document.getElementById("header").style.visibility = 'hidden';


             });


             // Clear graphics from map  
             on(dom.byId("clearGraphics"), "click", function () {
                 map.graphics.clear();
             });  

            
             // add homeButton begin  
             var home = new HomeButton({
                 map: map
             }, "homeButton");
             home.startup();
             // add homeButton end  

             // overviewMap Begin  
             var overviewMapDijit = new OverviewMap({
                 map: map,
                 visible: false
             });
             overviewMapDijit.startup();
             // overviewMap End  


             // scalebar Begin  
             var scalebar = new Scalebar({
                 map: map,
                 scalebarUnit: "dual"
             });
             // scalebar End  


             // start measurement tool - the current layer we are measuring is the operational layer  


             // defining the lines that will be drawn for measurement  
             var layerDrawingOptions = [];
             var layerDrawingOption = new LayerDrawingOptions();
             var sfs = new SimpleFillSymbol(
                                    "solid",
                                    new SimpleLineSymbol("solid", new Color([195, 176, 23]), 2),
                                    null
                                    );




             layerDrawingOption.renderer = new SimpleRenderer(sfs);


             // change 1 to the layer index that you want to modify:  
             layerDrawingOptions[1] = layerDrawingOption;




             //dojo.keys.copyKey maps to CTRL on windows and Cmd on Mac., but has wrong code for Chrome on Mac  
             var snapManager = map.enableSnapping({
                 snapKey: has("mac") ? keys.META : keys.CTRL
             });


             // layer used for measuring tool. Your tool wont' show up without it.  
             var layerInfos = [{
                 layer: operationalLayer
             }];


             // enables snapping  
             snapManager.setLayerInfos(layerInfos);


             // looks for the domID of measurementDiv and starts the measurement tool there  
             var measurement = new Measurement({
                 map: map
             }, dom.byId("measurementDiv"));
             measurement.startup();

             // end measurement tool  


             // begin print Task  
             app.printUrl = "http://maps.decaturil.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";


             function createPrintTask(printTitle) {
                 var template = new PrintTemplate();
                 template.layout = document.getElementById("printLayoutId").value; // Assigns the layout  
                 template.format = document.getElementById("printFormatId").value; // Assigns the format to printout to  
                 template.layoutOptions = {
                     legendLayers: [], // empty array means no legend  
                     scalebarUnit: "Miles",
                     titleText: printTitle // title to display  
                 };


                 var params = new PrintParameters();
                 params.map = map;
                 params.template = template;


                 var printTask = new PrintTask(app.printUrl);
                 var printObj = {
                     printTask: printTask,
                     params: params
                 }
                 return printObj;
             }




             // Activates printer  
             on(dom.byId("btnPrintReady"), "click", function () {
                 document.getElementById("btnPrintReady").innerHTML = "Printing..."
                 document.getElementById("btnPrintReady").disabled = true; // Button disable while printing  
                 var printObj = createPrintTask(document.getElementById("printTitleId").value); // Gets titles displayed  
                 var printTask = printObj.printTask;
                 printTask.execute(printObj.params, function (evt) {
                     document.getElementById("btnPrintReady").style.display = 'none';
                     document.getElementById("printResult").href = evt.url;
                     document.getElementById("printResult").style.display = 'block';
                     on(dom.byId("printResult"), "click", function () {
                         document.getElementById("btnPrintReady").innerHTML = "Print";
                         document.getElementById("btnPrintReady").style.display = 'block';
                         document.getElementById("btnPrintReady").disabled = false; // Button enabled to produce map print  
                         document.getElementById("printResult").style.display = 'none';
                     });
                 }, function (evt) {
                     document.getElementById("btnPrintReady").disabled = false;
                     document.getElementById("btnPrintReady").innerHTML = "Print";
                 });
             });
             // end of print task  


             // Hides print widget  
             on(dom.byId("closePrint"), "click", function () {
                 document.getElementById("printer").style.visibility = 'hidden';
             });


             // Shows tools  
             on(dom.byId("showTools"), "click", function () {
                 document.getElementById("showToolsButton").style.visibility = 'hidden';
                 document.getElementById("hideToolsButton").style.visibility = 'visible';
                 document.getElementById("showPrinter").style.visibility = 'visible';
                 document.getElementById("draw").style.visibility = 'visible';
             });


             // Hide tools  
             on(dom.byId("hideTools"), "click", function () {
                 document.getElementById("showToolsButton").style.visibility = 'visible';
                 document.getElementById("hideToolsButton").style.visibility = 'hidden';
                 document.getElementById("showPrinter").style.visibility = 'hidden';
                 document.getElementById("printer").style.visibility = 'hidden';
                 document.getElementById("draw").style.visibility = 'hidden';
             });


             // Allow print widget to move with mouse or finger  
             jQuery(function () {
                 jQuery("#printer").draggable({ containment: "window" });
             });


             // Show print widget  
             on(dom.byId("showPrintWidget"), "click", function () {
                 document.getElementById("printer").style.visibility = 'visible';
             });




             // begin geocoder  
             var geocoder = new Geocoder({
                 arcgisGeocoder: false,
                 geocoders: [{
                     url: "http://maps.decaturil.gov/arcgis/rest/services/Public/WebAddressLocator/GeocodeServer",
                     name: "Web Address Locator",
                     placeholder: "Find address",
                     outFields: "*"
                 }],
                 map: map,
                 autoComplete: true,
                 zoomScale: 600
             }, dom.byId("search"));
             geocoder.startup();


             geocoder.on("select", showLocation);


             function showLocation(evt) {
                 map.graphics.clear();
                 var point = evt.result.feature.geometry;
                 var symbol = new SimpleMarkerSymbol()
                                .setStyle("square")
                                .setColor([255, 0, 0, 0.5]);
                 var graphic = new Graphic(point, symbol);
                 map.graphics.add(graphic);


                 map.infoWindow.setTitle("Search Result");
                 map.infoWindow.setContent(evt.result.name);
                 map.infoWindow.show(evt.result.feature.geometry);
                 map.infoWindow.on('hide', function () {
                     map.graphics.remove(graphic);
                 });
             }
             // end geocoder  




         });  