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
        var legendY = this.get("legendY");
        this.drawYAxis(y, legendY);
      }
    },

    createX: function(data, type) {
      return d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1).domain(data.map(function(d) { return d.keyD; }));
    },

    createY: function(data) {
      return d3.scale.linear().range([this.height, 0]).domain([0, d3.max(data, function(d) { return d.valD; }) + 10]);
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
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(legendY);

      return yAxis;
    },

    timeFormatter: function(date) {
      return moment(date).format('DD/MM');
    }
  });

  Ember.Handlebars.helper('bar-chart', Ember.Chart.BarChartComponent);

}());