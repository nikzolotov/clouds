// TODO
// Лейблы справа — как-то втянуть в график
// Добавить связь лейбла с точкой, чтобы сделать padding

const width = 1100,
  height = 440,
  margin = {
    top: 36,
    right: 20,
    bottom: 46,
    left: 50,
  },
  labelPadding = 1,
  animationTime = 1000;

// Данные о кластерах: цвета точек, облаков, символы
// Тут цвета для градиентов
// const sectors = [
// 	{name: 'A', color: '#96BA5A', bg: '#FAFFED', size: 32, symbol: d3.symbolCross, top: height-margin.bottom-15, left: width-margin.right-15},
// 	{name: 'B', color: '#16AC82', bg: '#EFFFF4', size: 24, symbol: d3.symbolTriangle, top: margin.top+15, left: width-margin.right-15},
// 	{name: 'C', color: '#8164D9', bg: '#F1F2FF', size: 24, symbol: d3.symbolCircle, top: margin.top+15, left: margin.left+15},
// 	{name: 'D', color: '#3988E3', bg: '#EFF9FF', size: 24, symbol: d3.symbolSquare, top: height-margin.bottom-15, left: margin.left+15}];

// Если отказаться от градиентов — тут простые цвета
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

const svg = d3
  .select("#graph-clouds")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

var gx, gy, ggx, ggy, gclouds, gpoints, glabels, gmean;

// Scales
var x = d3.scaleLinear().range([margin.left, width - margin.right]),
  y = d3.scaleLinear().range([height - margin.bottom, margin.top]),
  color = d3
    .scaleOrdinal(sectors.map((d) => d.color))
    .domain(sectors.map((d, i) => i)),
  shape = d3
    .scaleOrdinal(sectors.map((d) => d3.symbol().size(d.size).type(d.symbol)()))
    .domain(sectors.map((d, i) => i));

var tooltip = d3.select(".tooltip");

Promise.all([
  d3.csv("data/sales-q1.csv", (d) => parseData(d)),
  d3.csv("data/sales-q2.csv", (d) => parseData(d)),
  d3.csv("data/sales-q3.csv", (d) => parseData(d)),
])
  .then(function (data) {
    const quarters = d3
      .select("#quarters")
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

    // TODO Переписать на нормальную форму с выбранным значением
    d3.select(".tabs__link").attr("class", "tabs__link tabs__link_selected");

    d3.selectAll(".tabs__link").on("click", function (d, i) {
      var thisLink = d3.select(this);

      if (thisLink.attr("class") != "tabs__link tabs__link_selected") {
        d3.selectAll(".tabs__link").attr("class", "tabs__link");
        thisLink.attr("class", "tabs__link tabs__link_selected");

        update(data[i]);
      }
      d3.event.preventDefault();
    });

    // Фильтры для градиентов облаков
    //svg.html(filters);

    // Группа для облаков
    gclouds = svg.append("g");

    // Группы для осей и сетки
    gx = svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")");
    gy = svg.append("g").attr("transform", "translate(" + margin.left + ",0)");

    ggx = svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .attr("stroke-opacity", 0.05);
    ggy = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .attr("stroke-opacity", 0.05);

    // Подписи осей и белая подложка для анимации
    svg
      .append("rect")
      .attr("width", 60)
      .attr("height", 18)
      .attr("fill", "#FFF");
    svg.call(xAxisLabel);
    svg.call(yAxisLabel);

    // Подписи секторов
    svg.selectAll(".sector").data(sectors).enter().call(sectorLabel);

    // Группа для средних значених
    gmean = svg.append("g");

    // Группы для точек и подписей
    glabels = svg.append("g");
    gpoints = svg.append("g");

    update(data[0]);
  })
  .catch(function (err) {
    console.log(err);
  });

