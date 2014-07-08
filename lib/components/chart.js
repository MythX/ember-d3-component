(function() {

Ember.Chart.ChartComponent = Ember.Component.extend({
  tagName: 'svg',
  margin: {
    top: 35,
    right: 35,
    bottom: 35,
    left: 35
  },

  didInsertElement: function() {
    this._super();
    this.draw();
  },

  draw: function() {
    var width     = this.width  = this.get('width') - this.margin.left - this.margin.right,
        height    = this.height = this.get('height') - this.margin.top - this.margin.bottom,
        params    = this.params = this.get('data');

    var charts        = params.charts;
    var data          = [];
    var colorLines    = [];
    var colorBars     = [];
    var animatedLines = [];
    var colorBar      = [];
    var types         = [];
    var formatedDatas = [];
    var formatXAxis   = params.formatXAxis || 'numeric';
    var legendY       = params.legendY || '';

    charts.forEach(function(dataset) {
      data.push(dataset.data);
      types.push(dataset.type);
      if (dataset.type === 'line') {
        colorLines.push(dataset.color);
        if(dataset.animation !== undefined && dataset.animation === true) {
          animatedLines.push('true');
        } else {
          animatedLines.push('false');
        }
      } else if(dataset.type === 'bar') {
        if(dataset.color !== undefined) {
          colorBars.push(dataset.color);
        } else {
          colorBar = dataset.colors;
        }
      }
    });

    data.forEach(function(d) {
      formatedDatas.push(this.formatData(d, formatXAxis, 'DD/MM'));
    }, this);

    // Format barchat data
    var barChartData = this.barChartData(formatedDatas, types);

    var x    = this.x = this.createX(formatedDatas[0], formatXAxis, false, barChartData);
    
    // Search max Y
    var maxY = this.searchMaxY(formatedDatas);
    var y    = this.y = this.createY(maxY);

    // Draw chart
    this.chart = d3.select('#'+this.get('elementId'))
      .attr('id', 'chart')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('svg:g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.drawXAxis(x);
    this.drawYAxis(y, legendY);

    // Draw lines and bar
    if (barChartData.length > 1)
      this.drawBarChart(height, x, y, barChartData, colorBars);
    else if (barChartData.length === 1) {
      if(colorBars.length === 0) {
        this.drawBarChart(height, x, y, barChartData, colorBar, true);
      } else {
        this.drawBarChart(height, x, y, barChartData, colorBars, false);
      }
    }

    for(var i = 0, j = 0; i < formatedDatas.length; i++) {
      if (types[i] === 'line') {
        var line = this.drawLine(x, y, formatedDatas[i], false);
        var path = this.drawLineOnSvg(line, formatedDatas[i], colorLines[j]);
        if(animatedLines[j] === 'true') {
          this.lineAnimation(path);
        }
        this.drawPoints(formatedDatas[i], x, y, false);
        j++;
      }
    }
  },

  createX: function(data, type, origin, barChartData) {
    var x = null;
    if(type === 'date') {
      if(origin) {
        x = d3.scale.ordinal().rangePoints([0, this.width]).domain(data.map(function(d) { return d.keyD; }));
      } else {
        x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
      }
    } else if(type === 'numeric') {
      if(barChartData.length) {
        x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
      } else {
        x = d3.scale.linear().range([0, this.width]).domain([0, data.length - 1]);
      }
    }

    return x;
  },

  createY: function(max) {
    var percentage = (5/100) * this.height;
    return d3.scale.linear()
      .range([this.height, 0])
      .domain([0, (this.get("yMax")) ? this.get("yMax") : max]);
  },

  drawLine: function(x, y, data, origin) {
    var line = d3.svg.line().y(function(d) { return y(d.valD); });
    if(!origin) {
      line.x(function(d) { return x(d.keyD) + (x.rangeBand() / 2); });
    } else {
      line.x(function(d) { return x(d.keyD); });
    }
    return line;
  },

  drawLineOnSvg: function(line, formatedData, color) {
    var path = this.chart.append('svg:path')
      .attr('class', 'line')
      .attr('clip-path', 'url(#clip)')
      .attr('stroke', color)
      .attr('d', line(formatedData));

    return path;
  },

  lineAnimation: function(path) {
    var totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength+","+totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1000)
      .ease("linear-in-out")
      .attr("stroke-dashoffset", 0);
  },

  drawPoints: function(data, x, y, origin) {
    var points = this.chart.selectAll('.points')
      .data(data)
      .enter().append('svg:circle')
      .attr('data-toggle', 'tooltip')
      .attr('title', function(d) { return d.keyD + " </br>" + d.valD; })
      .attr("data-html", true)
      .attr('stroke', 'black')
      .attr('fill', 'black')
      .attr('cx', function(d) { return x(d.keyD) + (!origin ? (x.rangeBand() / 2) : 0); })
      .attr('cy', function(d) { return y(d.valD); })
      .attr('r', 3);
    return points;
    },

  drawBarChart: function(height, x, y, data, colors, multicolor) {
    var x1 = d3.scale.ordinal();
    var bars = data.map(function(d, i) { return  'bar'+i ; });
    x1.domain(bars).rangeRoundBands([0, x.rangeBand()]);

    var days = data[0].map(function(day) {
      return day.keyD;
    });

    var getValueForIndex = function(index, chart) {
      return chart[index].valD;
    };

    var values = days.map(function(day, i) {
      return {
        keyD: day,
        valD: data.map(getValueForIndex.bind(this, i))
      };
    });

    var bar = this.chart.selectAll(".bar")
      .data(values)
      .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x(d.keyD) + ",0)"; });
   
    if (data.length > 1 || !multicolor) {
      bar.selectAll("rect")
        .data(function (d) { return d.valD; })
        .enter().append("rect")
          .attr("width", x1.rangeBand())
          .attr("x", function(d, i) { return x1("bar"+i); })
          .attr("y", function(d) { return y(d); })
          .attr("height", function(d) { return height - y(d); })
          .attr("fill", function(d, i) { return colors[i]; });
    } else {
      var j = -1;
      bar.selectAll("rect")
        .data(function (d) { return d.valD; })
        .enter().append("rect")
          .attr("width", x1.rangeBand())
          .attr("x", function(d, i) { return x1("bar"+i); })
          .attr("y", function(d) { return y(d); })
          .attr("height", function(d) { return height - y(d); })
          .attr("fill", function(d, i) { j++; return colors[j]; });
    }
  },

  drawXAxis: function(x, legendX, height) {
    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    this.chart.append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,'+this.height+')')
      .call(xAxis);

    return xAxis;
  },

  drawYAxis: function(y, legendY) {
    var yAxis = d3.svg.axis().scale(y).orient("left");

    this.chart.append('svg:g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append("text")
      .attr('y', -20)
      .attr('x', -20)
      .attr("dy", ".71em")
      .text(legendY);

    return yAxis;
  },

  searchMaxY: function(datas) {
    var maxY = 0;
    datas.forEach(function(data) {
      data.forEach(function(d) {
        if(d.valD > maxY)
          maxY = d.valD;
      });
    });
    return maxY;
  },

  barChartData: function(data, type) {
    var result = [];

    for(var i = 0; i < type.length; i++) {
      if(type[i] === "bar") {
        result.push(data[i]);
      }
    }
    return result;
  },

  formatData: function(data, type, format) {
    var formatedData = [];

    if(type === 'date') {
      data.forEach(function(date) {
        var formatDay = moment(date.keyD).format(format);
        var day = Ember.Object.create({
          keyD: formatDay,
          valD: date.valD
        });
        formatedData.push(day);
      });
    } else {
      formatedData = data;
    }
    return formatedData;
  },

});

Ember.Handlebars.helper('draw-chart', Ember.Chart.ChartComponent);
  
}());