# A-Visual-Analytics-Framework-for-Conservation-Planning
The system helps conservation planners to develop portfolios with a variety of constraints in real-time to protect more species. The code is implemented for the system. The front end and back end of the system are implemented by Node.js. The database is MongoDB for the geospatial query.

## Configuration
Node version: 7.10.1 \
MongoDB version: 3.4.10

## Description of each folder

## Nomenclature


## Data source and process
The research area of the project is the US. The data source for the US map is the shapefile [US Map](https://catalog.data.gov/dataset/tiger-line-shapefile-2017-nation-u-s-current-state-and-equivalent-national). \
For the US map, there are 12 land attributes involved for users to get the best purchase portfolio. We take the Montana as the example. We classify them into three categories,  land user layers, physical geospatial layer, and biodiversity layers. Here is the list of the 12 land attributes and their corresponding data source. \
* Land User Layers
  * Distance to the protected area (PA): the average distance of a parcel to its nearest protected area(s). The data source is the [protected area of each state](https://www.usgs.gov/core-science-systems/science-analytics-and-synthesis/gap/science/pad-us-data-download?qt-science_center_objects=0#qt-science_center_objects) in US. 
  * Distance to a metro area (MA): the average distance of a parcel to its nearest metro area(s). The data source is the label[metro area of Montana](http://geoinfo.msl.mt.gov/Home/msdi/administrative_boundaries).
  * Distance to highway (HW): the average distance of a parcel to its nearest highway(s). The data source is the label[primary and secondary roads by state](https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2017&layergroup=Roads).
  * Human influence index (HII): HII values range from 0 to 64 and measure the direct human influence on terrestrial ecosystems [52]. The average of the HII values within a parcel.



## Install

## Avaiable website to play the system

## Demo of case study

## Contact Us
If have any problem when install or run the system, please contact us at rzhan100@asu.edu.
