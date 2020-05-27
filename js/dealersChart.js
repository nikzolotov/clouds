/*
 * Scatterplot with 4 clusters divided by an average value
 */

function dealersChart() {
  // Initial settings. Accessible through setters and getters.
  var width = 1100,
    height = 440,
    margin = {
      top: 36,
      right: 20,
      bottom: 46,
      left: 50,
    },
    labelPadding = 4,
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

  // Digits formatting
  const digitsFormat = d3
    .formatLocale({
      decimal: ",",
      thousands: " ",
      grouping: [3],
    })
    .format(",.0f");

  var data = [];
  var quarter = 0;
  var gX, gY, gGridX, gGridY, gMean, gLabels, gPoints, gPointsAreas;
  var tooltip, tooltipTitle, tooltipValue;

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

      // Create tooltip
      tooltip = d3.select(this).append("div").attr("class", "tooltip");
      tooltipTitle = tooltip.append("h2").attr("class", "tooltip__title");
      tooltipValue = tooltip.append("div").attr("class", "tooltip__value");

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

      //Create group for mean values
      gMean = svg.append("g");

      // Create group for points and labels
      gPointsAreas = svg.append("g");
      gLabels = svg.append("g");
      gPoints = svg.append("g");

      // Create sector labels
      svg.selectAll(".sector").data(sectors).enter().call(sectorLabel);

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
      .on("click", pointClick)
      .on("mouseover", pointOver)
      .on("mouseout", pointOut)
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
      .end()
      .then(showLabels);

    var delaunay = d3.Delaunay.from(
      data[quarter],
      (d) => x(d.sales),
      (d) => y(d.cost)
    );

    var voronoi = delaunay.voronoi([
      margin.left,
      margin.top,
      width - margin.right,
      height - margin.bottom,
    ]);

    var cells = data[quarter].map((d, i) => [d, voronoi.cellPolygon(i)]);

    // // Show voronoi cells and centroid angle
    // gPointsAreas.select("path").remove();
    // gPointsAreas
    //   .append("path")
    //   .attr("fill", "#dfc")
    //   .attr("stroke", "#ccc")
    //   .attr("d", voronoi.render());

    // gPointsAreas.select("g").remove();
    // gPointsAreas
    //   .append("g")
    //   .attr("stroke", "orange")
    //   .selectAll("path")
    //   .data(cells)
    //   .join("path")
    //   .attr(
    //     "d",
    //     ([d, cell]) => `M${d3.polygonCentroid(cell)}L${x(d.sales)},${y(d.cost)}`
    //   );

    // Add labels based on Voronoi cells
    gLabels
      .selectAll("text")
      .data(cells, (d) => d[0].id)
      .join("text")
      .attr("class", "label")
      .attr("opacity", 0)
      .each(function (d) {
        // Orient label based on direction from point to ceneter of the Voronoi cell
        const px = x(d[0].sales);
        const py = y(d[0].cost);
        const [cx, cy] = d3.polygonCentroid(d[1]);

        var angle = (Math.atan2(cy - py, cx - px) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;

        d3.select(this).call(
          angle >= 0 && angle < 90
            ? orientLabel.topRight
            : angle >= 90 && angle < 180
            ? orientLabel.bottomRight
            : angle >= 180 && angle < 270
            ? orientLabel.bottomLeft
            : orientLabel.topLeft
        );
      })
      .attr("transform", (d) => `translate(${x(d[0].sales)},${y(d[0].cost)})`)
      .attr(
        "display",
        ([, cell]) => (-d3.polygonArea(cell) > 2000 ? null : "none") // Hide labels for small cells
      )
      .text((d) => d[0].name);

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
      .call((g) =>
        g
          .append("text")
          .attr("class", "axis-label")
          .attr("x", 0)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .text((d) => digitsFormat(d))
          .on("mouseover", meanXOver)
          .on("mouseout", meanOut)
      )
      .merge(meanX)
      .transition()
      .duration(animationTime)
      .attr("transform", (d) => `translate(${x(d)}, ${margin.top})`)
      .attr("opacity", 1)
      .select("text")
      .delay(animationTime)
      .text((d) => digitsFormat(d));

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
      .call((g) =>
        g
          .append("text")
          .attr("class", "axis-label")
          .attr("x", width - margin.left - margin.right - 10)
          .attr("y", 4)
          .attr("text-anchor", "end")
          .text((d) => digitsFormat(d))
          .on("mouseover", meanYOver)
          .on("mouseout", meanOut)
      )
      .merge(meanY)
      .transition()
      .duration(animationTime)
      .attr("transform", (d) => `translate(${margin.left}, ${y(d)})`)
      .attr("opacity", 1)
      .select("text")
      .delay(animationTime)
      .text((d) => digitsFormat(d));
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

  // Axes helpers
  const xAxis = (g, ticks) =>
    g.call(
      d3
        .axisBottom(x)
        .ticks(ticks, ",.0f")
        .tickSize(0, 0)
        .tickPadding(10)
        .tickFormat((d) => digitsFormat(d))
    );

  const yAxis = (g, ticks) =>
    g.call(
      d3
        .axisLeft(y)
        .ticks(ticks)
        .tickSize(0, 0)
        .tickPadding(10)
        .tickFormat((d) => (digitsFormat(d) === "0" ? "" : digitsFormat(d)))
    );

  // Grid helpers
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

  // Axis labels helpers
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

  // Sector label helper
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

  // Label orientaion helper
  const orientLabel = {
    topRight: (text) =>
      text.attr("text-anchor", "start").attr("x", 6).attr("y", -6),
    bottomRight: (text) =>
      text.attr("text-anchor", "start").attr("x", 6).attr("y", 12),
    bottomLeft: (text) =>
      text.attr("text-anchor", "end").attr("x", -6).attr("y", 12),
    topLeft: (text) =>
      text.attr("text-anchor", "end").attr("x", -6).attr("y", -6),
  };

  // Event handlers
  function pointClick(d) {
    var point = d3.select(this),
      position = "translate(" + x(d.sales) + "," + y(d.cost) + ")";

    if (point.classed("point_selected"))
      point.attr("transform", position).attr("class", "point");
    else
      point
        .attr("transform", position + "scale(2)")
        .attr("class", "point point_selected");
  }

  function pointOver(d) {
    tooltip.attr(
      "style",
      `left: ${x(d.sales)}px; top: ${y(d.cost)}px; opacity: 1`
    );

    tooltipTitle.text(d.name);

    tooltipValue.html(`<dl class="props">
      <dt class="props__title">Стоимость продажи</dt><dd class="props__value">${digitsFormat(
        d.cost - margin.right
      )} ₽</dd>
      <dt class="props__title">Количество продаж</dt><dd class="props__value">${
        d.sales
      } шт.</dd>
      </div>`);
  }

  function pointOut(d) {
    tooltip.attr("style", "opacity: 0");
  }

  function meanXOver(d) {
    tooltip
      .attr("class", "tooltip tooltip_compact")
      .attr("style", `left: ${x(d) + 15}px; top: ${margin.top}px; opacity: 1`);

    tooltipValue.text("Средняя стоимость продажи");
  }

  function meanYOver(d) {
    tooltip
      .attr("class", "tooltip tooltip_compact")
      .attr(
        "style",
        `left: auto; right: ${margin.right + 10}px; top: ${
          y(d) + 5
        }px; opacity: 1`
      );

    tooltipValue.text("Среднее количество продаж");
  }

  function meanOut(d) {
    tooltip.attr("class", "tooltip").attr("style", "opacity: 0");
  }

  // Calculate good ammount of ticks and endpoint for a given value
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

  // Show labels that do not overlap with others
  function showLabels() {
    let labels = gLabels.selectAll("text:not([display=none])");
    let points = gPoints.selectAll("path");
    let labelsToShow = [];

    // gLabels.selectAll("rect").remove(); // Debug

    labels.each(function () {
      let label = d3.select(this);
      let labelBBox = getBBox(this);
      let overlap = false;

      // // Debug
      // const bbRect = gLabels
      //   .append("rect")
      //   .attr("x", labelBBox.x - labelPadding)
      //   .attr("y", labelBBox.y - labelPadding)
      //   .attr("width", labelBBox.width + labelPadding * 2)
      //   .attr("height", labelBBox.height + labelPadding * 2)
      //   .attr("fill", "black")
      //   .attr("opacity", 0.1);

      // Check if label overlaps with other points
      points.each(function (d) {
        if (
          label.datum()[0].id !== d.id &&
          getRectsOverlap(labelBBox, getBBox(this))
        ) {
          overlap = true;
        }
      });

      // Check if label overlaps with labels we want to show
      if (!overlap) {
        labelsToShow.forEach(function (l) {
          if (getRectsOverlap(labelBBox, getBBox(l))) overlap = true;
        });
      }

      // Check if label overlaps with y-axis
      if (!overlap) {
        if (getRectsOverlap(labelBBox, getBBox(gY.node()))) overlap = true;
      }

      // Add label to array we want to show
      if (!overlap) {
        labelsToShow.push(this);
      }
    });

    // Show labels
    d3.selectAll(labelsToShow)
      .transition()
      .duration(animationTime / 2)
      .attr("opacity", "1");
  }

  function getRectsOverlap(l, r) {
    l.left = l.x - labelPadding;
    l.right = l.x + l.width + labelPadding * 2;
    l.top = l.y - labelPadding;
    l.bottom = l.y + l.height + labelPadding * 2;

    r.left = r.x;
    r.right = r.x + r.width;
    r.top = r.y;
    r.bottom = r.y + r.height;

    return !(
      l.left >= r.right ||
      l.top >= r.bottom ||
      l.right <= r.left ||
      l.bottom <= r.top
    );
  }

  /**
   * @param {SVGElement} element - Element to get the bounding box for
   * @param {boolean} [withoutTransforms=false] - If true, transforms will not be calculated
   * @param {SVGElement} [toElement] - Element to calculate bounding box relative to
   * @returns {SVGRect} Coordinates and dimensions of the real bounding box
   */
  function getBBox(element, withoutTransforms, toElement) {
    var svg = element.ownerSVGElement;

    if (!svg) {
      return {
        x: 0,
        y: 0,
        cx: 0,
        cy: 0,
        width: 0,
        height: 0,
      };
    }

    var r = element.getBBox();

    if (withoutTransforms) {
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
      };
    }

    var p = svg.createSVGPoint();

    var matrix = (toElement || svg)
      .getScreenCTM()
      .inverse()
      .multiply(element.getScreenCTM());

    p.x = r.x;
    p.y = r.y;
    var a = p.matrixTransform(matrix);

    p.x = r.x + r.width;
    p.y = r.y;
    var b = p.matrixTransform(matrix);

    p.x = r.x + r.width;
    p.y = r.y + r.height;
    var c = p.matrixTransform(matrix);

    p.x = r.x;
    p.y = r.y + r.height;
    var d = p.matrixTransform(matrix);

    var minX = Math.min(a.x, b.x, c.x, d.x);
    var maxX = Math.max(a.x, b.x, c.x, d.x);
    var minY = Math.min(a.y, b.y, c.y, d.y);
    var maxY = Math.max(a.y, b.y, c.y, d.y);

    var width = maxX - minX;
    var height = maxY - minY;

    return {
      x: minX,
      y: minY,
      width: width,
      height: height,
      cx: minX + width / 2,
      cy: minY + height / 2,
    };
  }

  // Lifecycle methods
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

  // Initial setters and getters
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
