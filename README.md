Ember D3.js Component
==================

A graphic component for ember.js using d3.js

Installation
------------------

    bower install https://github.com/MythX/ember-d3-component.git
    
Include d3.js and ember-d3.js

    <script src="bower_components/ember-d3-component/dist/ember-d3.js"></script>

Usage
------------------

    {{ draw-chart width=1000 height=300 dataBinding='content' }}
    
Content example :

    {
        xAxis: {
          format: 'date',
          dateFormat: 'DD/MM',
          origin: false
        },
        yAxis: [{
          name: 'y1',
          color: 'black',
          legend: 'Legend 1',
          position: 'left'
        }],
        charts: [{
          type: 'bar',
          color: '#428BCA',
          yAxis: 'y1',
          data: [{
            keyD: your_key,
            valD: your_value
          }],
        }]
    }


Properties
------------------

Helper :

    width: Integer (not required)
    height: Integer (required)

General :

    xAxis: Object (required)
    yAxis: Array (required)
    charts: Array (required)

xAxis :

    format: String (date or numeric) (required)
    dateFormat: String (required if format = 'date')
    origin: Boolean (required)
    rotateLegend: Boolean (not required)

yAxis :

    name: String (required)
    color: String (not required)
    legend: String (not required)
    max: Integer (not required)
    position: String (left or right) (required)
    ticks: Integer (not required)

Line-chart :

    type: 'line' (required)
    yAxis: String (required)
    data: Array (required)
    color: String (required)
    gradient: Object (not required)
    animation: Boolean (not required)
    interpolate: String (not required) ['monotone', 'basic']
    
Bar-chart :

    type: 'bar' (required)
    yAxis: String (required)
    data: Array (required)
    animation: Boolean (not required)
    color: String (not required) - For single color
    colors: Array (not required) - For multi-color, you need one color for one bar
    
Area-chart:

    type: 'area' (required)
    yAxis: String (required)
    data: Array (required)
    color: String (required)
    gradient: Object (not required)
    interpolate: String (not required) ['monotone', 'basic']

Data : 

    [{
      keyD: key,
      valD: val,
     }]

Gradient : 

    gradient: {
      stops: [
        {offset: "0%", color: "red"},
        {offset: "50%", color: "orange"},
        {offset: "80%", color: "orange"},
        {offset: "100%", color: "green"}
      ],
      max: 100
    }