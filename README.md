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
        datas: [{
          type: 'bar' (or 'line')
          data: [{
            keyD: your_key,
            valD: your_value
          }],
          color: '#428BCA'
        }]
    }


Properties
------------------

