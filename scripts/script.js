// height and width of the page
let width = window.innerWidth;
let height = window.innerHeight;

let dataset;
// features to display
const FEATURES = [
"f",
"m",
"n",
"e",
"h"
];

// it contains the range of values of each feature displayed
let featureToRangeMap = {};

// it contains the y face of each face
let indexFaceToYcoordinate = {};

// it contains the x coordinate of half of the face 
let indexFaceToXcoordinate = {};

// it contains the radius of each face
let indexFaceToRadius = {};

// contains the height of each face
let indexFaceToHeight = {};

// contains the width of each face
let indexFaceToWidth = {};

// it contains the destinations range for each feature
let rangesForFeature = {
  "f" : [width/13, width/5],
  "n" : [width/60, width/40],
  "e": [width/51, width/20],
  "m": [width/51, width/20]
};


function main(){
  d3.json("data/data.json")
  .then(function(data) {
    dataset = data;
    drawFace();
  }
  );

}

window.onload=main;

window.addEventListener('resize', function () { 
    "use strict";
    window.location.reload(); 
});

// it updates the dictionary after the click
function resetDictionaryWidthHeight(listElement, feature, index){
  let widthFace = scaleFeature(feature, listElement);
  indexFaceToWidth[index] = widthFace;
  let heightFace = scaleFeature(feature, listElement);
  indexFaceToHeight[index] = heightFace;
}

// it populates the dictionary
function populateFeatureToRangeMap(dataJson){
  FEATURES.forEach(function(f){
   let max = d3.max(dataJson, function(d) { return d[f]; });
   let min = d3.min(dataJson, function(d) { return d[f]; });

   featureToRangeMap[f] = [min,max];
 })
};

// it returns the correct scaled width/height/radius (images: nose, mouth, eyes, face)
function scaleFeature(feature, listElement){
  let originalRange = featureToRangeMap[feature];
  let originalValue = listElement[feature];
  let destinationRange = rangesForFeature[feature];
  let scaleDimension = d3.scaleLinear().domain(originalRange).range(destinationRange);
  return scaleDimension(originalValue);
}

// it returns the correct x coordinate for each element
function scaleX(index, feature, listElement){
  if(feature == "f"){
    let xCoordinate;
    if(index<5)
      xCoordinate = (index*2+1)*width/10 - indexFaceToWidth[index]/2;
    else
      xCoordinate = ((index-5)*2+1)*width/10 - indexFaceToWidth[index]/2;
    indexFaceToXcoordinate[index] = xCoordinate;
    return xCoordinate;
  }
  // each item is placed on the median line of the face (?)
  let central = indexFaceToXcoordinate[index] + indexFaceToWidth[index]/2;
  return central - scaleFeature(feature, listElement)/2;
}

// it returns the correct y coordinate for each element
function scaleY(index, feature, listElement){
  if(feature == "f"){
    let yCoordinate;
    if(index<5)
      yCoordinate = height/4- indexFaceToHeight[index]/2;
    else
      yCoordinate = height*3/4 - indexFaceToHeight[index]/2;
    indexFaceToYcoordinate[index] = yCoordinate;
    return yCoordinate;
  }
    if(feature == "e")
      // the eyes are placed on the line of the ears (44% of the face)
    return indexFaceToYcoordinate[index] + indexFaceToHeight[index]*44/100 - scaleFeature(feature, listElement)/2;
    if(feature == "n")
      // the nose is placed at the end of the line of the ears (60% of the face)
      return indexFaceToYcoordinate[index] + indexFaceToHeight[index]*60/100 - scaleFeature(feature, listElement)/2;
    if(feature == "m")
      // the mouth is placed at 80% of the face
      return indexFaceToYcoordinate[index] + indexFaceToHeight[index]*80/100 - scaleFeature(feature, listElement)/2; 
}

// it handles the clicking event and call the function to sort the faces
function onClickListener(faccia,d){
  // visage's feature selected by user
  let selectedFaceAttribute = d3.select(this);
  // class of the feature
  let attributeClass = selectedFaceAttribute.attr("class");
  sortVisages(attributeClass, scaleX);
}

