// ==========================================================================
// Project:   Ember D3 Component
// Version    v0.0.3
// Copyright: © 2014 Antoine Moser
// License:   MIT (see LICENSE)
// ==========================================================================
(function() {

Ember.Chart = Ember.Namespace.create();
Ember.Chart.VERSION = '0.0.3';

Ember.libraries.register('ember-d3', Ember.Chart.VERSION);

})();

(function() {

  Ember.Chart.BarChartComponent = Ember.Component.extend({
    tagName: 'svg',
    margin: {
      top: 35,
      right: 35,
      bottom: 35,
      left: 35
    },

    didInsertElement: function() {
      this.draw();
    },

    draw: function() {
      var width = this.get('width') - this.margin.left - this.margin.right,
          height = this.get('height') - this.margin.top - this.margin.bottom,
          data = this.get('data');

      var viewXAxis = this.get('xAxis');
      var viewYAxis = this.get('yAxis');
      var formatX = this.get('formatXAxis');
      var legendY = this.get('legendY');

      this.height = height;
      this.width = width;

      var x = this.createX(data);
      var y = this.createY(data);

      /* Create chart */
      this.chart = d3.select('#'+this.get('elementId'))
        .attr('id', 'bar-chart')
        .attr('width', width + this.margin.left + this.margin.right)
        .attr('height', height + this.margin.top + this.margin.bottom)
        .append('svg:g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      this.chart.append('svg:g')
        .attr('class', 'rects');

      this.chart.select('.rects').selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d) { return x(d.keyD); })
        .attr('y', function(d) { return y(d.valD); })
        .attr('width', x.rangeBand())
        .attr('height', function(d) { return height - y(d.valD); })
        .attr('fill', function(d) {
          if(d.colorD === undefined)
            return '#428bca';
          else
            return d.colorD;
        });

      if(viewXAxis) {
        this.drawXAxis(x, data, formatX);
      }

      if(viewYAxis) {
        this.drawYAxis(y, legendY);
      }
    },

    createX: function(data, type) {
      return d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
    },

    createY: function(data) {
      return d3.scale.linear().range([this.height, 0]).domain([0, d3.max(data, function(d) { return d.valD; })]);
    },

    drawXAxis: function(x, data, formatXAxis, legendX, height) {
      var xAxis = d3.svg.axis().scale(x).orient("bottom");

      if(formatXAxis === 'date') {
        xAxis.ticks(d3.time.days, 1).tickFormat(this.timeFormatter);
      } else {
        xAxis.ticks(data.length);
      }

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
        .attr('dy', '.71em')
        .text(legendY);

      return yAxis;
    },

    timeFormatter: function(date) {
      return moment(date).format('DD/MM');
    }
  });

  Ember.Handlebars.helper('bar-chart', Ember.Chart.BarChartComponent);

}());
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
    var width = this.width = this.get('width'),
        height = this.height = this.get('height'),
        params = this.params = this.get('data');

    var datas = params.datas;
    var data = [];
    var colorLines = [];
    var colorBars = [];
    var types = [];

    datas.forEach(function(dataset) {
      data.push(dataset.data);
      types.push(dataset.type);
      if (dataset.type === 'line') {
        colorLines.push(dataset.color);
      } else {
        colorBars.push(dataset.color);
      }
    });

    var formatedDatas = [];
    data.forEach(function(d) {
      formatedDatas.push(this.formatData(d, 'date', 'DD/MM'));
    }, this);

    var x = this.x = this.createX(formatedDatas[0], 'date', false);

    // Search max Y
    var maxY = this.searchMaxY(formatedDatas);
    var y = this.y = this.createY(maxY);

    // Draw chart
    this.chart = d3.select('#'+this.get('elementId'))
      .attr('id', 'chart')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('svg:g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.drawXAxis(x);
    this.drawYAxis(y);

    // Format barchat data
    var barChartData = this.barChartData(formatedDatas, types);

    // Draw lines and bar
    this.drawBarChart(x, y, barChartData, colorBars);
    for(var i = 0, j = 0; i < formatedDatas.length; i++) {
      if (types[i] === 'line') {
        var line = this.drawLine(x, y, formatedDatas[i], false);
        this.drawLineOnSvg(line, formatedDatas[i], colorLines[j]);
        this.drawPoints(formatedDatas[i], x, y, false);
        j++;
      }
    }
  },

  createX: function(data, type, origin) {
    var x = null;
    if(type === 'date') {
      if(origin) {
        x = d3.scale.ordinal().rangePoints([0, this.width]).domain(data.map(function(d) { return d.keyD; }));
      } else
        x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
    } else {
      x = d3.scale.linear().range([0, this.width]).domain([0, data.length - 1]);
    }

    return x;
  },

  createY: function(max) {
    var percentage = (5/100) * this.height;
    return d3.scale.linear()
      .range([this.height, 0])
      .domain([0, (this.get("yMax")) ? this.get("yMax") : max]);
  },

  drawXAxis: function(x, legendX, height) {
    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    this.chart.append('svg:g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,'+this.height+')')
      .call(xAxis);

    return xAxis;
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
    this.path = this.chart.append('svg:path')
      .attr('class', 'line')
      .attr('clip-path', 'url(#clip)')
      .attr('stroke', color)
      .attr('d', line(formatedData));
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

  drawBarChart: function(x, y, data, colors) {
    var x1 = d3.scale.ordinal();
    var test = data.map(function(d, i) { return  'bar'+i ; });
    x1.domain(test).rangeRoundBands([0, x.rangeBand()]);

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

    var state = this.chart.selectAll(".state")
        .data(values)
      .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x(d.keyD) + ",0)"; });
   
    state.selectAll("rect")
        .data(function (d) { return d.valD; })
      .enter().append("rect")
        .attr("width", x1.rangeBand())
        .attr("x", function(d, i) { return x1("bar"+i); })
        .attr("y", function(d) { return y(d); })
        .attr("height", function(d) { return 300 - y(d); })
        .attr("fill", function(d, i) { return colors[i]; });

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
    }
  });

  Ember.Handlebars.helper('draw-chart', Ember.Chart.ChartComponent);
  
}());
(function() {

Ember.Chart.LineChartComponent = Ember.Component.extend({
    tagName: 'svg',
    margin: {
      top: 35,
      right: 35,
      bottom: 35,
      left: 35
    },

    didInsertElement: function() {
      this._super();
      this.drawTest();
      if (this.get('tooltip'))
        this.activeToolTip();
    },

    activeToolTip: function() {
      $("svg g circle").tooltip({
        'container': 'body',
        'placement': 'left'
      });
    },

    drawTest: function() {
      var params = this.get('data');
      var width = this.get('width') - this.margin.left - this.margin.right,
          height = this.get('height') - this.margin.top - this.margin.bottom;

      this.width = width;
      this.height = height;

      var datas = params.datas;
      var data = [];
      var colors = [];

      this.color = "#428bca";
      datas.forEach(function(dataset) {
        data.push(dataset.data);
        colors.push(dataset.color);
      });

      var formatedDatas = [];
      data.forEach(function(d) {
        formatedDatas.push(this.formatData(d, 'date', 'DD/MM'));
      }, this);

      var x = this.x = this.createX(formatedDatas[0], 'date', true);
      var y = this.y = this.createY(formatedDatas[0]);

      this.chart = d3.select('#'+this.get('elementId'))
        .attr('id', 'chart')
        .attr('width', width + this.margin.left + this.margin.right)
        .attr('height', height + this.margin.top + this.margin.bottom)
        .append('svg:g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      this.chart.append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', width + this.margin.left + this.margin.right)
        .attr('height', height + this.margin.top + this.margin.bottom);

      for(var i = 0; i < formatedDatas.length; i++) {
        var line = this.drawLine(x, y, formatedDatas[i], true);
        this.drawLineOnSvg(line, formatedDatas[i], colors[i]);
        this.drawPoints(formatedDatas[i], x, y, true);
      }

      this.lineAnimation();

      this.drawXAxis(x);
      this.drawYAxis(y);
    },

    draw: function() {
      var width = this.get('width') - this.margin.left - this.margin.right,
          height = this.get('height') - this.margin.top - this.margin.bottom,
          data = this.get('data');

      this.width = width;
      this.height = height;

      var formatX = this.formatX = this.get('formatXAxis');
      var color = this.get('color');
      var viewXAxis = this.get('xAxis');
      var viewYAxis = this.get('yAxis');
      var XAxisOrigin = this.get('XAxisOriginAtZero');

      var formatedData = this.formatData(data, formatX, 'DD/MM');
      var formatedData2 = this.formatData(data, formatX, 'DD/MM');

      var x = this.x = this.createX(formatedData, formatX, XAxisOrigin);
      var y = this.y = this.createY(formatedData);

      if(color === undefined) {
        color = "#428bca";
      }
      this.color = color;

      var line = this.drawLine(x, y);
      var line2 = this.drawLine(x, y);

      /* Create chart */
      this.chart = d3.select('#'+this.get('elementId'))
        .attr('id', 'chart')
        .attr('width', width + this.margin.left + this.margin.right)
        .attr('height', height + this.margin.top + this.margin.bottom)
        .append('svg:g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      this.chart.append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', width + this.margin.left + this.margin.right)
        .attr('height', height + this.margin.top + this.margin.bottom);

      /* Draw Line */
      this.drawLineOnSvg(line, formatedData);
      this.drawLineOnSvg(line2, formatedData2);

      /* Animation */
      this.lineAnimation();

      this.drawPoints(formatedData, this.x, y);

      if(viewXAxis) {
        this.drawXAxis(x);
      }

      if(viewYAxis) {
        var legendY = this.get("legendY");
        this.drawYAxis(y, legendY);
      }
    },

    createX: function(data, type, origin) {
      var x = null;
      if(type === 'date') {
        if(origin) {
          x = d3.scale.ordinal().rangePoints([0, this.width]).domain(data.map(function(d) { return d.keyD; }));
        } else
          x = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
      } else {
        x = d3.scale.linear().range([0, this.width]).domain([0, data.length - 1]);
      }

      return x;
    },

    createY: function(data) {
      var percentage = (5/100) * this.height;
      return d3.scale.linear()
        .range([this.height, 0])
        .domain([0, (this.get("yMax")) ? this.get("yMax") : d3.max(data, function(d) { console.log(d.valD); return d.valD; }) + percentage]);
    },

    drawLine: function(x, y, origin) {
      var line = d3.svg.line().y(function(d) { return y(d.valD); });
      if(!origin)
        line.x(function(d) { return x(d.keyD) + (x.rangeBand() / 2); });
      else
        line.x(function(d) { return x(d.keyD); });
      return line;
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

    timeFormatter: function(date) {
      return moment(date).format('DD/MM');
    },

    lineAnimation: function() {
      var totalLength = this.path.node().getTotalLength();
      this.path.attr("stroke-dasharray", totalLength+","+totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .ease("linear-in-out")
        .attr("stroke-dashoffset", 0);
    },

    drawLineOnSvg: function(line, formatedData, color) {
      this.path = this.chart.append('svg:path')
        .attr('class', 'line')
        .attr('clip-path', 'url(#clip)')
        .attr('stroke', color)
        .attr('d', line(formatedData));
    },

    updateChartTest: function() {
      // Clear xAxis, points and lines
      this.chart.selectAll('.x').remove();
      this.chart.selectAll('circle').remove();
      this.chart.selectAll('.line').remove();
      var datas = this.get('data').datas;
      console.log(datas);
      var data = [];
      var colors = [];
      // Format new data
      this.color = "#428bca";
      datas.forEach(function(dataset) {
        data.push(dataset.data);
        colors.push(dataset.color);
      });

      var formatedDatas = [];
      data.forEach(function(d) {
        formatedDatas.push(this.formatData(d, 'date', 'DD/MM'));
      }, this);

      var x = this.x = this.createX(formatedDatas[0], 'date', true);
      this.drawXAxis(this.x);
      
      for(var i = 0; i < formatedDatas.length; i++) {
        var line = this.drawLine(x, this.y, formatedDatas[i], true);
        this.drawLineOnSvg(line, formatedDatas[i], colors[i]);
        this.drawPoints(formatedDatas[i], x, this.y, true);
      }
    }.observes('data'),

    /*updateChart: function() {
      // clear Xaxis, circle and line
      this.chart.selectAll('.x').remove();
      this.chart.selectAll('circle').remove();
      this.chart.selectAll('.line').remove();

      var formatedData = this.formatData(this.get('data'), this.formatX, 'DD/MM');
      this.x = this.createX(formatedData, 'date', true);
      this.drawXAxis(this.x);

      line = this.drawLine(this.x, this.y);

      this.drawLineOnSvg(line, formatedData);
      this.lineAnimation();

      this.drawPoints(formatedData, this.x, this.y);
      if (this.get('tooltip'))
        this.activeToolTip();

    }.observes('data')*/
  });
  Ember.Handlebars.helper('line-chart', Ember.Chart.LineChartComponent);
  
}());