/*
 * Example of an app that uses dealersChart
 */

// Select filters from DOM
const regionFilter = d3.select("#region-filter");
const sectorFilter = d3.select("#sector-filter");
const dealerFilter = d3.select("#dealer-filter");
const eventFilter = d3.select("#event-filter");
const quarters = d3.select("#quarters");

// State
var state = {
  region: "all",
  sector: "all",
  dealer: "all",
  event: "all",
};

// Load data
Promise.all([
  d3.csv("data/sales-q1.csv", (d) => parseData(d)),
  d3.csv("data/sales-q2.csv", (d) => parseData(d)),
  d3.csv("data/sales-q3.csv", (d) => parseData(d)),
])
  .then(function (data) {
    prepareData(data);

    // To sync the appearance of tabs and graph
    const animationTime = 1000;

    // Init chart and pass data from Q1 to it
    var chart = dealersChart().data(data).animationTime(animationTime);
    d3.selectAll(".graph").call(chart);

    // Example of switching between quarters

    // Create links. Assume that we have 3 quarters.
    quarters
      .selectAll(".tabs__link")
      .data([1, 2, 3])
      .enter()
      .append("a")
      .attr("class", "tabs__link")
      .attr("href", "#")
      .text((d) => "Q" + d)
      .style("opacity", "0")
      .transition()
      .duration(animationTime)
      .style("opacity", "1");

    quarters.selectAll(".tabs__link").on("click", function (d, i) {
      var thisLink = d3.select(this);

      if (thisLink.attr("class") !== "tabs__link tabs__link_selected") {
        quarters.selectAll(".tabs__link").attr("class", "tabs__link");
        thisLink.attr("class", "tabs__link tabs__link_selected");

        // Just pass new quarter
        chart.switchQuarter(i);
      }

      d3.event.preventDefault();
    });

    selectFirstQuarter();

    // Example of filtering

    // Fill filters with data
    initFilters(data[0]);

    regionFilter.on("change", function () {
      state.region = regionFilter.property("value");

      // Update chart with new data
      chart.update(filterData(data));
      selectFirstQuarter();
    });

    sectorFilter.on("change", function () {
      state.sector = sectorFilter.property("value");
      chart.update(filterData(data));
      selectFirstQuarter();
    });

    dealerFilter.on("change", function () {
      state.dealer = dealerFilter.property("value");
      chart.update(filterData(data));
      selectFirstQuarter();
    });

    eventFilter.on("change", function () {
      state.event = eventFilter.property("value");
      chart.update(filterData(data));
      selectFirstQuarter();
    });
  })
  .catch(function (err) {
    console.log(err);
  });

// Parse CSV row
function parseData(d) {
  return {
    id: +d.id,
    region: +d.region,
    keyEvent: d.keyEvent,
    name: d.name,
    sales: +d.sales,
    cost: parseFloat(d.cost),
    sector: +d.sector,
  };
}

function prepareData(data) {
  for (i = 0; i < data.length; i++) {
    data[i].meanSales = d3.mean(data[i], (d) => d.sales);
    data[i].meanCost = d3.mean(data[i], (d) => d.cost);
  }
  return data;
}

// Fill filters with options
function initFilters(data) {
  regionFilter
    .selectAll("options")
    .data([1, 2, 3, 4, 5, 6, 7, 8, 9]) // for simplicity it's just hardcoded
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => "Регион " + d);

  sectorFilter
    .selectAll("options")
    .data(["A", "B", "C", "D"])
    .enter()
    .append("option")
    .attr("value", (d, i) => i)
    .text((d) => d);

  dealerFilter
    .selectAll("options")
    .data(data)
    .enter()
    .append("option")
    .attr("value", (d) => d.id)
    .text((d) => d.name);

  eventFilter
    .selectAll("options")
    .data(["Тренинг Март 2019"])
    .enter()
    .append("option")
    .text((d) => d);
}

// Filter all data depending on state
function filterData(data) {
  var newData = [];

  // To save mean values after filtering
  var sales = data[0].meanSales;
  var cost = data[0].meanCost;

  // Filter data in first quarter
  newData[0] = filterQuarterData(data[0]);
  newData[0].meanSales = sales;
  newData[0].meanCost = cost;

  // Filter rest of the data (because sector and event changes in time)
  for (i = 1; i < data.length; i++) {
    sales = data[i].meanSales;
    cost = data[i].meanCost;

    newData[i] = data[i].filter(
      (dataParent) => newData[0].filter((d) => d.id == dataParent.id).length
    );
    newData[i].meanSales = sales;
    newData[i].meanCost = cost;
  }

  return newData;
}

// Filter quarter data depending on state
function filterQuarterData(data) {
  var newData = data;

  if (state.region !== "all")
    newData = newData.filter((d) => d.region == state.region);

  if (state.sector !== "all")
    newData = newData.filter((d) => d.sector == state.sector);

  if (state.dealer !== "all")
    newData = newData.filter((d) => d.id == state.dealer);

  if (state.event !== "all")
    newData = newData.filter((d) => d.keyEvent == state.event);

  return newData;
}

// Just make first quarter tab active
function selectFirstQuarter() {
  quarters.selectAll(".tabs__link").attr("class", "tabs__link");
  quarters
    .select(".tabs__link")
    .attr("class", "tabs__link tabs__link_selected");
}