function update(data) {
  var xTicks = getSmartTicks(d3.max(data, (d) => d.sales)),
    yTicks = getSmartTicks(d3.max(data, (d) => d.cost));

  x.domain([0, xTicks.endPoint]);
  y.domain([0, yTicks.endPoint]);

  // Перерисовываем облака
  sectors.forEach(function (g, i) {
    poly = gclouds
      .selectAll("#poly-" + i)
      .data([
        d3.polygonHull(
          data.filter((d) => d.sector == i).map((d) => [x(d.sales), y(d.cost)])
        ),
      ]);

    poly
      .enter()
      .append("polygon")
      .attr("id", "poly-" + i)
      .attr("fill", g.bg)
      .attr("stroke", g.bg)
      .attr("stroke-width", 10)
      .attr("stroke-linejoin", "round")
      .merge(poly)
      .attr("opacity", 0)
      .transition()
      .duration(animationTime)
      .attr("points", (d) => d.map((d) => [d[0], d[1]].join(",")).join(" "))
      .transition()
      .duration(500)
      .attr("opacity", 1);

    // Внутренние градиенты у облаков
    // poly.enter()
    // 	.append("use")
    // 		.attr("filter", "url(#filter-" + i + ")")
    // 		.attr("xlink:href", "#poly-" + i)
  });

  // Двигаем оси
  gx.transition().duration(animationTime).call(xAxis, xTicks.count);
  gy.transition().duration(animationTime).call(yAxis, yTicks.count);
  ggx.transition().duration(animationTime).call(xGrid, xTicks.count);
  ggy.transition().duration(animationTime).call(yGrid, yTicks.count);

  // Точки полетели
  var points = gpoints.selectAll("path").data(data);

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
    // .attr("transform", d => `translate(${x(d.sales)},${y(d.cost)})`)
    .attr("transform", function (d) {
      var s = "";
      if (d3.select(this).classed("point_selected")) s = " scale(2)";
      return "translate(" + x(d.sales) + "," + y(d.cost) + ")" + s;
    })
    .attr("fill", (d) => color(d.sector))
    .attr("opacity", 1)
    .end()
    .then(showLabels);

  // Добавляем подписи
  var labels = glabels.selectAll(".label").data(data);

  labels
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("dy", "0.3em")
    .attr("x", (d) => x(d.sales) + 7)
    .attr("y", (d) => y(d.cost))
    .attr("opacity", 0)
    .text((d) => d.name)
    .merge(labels)
    .attr("opacity", 0)
    .transition()
    .duration(animationTime)
    .attr("x", (d) => x(d.sales) + 7)
    .attr("y", (d) => y(d.cost));

  // Двигаем средние значения
  var meanX = gmean.selectAll(".mean-x").data([d3.mean(data, (d) => d.sales)]),
    meanY = gmean.selectAll(".mean-y").data([d3.mean(data, (d) => d.cost)]);

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

xAxis = (g, ticks) =>
  g.call(
    d3
      .axisBottom(x)
      .ticks(ticks)
      .tickSize(0, 0)
      .tickPadding(10)
      .tickFormat(formatXTick)
  );

yAxis = (g, ticks) =>
  g.call(
    d3
      .axisLeft(y)
      .ticks(ticks)
      .tickSize(0, 0)
      .tickPadding(10)
      .tickFormat(formatYTick)
  );

xAxisLabel = (g) =>
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

yAxisLabel = (g) =>
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

sectorLabel = (g) =>
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

xGrid = (g, ticks) =>
  g.call(
    d3
      .axisBottom(x)
      .ticks(ticks)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat("")
  );

yGrid = (g, ticks) =>
  g.call(
    d3
      .axisLeft(y)
      .ticks(ticks)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat("")
  );

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
  tooltip
    .attr("style", `left: ${x(d.sales)}px; top: ${y(d.cost)}px; opacity: 1`)
    .select(".tooltip__title")
    .text(d.name);

  tooltip.select(".tooltip__value").html(`<dl class="props">
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

  tooltip.select(".tooltip__value").text("Средняя стоимость продажи");
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

  tooltip.select(".tooltip__value").text("Среднее количество продаж");
}

function meanOut(d) {
  tooltip.attr("class", "tooltip").attr("style", "opacity: 0");
}

function parseData(d) {
  return {
    keyEvent: d.keyEvent,
    name: d.name,
    sales: +d.sales,
    cost: parseFloat(d.cost),
    sector: +d.sector,
  };
}

var locale = d3.formatLocale({
  decimal: ",",
  thousands: " ",
  grouping: [3],
});

var digitsFormat = locale.format(",.0f");

function formatXTick(d) {
  return digitsFormat(d);
}

function formatYTick(d) {
  const s = digitsFormat(d);
  return s === "0" ? "" : s;
}

function showLabels() {
  var allPoints = d3.selectAll(".point"),
    allLabels = d3.selectAll(".label"),
    visibleLabels = d3.selectAll(".label_visible");

  allLabels.attr("class", "label").attr("opacity", "0");

  allLabels.each(function () {
    var thisLabel = d3.select(this),
      thisLabelBBox = this.getBBox(),
      isOverlap = false;

    allPoints.each(function () {
      if (
        getRectsOverlap(thisLabelBBox, getBBox(this)) &&
        !d3.select(this).classed("point_selected")
      )
        isOverlap = true;
    });

    visibleLabels.each(function () {
      if (getRectsOverlap(thisLabelBBox, this.getBBox())) isOverlap = true;
    });

    if (!isOverlap) {
      thisLabel
        .attr("class", "label label_visible")
        .transition()
        .duration(500)
        .attr("opacity", "1");

      visibleLabels = d3.selectAll(".label_visible"); // подумать, как добавлять в выборку, а не заново выбирать
    }
  });
}
function getRectsOverlap(l, r) {
  l.left = l.x - labelPadding;
  l.right = l.x + l.width + labelPadding;
  l.top = l.y - labelPadding;
  l.bottom = l.y + l.height + labelPadding;

  r.left = r.x - labelPadding;
  r.right = r.x + r.width + labelPadding;
  r.top = r.y - labelPadding;
  r.bottom = r.y + r.height + labelPadding;

  return !(
    l.left >= r.right ||
    l.top >= r.bottom ||
    l.right <= r.left ||
    l.bottom <= r.top
  );
}
function getSmartTicks(val) {
  //base step between nearby two ticks
  var step = Math.pow(10, val.toString().length - 1);

  //modify steps either: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
  if (val / step < 2) {
    step = step / 5;
  } else if (val / step < 5) {
    step = step / 2;
  }

  //add one more step if the last tick value is the same as the max value
  //if you don't want to add, remove "+1"
  var slicesCount = Math.ceil((val + 1) / step);

  return {
    endPoint: slicesCount * step,
    count: Math.min(10, slicesCount), //show max 10 ticks
  };
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
    return { x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0 };
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

var filters = `<defs>
			<filter x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" id="filter-0" filterRes="1">
			<feGaussianBlur stdDeviation="20" in="SourceAlpha" result="shadowBlurInner1"></feGaussianBlur>
			<feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
			<feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
			<feColorMatrix values="0 0 0 0 0.775000547   0 0 0 0 0.903249547   0 0 0 0 0.447253101  0 0 0 1 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
			</filter>
		</defs>
		<filter x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" id="filter-1" filterRes="1">
			<feMorphology radius="20" operator="erode" in="SourceAlpha" result="shadowSpreadInner1"></feMorphology>
			<feGaussianBlur stdDeviation="20" in="shadowSpreadInner1" result="shadowBlurInner1"></feGaussianBlur>
			<feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
			<feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
			<feColorMatrix values="0 0 0 0 0.724057348   0 0 0 0 0.931131114   0 0 0 0 0.784961397  0 0 0 1 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
		</filter>
		<filter x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" id="filter-2" filterRes="1">
			<feMorphology radius="20" operator="erode" in="SourceAlpha" result="shadowSpreadInner1"></feMorphology>
			<feGaussianBlur stdDeviation="20" in="shadowSpreadInner1" result="shadowBlurInner1"></feGaussianBlur>
			<feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
			<feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
			<feColorMatrix values="0 0 0 0 0.710403963   0 0 0 0 0.736260752   0 0 0 0 1  0 0 0 1 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
		</filter>
		<filter x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" id="filter-3" filterRes="1">
			<feMorphology radius="20" operator="erode" in="SourceAlpha" result="shadowSpreadInner1"></feMorphology>
			<feGaussianBlur stdDeviation="20" in="shadowSpreadInner1" result="shadowBlurInner1"></feGaussianBlur>
			<feOffset dx="0" dy="0" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
			<feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
			<feColorMatrix values="0 0 0 0 0.597713415   0 0 0 0 0.859442036   0 0 0 0 1  0 0 0 1 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
		</filter>`;
