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
    > (1). Distance to the protected area (PA): the average distance of a parcel to its nearest protected area(s). The data source is the [protected area of each state](https://www.usgs.gov/core-science-systems/science-analytics-and-synthesis/gap/science/pad-us-data-download?qt-science_center_objects=0#qt-science_center_objects) in US. \
    > (2). Distance to a metro area (MA): the average distance of a parcel to its nearest metro area(s). The data source is the label[metro area of Montana](http://geoinfo.msl.mt.gov/Home/msdi/administrative_boundaries).\
    > (3). Distance to highway (HW): the average distance of a parcel to its nearest highway(s). The data source is the label[primary and secondary roads by state](https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2017&layergroup=Roads).\
    > (4). Human influence index (HII): HII values range from 0 to 64 and measure the direct human influence on terrestrial ecosystems. The average of the HII values within a parcel. The data source  is the [HII of North America](https://sedac.ciesin.columbia.edu/data/set/wildareas-v2-last-of-the-wild-geographic/data-download).\
    > (5). Cost per Square meter(COST): total cost per square meter. The data source is the [land cost of Montana] (https://landgrid.com/reports/parcels).\
* Physical Geospatial Layer
    > (6). Distance to hydrology areda(HY): the minimum distance from the center of the parcel to the nearest hydrology area. The data source is the [hydrology area by state](http://prd-tnm.s3-website-us-west-2.amazonaws.com/?prefix=StagedProducts/Hydrography/NHD/State/HighResolution/Shape/). 
* Biodiversity Layers: the data source for this kind of layer comes from [Biodiversity Mapping](https://biodiversitymapping.org/wordpress/index.php/download/).
    > (7). Richness of trees (TREE): the total species richness of trees in the parcel.\
    > (8). Richness of birds (BIRD): the total species richness of birds in the parcel.\
    > (9). Richness of fishes (FISH): the total species richness of fishes in the parcel.\
    > (10). Richness of amphibians (AM): the total species richness of amphibians in the parcel.\
    > (11). Richness of mammals (MM): the total species richness of mammals in the parcel.\
    > (12) .Richness of reptiles (RP): the total species richness of reptiles in the parcel.



## Install
git clone the repository to your local computer, and download and unzip the extra foulders 'node modules' and 'images' in the [link](https://drive.google.com/drive/folders/1RLI7bu3ESEwGlcD8Epc_ogtuBZRMpnhf?usp=sharing). The two extra folders are too big to upload. Therefore, I compress them and put them in the google drive for the download.

## Avaiable website to play the system

## Demo of case study

## Contact Us
If have any problem when install or run the system, please contact us at rzhan100@asu.edu.