// it sorts the visages based on the passed key
function sortVisages(key, xScale) {
  let sortedFaces = null;
  let svg = d3.select("svg");
  sortedFaces = svg.selectAll("g.faces")

  sortedFaces.sort(function(a, b) {
    return d3.ascending(a[key], b[key]);
  });

  FEATURES.forEach(function(svgID, index) {

      sortedFaces
      .select("." + svgID)
      .transition()
      .delay(function(d, i) {
        return i * 100;
      })
      .duration(1000)
      .attr("x", function(d, i) {
        if(svgID == "f")
          resetDictionaryWidthHeight(d, svgID, i);
        return scaleX(i, svgID, d);
      })
      .attr("y", function(d,i){
        if(svgID == "f")
          resetDictionaryWidthHeight(d, svgID, i);
        return scaleY(i, svgID, d);
      });
  });
}

// it displays the value of the feature selected
function onMouseOverListener(data, index) {
  let parentElement = d3.select(this);
  parentElement
  .append("title")
  .text(data[parentElement.attr("class")]);
}


// it draws the faces each times the page is updates
function drawFace(){

  width = window.innerWidth;
  height = window.innerHeight;

  let svg = d3.select("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 "+width + " " +height )
  .classed("svg-content-responsive", true);

  width = parseInt(svg.style("width"));
  height = parseInt(svg.style("height"));

  populateFeatureToRangeMap(dataset);

  let facce = svg
  .selectAll('faces')
  .data(dataset)
  .enter()
  .append("g")
  .attr("position", "relative")
  .attr("transform", (d,index) => {"translate(" + scaleX(index,"f", d) + ", " + scaleY(index, "f", d) +")"} )
  .classed("faces", true);

  // each feature is appended and properly scaled
  // to each feature is added a listener to handle the click event  

  // face
  facce
  .append("image")
  .attr('href', 'images/face.png')
  .attr('position', 'absolute')
  .attr("width", (d,index) => { indexFaceToWidth[index] = scaleFeature("f", d);  return scaleFeature("f", d);})
  .attr("height", (d,index) => { indexFaceToHeight[index] = scaleFeature("f", d); return scaleFeature("f", d);})
  .attr("x", (d, index) => {return scaleX(index, "f", d);})
  .attr("y", (d, index) => {return scaleY(index, "f", d);})
  .classed("f", true)
  .on("click", function(d) {
    onClickListener.call(this,d)
  })
  .on("mouseover", function(d,index) {
  onMouseOverListener.call(this,index);
})
  facce
  .append("image")
  .attr('href', 'images/mouthR.png')
  .attr("position", "absolute")
  .attr("width", d => {  return scaleFeature("m", d);})
  .attr("height", d => {  return scaleFeature("m", d);})
  .attr("x", (d, index) => {return (scaleX(index, "m", d))})
  .attr("y", (d, index) => {return scaleY(index, "m", d)})
  .classed("m", true)
  .on("click", function(d) {
    onClickListener.call(this,d)
  })
  .on("mouseover", function(d,index) {
  onMouseOverListener.call(this,index);
})
  // nose
  facce
  .append("image")
  .attr('href', 'images/noseCut.png')
  .attr("position", "absolute")
  .attr("width", d => {  return scaleFeature("n", d);})
  .attr("height", d => {  return scaleFeature("n", d);})
  .attr("x", (d, index) => {return (scaleX(index, "n", d))})
  .attr("y", (d, index) => {return (scaleY(index, "n", d))})
  .classed("n", true)
  .on("click", function(d) {
    onClickListener.call(this,d)
  })
  .on("mouseover", function(d,index) {
  onMouseOverListener.call(this,index);
})
  // eyes
  facce
  .append("image")
  .attr('href', 'images/eyesCut.png')
  .attr("position", "absolute")
  .attr("width", d => {  return scaleFeature("e", d);})
  .attr("height", d => {  return scaleFeature("e", d);})
  .attr("x", (d, index) => {return (scaleX(index, "e", d))})
  .attr("y", (d, index) => {return (scaleY(index, "e", d))})
  .classed("e", true)
  .on("click", function(d) {
    onClickListener.call(this,d)
  })
  .on("mouseover", function(d,index) {
  onMouseOverListener.call(this,index);
});

}

