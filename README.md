Ember D3.js Component
==================

A graphic component for ember.js using d3.js

Installation
------------------

    bower install https://github.com/MythX/ember-d3-component.git

Usage
------------------

    {{ draw-chart width=1000 height=300 dataBinding='content' }}
    
Content example :

    {
        formatXAxis: 'date',
        yAxis: [{
          name: 'y1',
          color: 'black',
          legend: 'Legend 1',
          position: 'left'
        }],
        charts: [{
          type: 'bar' (or 'line')
          yAxis: 'y1',
          data: [{
            keyD: your_key,
            valD: your_value
          }],
          color: '#428BCA'
        }]
    }


Properties
------------------

General :

    formatXAxis: 'date' or 'numeric' (not required)
    yAxis: [] (required)
    charts: [] (required)

yAxis :

    name: String (required)
    color: String (not required)
    legend: String (not required)
    position: String (left or right) (required)

Line-chart :

    type: 'line' (required)
    yAxis: String (required)
    data: [] (required)
    color: ''
    animation: true or false (not required)
    
    
Bar-chart :

    type: 'bar' (required)
    yAxis: String (required)
    data: [] (required)
    color: '' (not required) - For single color
    colors: [] (not required) - For multi-color, you need one color for one bar
    
    
