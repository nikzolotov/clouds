/*
 * Scatterplot with 4 clusters divided by an average value
 */

function dealersChart() {
  // Initial settings. Accessible through setters and getters.
  // TODO: update width
  var width = 1100,
    height = 440,
    margin = {
      top: 36,
      right: 20,
      bottom: 46,
      left: 50,
    },
    labelPadding = 1,
    animationTime = 1000;

  // Settings for sectors. Not accessible.
  const sectors = [
    {
      name: "A",
      color: "#96BA5A",
      bg: "#F2FBDD",
      size: 32,
      symbol: d3.symbolCross,
      top: height - margin.bottom - 15,
      left: width - margin.right - 15,
    },
    {
      name: "B",
      color: "#16AC82",
      bg: "#E6F9EB",
      size: 24,
      symbol: d3.symbolTriangle,
      top: margin.top + 15,
      left: width - margin.right - 15,
    },
    {
      name: "C",
      color: "#8164D9",
      bg: "#E7E8FF",
      size: 24,
      symbol: d3.symbolCircle,
      top: margin.top + 15,
      left: margin.left + 15,
    },
    {
      name: "D",
      color: "#3988E3",
      bg: "#DAF2FF",
      size: 24,
      symbol: d3.symbolSquare,
      top: height - margin.bottom - 15,
      left: margin.left + 15,
    },
  ];

  var data = [];
  var quarter = 0;
  var gX, gY, gGridX, gGridY, gMean, gPoints;

  // Init x and y scales
  const x = d3.scaleLinear().range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

  // Init clusters scales: color and shape
  const color = d3
    .scaleOrdinal(sectors.map((d) => d.color))
    .domain(sectors.map((d, i) => i));

  const shape = d3
    .scaleOrdinal(sectors.map((d) => d3.symbol().size(d.size).type(d.symbol)()))
    .domain(sectors.map((d, i) => i));

  function chart(selection) {
    selection.each(function () {
      // Create svg for the chart
      const svg = d3
        .select(this)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

      // Create group for the clouds
      // Order of the groups below is like z-index
      //   const gclouds = svg.append("g");

      // Create groups for X and Y axes
      gX = svg
        .append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")");

      gY = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + ",0)");

      // Create groups for X and Y grids
      gGridX = svg
        .append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .attr("stroke-opacity", 0.05);

      gGridY = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .attr("stroke-opacity", 0.05);

      svg
        .append("rect")
        .attr("width", 60)
        .attr("height", 18)
        .attr("fill", "#FFF");

      // Create axis labels
      svg.call(xAxisLabel);
      svg.call(yAxisLabel);

      // Create sector labels
      svg.selectAll(".sector").data(sectors).enter().call(sectorLabel);

      //Create group for mean values
      gMean = svg.append("g");

      // Create group for points and labels
      //   const glabels = svg.append("g");
      gPoints = svg.append("g");

      // Update chart with data from the first quarter
      updateAxes();
      updateChart();
    });
  }

  function updateChart() {
    // Update points
    var points = gPoints.selectAll("path").data(data[quarter], (d) => d.id);

    points
      .exit()
      .transition()
      .duration(animationTime / 2)
      .attr("opacity", 0)
      .remove();

    points
      .enter()
      .append("path")
      .attr("class", "point")
      .attr("transform", (d) => `translate(${x(d.sales)},${y(d.cost)})`)
      .attr("fill", (d) => color(d.sector))
      .attr("d", (d) => shape(d.sector))
      //   .on("click", pointClick)
      //   .on("mouseover", pointOver)
      //   .on("mouseout", pointOut)
      .merge(points)
      .attr("d", (d) => shape(d.sector))
      .transition()
      .duration(animationTime)
      .attr("transform", function (d) {
        var s = "";
        if (d3.select(this).classed("point_selected")) s = " scale(2)";
        return "translate(" + x(d.sales) + "," + y(d.cost) + ")" + s;
      })
      .attr("fill", (d) => color(d.sector))
      .attr("opacity", 1)
      .end();
    //   .then(showLabels);

    // Updata mean values lines
    var meanX = gMean.selectAll(".mean-x").data([data[quarter].meanSales]);
    var meanY = gMean.selectAll(".mean-y").data([data[quarter].meanCost]);

    meanX
      .enter()
      .append("g")
      .attr("class", "mean-x")
      .attr("transform", (d) => `translate(${x(d)}, ${margin.top})`)
      .attr("opacity", 0)
      .call((g) =>
        g
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", height - margin.bottom - margin.top)
          .attr("stroke", "#000")
          .attr("stroke-dasharray", "1 2")
          .attr("opacity", 0.4)
      )
      .call((g) =>
        g
          .append("rect")
          .attr("x", -14)
          .attr("y", 7)
          .attr("width", 28) // Нужно считать по длине текста
          .attr("height", 16)
          .attr("fill", "#FFF")
      )
      .call(
        (g) =>
          g
            .append("text")
            .attr("class", "axis-label")
            .attr("x", 0)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            // .text((d) => digitsFormat(d))
            .text((d) => d)
        // .on("mouseover", meanXOver)
        // .on("mouseout", meanOut)
      )
      .merge(meanX)
      .transition()
      .duration(animationTime)
      .attr("transform", (d) => `translate(${x(d)}, ${margin.top})`)
      .attr("opacity", 1)
      .select("text")
      .delay(animationTime)
      .text((d) => d);
    // .text((d) => digitsFormat(d));

    meanY
      .enter()
      .append("g")
      .attr("class", "mean-y")
      .attr("transform", (d) => `translate(${margin.left}, ${y(d)})`)
      .attr("opacity", 0)
      .call((g) =>
        g
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", width - margin.left - margin.right)
          .attr("y2", 0)
          .attr("stroke", "#000")
          .attr("stroke-dasharray", "1 2")
          .attr("opacity", 0.4)
      )
      .call((g) =>
        g
          .append("rect")
          .attr("x", width - margin.left - margin.right - 47)
          .attr("y", -9)
          .attr("width", 40) // Нужно считать по длине текста
          .attr("height", 16)
          .attr("fill", "#FFF")
      )
      .call(
        (g) =>
          g
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width - margin.left - margin.right - 10)
            .attr("y", 4)
            .attr("text-anchor", "end")
            .text((d) => d)
        // .text((d) => digitsFormat(d))
        // .on("mouseover", meanYOver)
        // .on("mouseout", meanOut)
      )
      .merge(meanY)
      .transition()
      .duration(animationTime)
      .attr("transform", (d) => `translate(${margin.left}, ${y(d)})`)
      .attr("opacity", 1)
      .select("text")
      .delay(animationTime)
      .text((d) => d);
    // .text((d) => digitsFormat(d));
  }

  function updateAxes() {
    // If there's a few points mean values could be far greater
    // So, add them to calculate maximums
    var allData = d3.merge(data);
    var sales = allData;
    var costs = allData;

    sales.push({ sales: data[0].meanSales * 2 });
    costs.push({ cost: data[0].meanCost * 2 });

    // Calculate maximums
    var maxX = d3.max(sales, (d) => d.sales);
    var maxY = d3.max(costs, (d) => d.cost);

    if (typeof maxX !== "undefined" && typeof maxY !== "undefined") {
      // Here we take contol out of d3 and make our own ticks and endpoints of the data
      var xTicks = getSmartTicks(maxX);
      var yTicks = getSmartTicks(maxY);

      x.domain([0, xTicks.endPoint]);
      y.domain([0, yTicks.endPoint]);

      // Update axes and grid
      gX.transition().duration(animationTime).call(xAxis, xTicks.count);
      gY.transition().duration(animationTime).call(yAxis, yTicks.count);
      gGridX.transition().duration(animationTime).call(xGrid, xTicks.count);
      gGridY.transition().duration(animationTime).call(yGrid, yTicks.count);
    }
  }

  // Axes helper functions
  const xAxis = (g, ticks) =>
    g.call(
      d3.axisBottom(x).ticks(ticks, ",.0f").tickSize(0, 0).tickPadding(10)
      // .tickFormat(formatXTick)
    );

  const yAxis = (g, ticks) =>
    g.call(
      d3.axisLeft(y).ticks(ticks).tickSize(0, 0).tickPadding(10)
      // .tickFormat(formatYTick)
    );

  // Grid helper functions
  const xGrid = (g, ticks) =>
    g.call(
      d3
        .axisBottom(x)
        .ticks(ticks)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat("")
    );

  const yGrid = (g, ticks) =>
    g.call(
      d3
        .axisLeft(y)
        .ticks(ticks)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
    );

  // Axis labels helper functions
  const xAxisLabel = (g) =>
    g
      .append("text")
      .attr("x", width)
      .attr("y", height - 3)
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("opacity", 0)
      .text("Количество продаж, шт.")
      .transition()
      .duration(animationTime)
      .attr("opacity", 1);

  const yAxisLabel = (g) =>
    g
      .append("text")
      .attr("x", 0)
      .attr("y", 13)
      .attr("class", "axis-label")
      .attr("opacity", 0)
      .text("Стоимость продажи, ₽")
      .transition()
      .duration(animationTime)
      .attr("opacity", 1);

  // Sector label helper function
  const sectorLabel = (g) =>
    g
      .append("g")
      .attr("class", "sector")
      .attr("transform", (d) => `translate(${d.left},${d.top})`)
      .style("opacity", "0")
      .call((g) =>
        g
          .append("circle")
          .attr("r", 10)
          .attr("fill", (d) => d.color)
      )
      .call((g) =>
        g
          .append("text")
          .attr("class", "sector__text")
          .attr("dx", -4.5)
          .attr("dy", 4.5)
          .text((d) => d.name)
      )
      .transition()
      .duration(animationTime)
      .style("opacity", "1");

  function getSmartTicks(val) {
    // Base step between nearby two ticks
    var step = Math.pow(10, Math.trunc(val).toString().length - 1);

    // Modify steps either: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
    if (val / step < 2) {
      step = step / 5;
    } else if (val / step < 5) {
      step = step / 2;
    }

    // Add one more step if the last tick value is the same as the max value
    // If you don't want to add, remove "+1"
    var slicesCount = Math.ceil((val + 1) / step);

    return {
      endPoint: slicesCount * step,
      count: Math.min(10, slicesCount), //show max 10 ticks
    };
  }

  chart.update = function (newData) {
    data = newData;
    quarter = 0;

    updateAxes();
    updateChart();
  };

  chart.switchQuarter = function (value) {
    quarter = value;
    updateChart();
  };

  chart.data = function (value) {
    if (!arguments.length) return data;
    data = value;
    return chart;
  };

  chart.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  chart.labelPadding = function (value) {
    if (!arguments.length) return labelPadding;
    labelPadding = value;
    return chart;
  };

  chart.animationTime = function (value) {
    if (!arguments.length) return animationTime;
    animationTime = value;
    return chart;
  };

  return chart;
}
