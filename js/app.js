/*
 * Example of an app that uses dealersChart
 */

// Select filters from DOM
const regionFilter = d3.select("#region-filter");
const sectorFilter = d3.select("#sector-filter");
const dealerFilter = d3.select("#dealer-filter");
const eventFilter = d3.select("#event-filter");

// State
var state = {
  quarter: 0,
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
    // To sync the appearance of tabs and graph
    const animationTime = 1000;

    // Init chart and pass data from Q1 to it
    var chart = dealersChart().data(data[0]).animationTime(animationTime);

    d3.selectAll(".graph").call(chart);

    // Example of switching between quarters
    d3.select("#quarters")
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

    d3.select(".tabs__link").attr("class", "tabs__link tabs__link_selected");

    d3.selectAll(".tabs__link").on("click", function (d, i) {
      state.quarter = i;

      var thisLink = d3.select(this);

      if (thisLink.attr("class") != "tabs__link tabs__link_selected") {
        d3.selectAll(".tabs__link").attr("class", "tabs__link");
        thisLink.attr("class", "tabs__link tabs__link_selected");

        // Pass new data and update chart
        chart.data(selectData(data)).updateChart();
      }
      d3.event.preventDefault();
    });

    // Example of filtering
    initFilters(data[0]);

    regionFilter.on("change", function () {
      state.quarter = 0;
      state.region = regionFilter.property("value");

      // Pass new data and update axes and chart
      chart.data(filterQuarterData(data[0])).updateChart();
    });

    sectorFilter.on("change", function () {
      state.quarter = 0;
      state.sector = sectorFilter.property("value");

      chart.data(filterQuarterData(data[0])).updateChart();
    });

    dealerFilter.on("change", function () {
      state.quarter = 0;
      state.dealer = dealerFilter.property("value");

      chart.data(filterQuarterData(data[0])).updateChart();
    });

    eventFilter.on("change", function () {
      state.quarter = 0;
      state.event = eventFilter.property("value");

      chart.data(filterQuarterData(data[0])).updateChart();
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

// Select filtered data in new quarter
function selectData(data) {
  var newData = data[state.quarter];
  var firstQuarterData = filterQuarterData(data[0]);

  newData = newData.filter(
    (dd) => firstQuarterData.filter((d) => d.id == dd.id).length
  );

  return newData;
}
