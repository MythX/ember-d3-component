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
      this.draw();
      this.activeToolTip();
    },

    activeToolTip: function() {
      $("svg g circle").tooltip({
        'container': 'body',
        'placement': 'left'
      });
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

      var x = this.x = this.createX(formatedData, formatX, XAxisOrigin);
      var y = this.y = this.createY(formatedData);

      if(color === undefined) {
        color = "#428bca";
      }
      this.color = color;

      this.line = this.drawLine(x, y);

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
      this.drawLineOnSvg(formatedData);

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

    drawTooltip: function(points, color) {
      var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      points.on('mouseover', function(d) {
        div.transition()
          .duration(200)
          .style('background', color)
          .style('opacity', 0.9);

        div.html('<strong>'+d.keyD+'</strong> <br/>' + d.valD.toFixed(1))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      })
      .on('mouseout', function(d) {
        div.transition()
          .duration(500)
          .style('opacity', 0);
      });
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

    drawLineOnSvg: function(formatedData) {
      this.path = this.chart.append('svg:path')
        .attr('class', 'line')
        .attr('clip-path', 'url(#clip)')
        .attr('stroke', this.color)
        .attr('d', this.line(formatedData));
    },

    updateChart: function() {
      // clear Xaxis, circle and line
      this.chart.selectAll('.x').remove();
      this.chart.selectAll('circle').remove();
      this.chart.selectAll('.line').remove();

      var formatedData = this.formatData(this.get('data'), this.formatX, 'DD/MM');
      this.x = this.createX(formatedData, 'date', true);
      this.drawXAxis(this.x);

      this.line = this.drawLine(this.x, this.y);

      this.drawLineOnSvg(formatedData);
      this.lineAnimation();

      this.drawPoints(formatedData, this.x, this.y);
      this.activeToolTip();

    }.observes('data')
  });
  Ember.Handlebars.helper('line-chart', Ember.Chart.LineChartComponent);
  
}());