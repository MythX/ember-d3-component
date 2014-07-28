(function() {

Ember.Chart.ChartComponent = Ember.Component.extend({
  tagName: 'div',
  classNames: ['chart'],
  margin: {
    top: 35,
    right: 30,
    bottom: 40,
    left: 35
  },

  didInsertElement: function() {
    this._super();
    this.initialize();
    this.draw();
  },

  initialize: function() {
    var width;
    this.containerSelector = '#'+this.get('elementId') + '.chart';
    if(this.get('width') === undefined) {
      width = parseInt(d3.select(this.containerSelector).style('width'), 10);
    } else {
      width = this.get('width');
    }
    width     = this.width  =  width - this.margin.left - this.margin.right;
    var height    = this.height = this.get('height') - this.margin.top - this.margin.bottom;

    this.chart = d3.select(this.containerSelector)
      .append('svg:svg')
      .style('width', this.width + this.margin.left + this.margin.right + 'px')
      .style('height', this.height + this.margin.top + this.margin.bottom + 'px')
      .append('svg:g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    
    this.defs = this.chart.append('defs');
  },

  draw: function(redraw) {
    var params    = this.params = this.get('data');

    var charts        = params.charts;
    var data          = [];
    var colorBars     = [];
    var colorBar      = [];
    var types         = [];
    var formatedDatas = [];
    var barChartAnimation = false;
    var formatXAxis   = params.formatXAxis || 'numeric';
    var yAxis         = params.yAxis;
    var xAxis         = params.xAxis;
    var yAxisArray    = [];
    var yAxisBar      = '';

    var lineCharts    = [];
    var areaCharts    = [];
    var barChart      = [];
    
    // Search YAxis
    yAxis.forEach(function(axis) {
      yAxisArray.push({
        name: axis.name,
        color: axis.color,
        legend: axis.legend,
        max: 0,
        y: '',
        orient: axis.position,
        data: []
      });
    });

    charts.forEach(function(dataset) {
      data.push(dataset.data);
      types.push(dataset.type);
      if (dataset.yAxis !== undefined) {
        yAxisArray.forEach(function(yAxis) {
          if(yAxis.name === dataset.yAxis) {
            yAxis.data.push(dataset.data);
          }
        });
      } else {
        yAxisArray[0].data.push(dataset.data);
      }

      var formatedData = this.formatData(dataset.data, xAxis);
      var interpolate = dataset.interpolate ? dataset.interpolate : '';
      
      if (dataset.type === 'line') {

        lineCharts.push(Ember.Object.create({
          data: formatedData,
          color: dataset.color,
          gradient: dataset.gradient,
          animation: dataset.animation && !redraw,
          points: true,
          interpolate: interpolate,
          yAxis: dataset.yAxis
        }));
      } else if(dataset.type === 'bar') {
        yAxisBar = dataset.yAxis;
        if(dataset.color !== undefined) {
          colorBars.push(dataset.color);
        } else {
          colorBar = dataset.colors;
        }
        if(dataset.animation !== undefined && dataset.animation === true) {
          barChartAnimation = true;
        }
      } else if(dataset.type === 'area') {
        areaCharts.push(Ember.Object.create({
          data: formatedData,
          color: dataset.color,
          gradient: dataset.gradient,
          interpolate: interpolate,
          yAxis: dataset.yAxis
        }));
      }
    }, this);

    data.forEach(function(d) {
      formatedDatas.push(this.formatData(d, xAxis));
    }, this);

    // Format barchat data
    var barChartData = this.barChartData(formatedDatas, types);
    var x    = this.x = this.createX(formatedDatas[0], xAxis.format, xAxis.origin, barChartData);
    


    // Create YAxis
    yAxisArray.forEach(function (yAxis) {
      yAxis.max = this.searchMaxY(yAxis.data);
      yAxis.y = this.createY(yAxis.max);
      this.drawYAxis(yAxis.y, yAxis.legend, yAxis.orient, yAxis.color);
    }.bind(this));

    this.drawXAxis(x, xAxis.rotateLegend);
    
    // Draw lines and bar
    if (barChartData.length > 1)
      this.drawBarChart(this.height, x, this.searchYAxis(yAxisBar, yAxisArray), barChartData, colorBars, false, barChartAnimation);
    else if (barChartData.length === 1) {
      if(colorBars.length === 0) {
        this.drawBarChart(this.height, x, this.searchYAxis(yAxisBar, yAxisArray), barChartData, colorBar, true, barChartAnimation);
      } else {
        this.drawBarChart(this.height, x, this.searchYAxis(yAxisBar, yAxisArray), barChartData, colorBars, false, barChartAnimation);
      }
    }

    lineCharts.forEach(function(l) {
      
      var y = this.searchYAxis(l.yAxis, yAxisArray);
      
      if (l.gradient) {
        this.defs.append("linearGradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("id", l.yAxis + "-gradient")
          .attr("x1", 0).attr("y1", y(0))
          .attr("x2", 0).attr("y2", y(l.gradient.max))
        .selectAll("stop")
          .data(l.gradient.stops)
        .enter().append("stop")
          .attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });
      }
      
      var line = this.drawLine(x, y, l.data, l.interpolate, xAxis.origin);
      var path = this.drawLineOnSvg(line, l.data, l.color, l.gradient ? l.yAxis + "-gradient" : null);
      this.drawPoints(l.data, x, y, xAxis.origin, l.color);

      if(l.animation === true) {
        this.lineAnimation(path);
      }
    }, this);

    areaCharts.forEach(function(a) {
      
      var y = this.searchYAxis(a.yAxis, yAxisArray);
      
      if (a.gradient) {
        this.defs.append("linearGradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("id", a.yAxis + "-gradient")
          .attr("x1", 0).attr("y1", y(0))
          .attr("x2", 0).attr("y2", y(a.gradient.max))
        .selectAll("stop")
          .data(a.gradient.stops)
        .enter().append("stop")
          .attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });
      }
      
      var area = this.drawArea(x, y);
      this.drawAreaOnSvg(area, a.data, a.color, a.gradient ? a.yAxis + "-gradient" : null);
      var line = this.drawLine(x, y, a.data, a.interpolate, xAxis.origin);
      this.drawLineOnSvg(line, a.data, a.color, a.gradient ? a.yAxis + "-gradient" : null);
    }, this);

    d3.select(window).on('resize.'+this.containerSelector, function() {
      Ember.run.debounce(this, function() {
        var newWidth = parseInt(d3.select(this.containerSelector).style('width'), 10) - this.margin.left - this.margin.right;
        if(newWidth != this.width) {
          this.width = newWidth;

          d3.select(d3.select(this.containerSelector + ' > svg')[0][0])
            .style('width', this.width + this.margin.left + this.margin.right + 'px');

          this.clearCharts();
          this.draw(true);
        }
      }, 150);
    }.bind(this));
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
    return d3.scale.linear()
      .range([this.height, 0])
      .domain([0, (this.get("yMax")) ? this.get("yMax") : max]);
  },

  drawLine: function(x, y, data, interpolate, origin) {
    var line = d3.svg.line().interpolate(interpolate).y(function(d) { return y(d.valD); });
    if(!origin) {
      line.x(function(d) { return x(d.keyD) + (x.rangeBand() / 2); });
    } else {
      line.x(function(d) { return x(d.keyD); });
    }
    
    return line;
  },

  drawLineOnSvg: function(line, formatedData, color, gradientId) {
    var path = this.chart.append('svg:path')
      .attr('class', 'line')
      .attr('clip-path', 'url(#clip)')
      .attr('d', line(formatedData));
    
    if (gradientId) {
      path.attr('stroke', 'url(#'+gradientId+')');
    } else {
      path.attr('stroke', color);
    }

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

  drawPoints: function(data, x, y, origin, color) {
    var points = this.chart.selectAll('.points')
      .data(data)
      .enter().append('svg:circle')
      .attr('class', 'circle')
      .attr('data-toggle', 'tooltip')
      .attr('title', function(d) { return d.keyD + " </br>" + d.valD; })
      .attr("data-html", true)
      .attr('stroke', color)
      .attr('cx', function(d) { return x(d.keyD) + (!origin ? (x.rangeBand() / 2) : 0); })
      .attr('cy', function(d) { return y(d.valD); })
      .attr('r', 3);
    return points;
  },

  drawBarChart: function(height, x, y, data, colors, multicolor, animation) {
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
          .attr('class', 'bar')
          .attr("width", x1.rangeBand())
          .attr("x", function(d, i) { return x1("bar"+i); })
          .attr("y", this.height)
          .attr("height", 0)
          .attr("fill", function(d, i) { return colors[i]; });
    } else {
      var j = -1;
      bar.selectAll("rect")
        .data(function (d) { return d.valD; })
        .enter().append("rect")
          .attr("width", x1.rangeBand())
          .attr("x", function(d, i) { return x1("bar"+i); })
          .attr("y", this.height)
          .attr("height", 0)
          .attr("fill", function(d, i) { j++; return colors[j]; });
    }

    if(animation === true) {
     bar.selectAll("rect")
        .data(function (d) { return d.valD; })
        .transition()
        .duration(1000)
        .attr('y', function(d) { return y(d); })
        .attr('height', function(d) { return height - y(d); });
    } else {
      bar.selectAll("rect")
        .data(function (d) { return d.valD; })
        .attr("y", function(d) { return y(d); })
        .attr("height", function(d) { return height - y(d); });
    }
  },

  drawArea: function(x, y) {
    var area = d3.svg.area()
      .interpolate('monotone')
      .x(function(d) { return x(d.keyD) + (x.rangeBand() / 2); })
      .y0(this.height)
      .y1(function(d) { return y(d.valD); });
    
    return area;
  },

  drawAreaOnSvg: function(area, formatedData, color, gradientId) {
    var path = this.chart.append('svg:path')
      .attr('class', 'area')
      .attr('d', area(formatedData));

    if (gradientId) {
      path.attr('fill', 'url(#'+gradientId+')');
    } else {
      path.attr('fill', color);
    }
    
    return path;
  },

  drawXAxis: function(x, rotate) {
    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var axis = this.chart.append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,'+this.height+')')
      .call(xAxis);
      
    if (rotate === true) {
      axis.selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", function(d) {
        return "rotate(-65)";
      });
    }

    return xAxis;
  },

  drawYAxis: function(y, legendY, orient, color) {
    var yAxis = d3.svg.axis().scale(y).orient(orient);
 
    if (orient === 'left') {
      this.chart.append('svg:g')
        .attr('class', 'y axis')
        .attr('fill', color)
        .call(yAxis)
        .append("text")
        .attr('y', -20)
        .attr('x', -20)
        .attr("dy", ".71em")
        .text(legendY);
    } else {
      this.chart.append('svg:g')
        .attr('class', 'y axis')
        .attr('fill', color)
        .attr('transform', 'translate('+(this.width)  + ',0)')
        .call(yAxis)
        .append("text")
        .attr('y', -20)
        .attr('x', 20)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(legendY);
    }

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

  searchYAxis: function(name, yAxisArray) {
    var i = 0;

    while (i < yAxisArray.length && yAxisArray[i  ].name !== name) {
      i++;
    }

    return i < yAxisArray.length ? yAxisArray[i].y : null;
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

  formatData: function(data, xAxis) {
    var formatedData = [];

    if(xAxis.format === 'date') {
      if(xAxis.dateFormat !== undefined) {
        data.forEach(function(date) {
          var formatDay = moment(date.keyD).format(xAxis.dateFormat);
          var day = Ember.Object.create({
            keyD: formatDay,
            valD: date.valD
          });
          formatedData.push(day);
        });
      }
    } else {
      formatedData = data;
    }
    return formatedData;
  },

  clearCharts: function() {
    this.chart.selectAll('.x').remove();
    this.chart.selectAll('.y').remove();
    this.chart.selectAll('circle').remove();
    this.chart.selectAll('.line').remove();
    this.chart.selectAll('.area').remove();
    this.chart.selectAll('.bar').remove();
    this.chart.selectAll('.g').remove();
  },

  updateCharts: function() {
    this.clearCharts();
    this.draw();
  }.observes('data')

});

Ember.Handlebars.helper('draw-chart', Ember.Chart.ChartComponent);
  
}());