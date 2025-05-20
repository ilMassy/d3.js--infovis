// current dataset
let currentData = [];

// time for transitions in milliseconds
var updateTime = 5000;

// SVG object width and height
var width = 925;
// height = width * 1.3 for initialization
var height = 1202.5;

// ----------------------------------------------------------- //

// band scaler for house construction
var bandScale = d3.scaleBand()         
               .rangeRound([0, width])    
               .padding(.1);

function updatebandScaleDomain(data) {
    bandScale.domain(d3.range(data.length));
}

// ----------------------------------------------------------- //

// horizontal scaler for "baseWidth" and "roofWidth"
var xScale = d3.scaleLinear();


function updateXScale(data) {

  // "baseWidth" and "roofWidth" updates together with the band scaler
  xScale.range([0, bandScale.bandwidth()]);

  /* calculate the maximum of all values ​​of "baseWidth" and "roofWidth" 
  of the dataset passed as parameter */
  
  const maxValX = d3.max(data, function(d) {
    return Math.max(d.baseWidth, d.roofWidth);
  });

  console.log("Max value (baseWidth or roofWidth) in the dataset: " + maxValX);

  // update the horizontal scaler domain
  xScale.domain([0, maxValX]);
}

// ----------------------------------------------------------- //

// vertical scaler for "houseHeight = (baseHeight + roofHeight)"
var yScale = d3.scaleLinear();


function updateYScale(data) {

  yScale.range([bandScale.bandwidth() * 1.3, 0]);

  // calculates the maximum of all sums of "houseHeight" for each row in the dataset
  const maxValY = d3.max(data, function(d) {
    return d.baseHeight + d.roofHeight;
  });

  console.log("Max value (baseHeight + roofHeight) in the dataset: " + maxValY);

  // updates the vertical scaler domain
  yScale.domain([0, maxValY]);
}

// ----------------------------------------------------------- //

// creation of SVG object
var svg = d3.select("body").append("svg")
    .attr("width", width)  
    .attr("height", height);

// ----------------------------------------------------------- //

// function for build houses
// receives as a parameter a selection of SVG groups
function drawHouses(selection) {
  // for each element (SVG group) of the selection apply the rectangle and triangle construction functions
  // d is the row of the dataset being considered
  selection.each(function(d, i) {

    const group = d3.select(this);                                    // take a group, to build an house
    const xCenter = bandScale(i) + bandScale.bandwidth() / 2;         // the center of the band
          
    // scaled parameters
    const baseHeight = yScale(d.baseHeight);
    const baseWidth = xScale(d.baseWidth);   
    const houseHeight = yScale(d.baseHeight + d.roofHeight);   
    const roofWidth = xScale(d.roofWidth);  
          
    // definition of vertices of the polygon (triangle)
    const x1 = xCenter - roofWidth / 2,  y1 = baseHeight;
    const x2 = xCenter, y2 = houseHeight;
    const x3 = xCenter + roofWidth / 2, y3 = baseHeight;

    // construction of the string of points for the polygon
    const pointsString = `${x1},${y1} ${x2},${y2} ${x3},${y3}`;


    // construction of the rectangle
    group.append("rect")
      .attr("class", "clickableRect")
      .attr("x", xCenter - baseWidth / 2)
      .attr("y", baseHeight)
      .attr("width", baseWidth)
      .attr("height", ((bandScale.bandwidth()) * 1.3) - baseHeight)
      .attr("fill", "gold")
      .on("click", () => sortData("baseHeight", "baseWidth"));        /* sort houses after click by baseHeight and baseWidth 
                                                                        for cases with same baseHeight */ 


    // construction of the triangle
    group.append("polygon")
      .attr("class", "clickableTriangle")
      .attr("points", pointsString)
      .attr("fill", "red")
      .on("click", () => sortData("roofHeight", "roofWidth"));         /* sort houses after click by roofHeight and roofWidth 
                                                                        for cases with same roofHeight */ 
    });
}

// function for update houses
function updateHouses(selection) {

  selection.each(function(d, i) {
    
    const group = d3.select(this);

    const xCenter = bandScale(i) + bandScale.bandwidth() / 2;

    // scaled parameters
    const baseHeight = yScale(d.baseHeight);
    const baseWidth = xScale(d.baseWidth);   
    const houseHeight = yScale(d.baseHeight + d.roofHeight);   
    const roofWidth = xScale(d.roofWidth); 

    const x1 = xCenter - roofWidth / 2,  y1 = baseHeight;
    const x2 = xCenter, y2 = houseHeight;
    const x3 = xCenter + roofWidth / 2, y3 = baseHeight;

    const pointsString = `${x1},${y1} ${x2},${y2} ${x3},${y3}`;

    // creation of the transition for the group
    const t = group.transition().duration(updateTime);

    t.select("rect")
      .attr("x", xCenter - baseWidth / 2)
      .attr("y", baseHeight)
      .attr("width", baseWidth)
      .attr("height", ((bandScale.bandwidth()) * 1.3) - baseHeight);

    t.select("polygon")
      .attr("points", pointsString);
  });
}


// function to update the entire drawing
function updateDrawing(data){

  // update the global variable "currentData"
  currentData = data;

  // uniquely identify each element of the dataset
  var houses = svg.selectAll("g.house").data(data, d => d.id);


  // exit
  houses.exit().remove();

  // enter
  houses.enter()
    .append("g")
    .attr("class", "house")
    .call(drawHouses);  
      
  // update
  houses.call(updateHouses);
} 

// ----------------------------------------------------------- //

// sorting by "key1" and "key2" for cases with same "key1"
function sortData(key1, key2) {
  currentData.sort((a, b) => {
    const compare1 = d3.ascending(a[key1], b[key1]);
    return compare1 !== 0 ? compare1 : d3.ascending(a[key2], b[key2]);
  });

  console.log("Sorted dataset: ");
  console.log(currentData);

  updateDrawing(currentData);
}

// ----------------------------------------------------------- //

d3.json("data/dataset.json")
  .then(data => {
    // if a value in the dataset is not positive throw an error
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const [key, value] of Object.entries(row)) {
        if (value <= 0) {
          throw new Error(`Error: not positive value (${value}) at row ${i + 1}, field "${key}"`);
        }
      }
    }
    console.log("Valid Dataset: all values are positive (> 0)");

    // if everything is ok, update the scales and the drawing
    updatebandScaleDomain(data);
    updateXScale(data);
    updateYScale(data);
    updateDrawing(data);
  })
  .catch(error => {
    console.error("Error loading or validating the dataset:", error);
  });
