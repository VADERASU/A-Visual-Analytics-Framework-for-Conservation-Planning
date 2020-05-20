# A-Visual-Analytics-Framework-for-Conservation-Planning
The system helps conservation planners to develop portfolios with a variety of constraints in real-time to protect more species. The code is implemented for the system. The front end and back end of the system are implemented by Node.js. The database is MongoDB for the geospatial query.

## Configuration
Node version: 7.10.1 \
MongoDB version: 3.4.10

## Nomenclature
* Patch: To get the high resolution, we first split the land to 30 * 30 meter^2 patches.
* Parcel: The purchasing unit of the land is 'parcel'. For some land attribute, we have to aggregate the attribute value of the patches falling into the parcel. 
* portfolio: To achieve the users' goal, the system will help them to generate the purchasing portfolios within a variety of constraints. 

## Data source and process
The research area of the project is the US. The data source for the US map is the shapefile [US Map](https://catalog.data.gov/dataset/tiger-line-shapefile-2017-nation-u-s-current-state-and-equivalent-national). \
For the US map, there are 12 land attributes involved for users to get the best purchase portfolio. For the project, we take Montana as demo state. We classify these land attributes into three categories,  land user layers, physical geospatial layer, and biodiversity layers. Here is the list of the 12 land attributes and their corresponding data source. 
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
    > (12). Richness of reptiles (RP): the total species richness of reptiles in the parcel.\
    
'ProcessData' folder includes the files to deal with different kinds of data sources to get the corresponding attributes of each parcel. We also use QGIS to generate the tiles of the map for attribute visualization on the map. The generated images are in the 'image' folder. All the processed data needs to import to MongoDB for the geospatial queries. The 'schema' folder includes the information of the database.


## Install
* git clone the repository to your local computer, and download and unzip the extra foulders 'node modules' and 'images' in the [link](https://drive.google.com/drive/folders/1RLI7bu3ESEwGlcD8Epc_ogtuBZRMpnhf?usp=sharing). The two extra folders are too big to upload. Therefore, I compress them and put them in the google drive for the download.
* Process the downloaded data and import them to the MongoDB based on the information in the 'schema' folder.
Change the URL of the database to your local URL in the 'router' folder.
* Run 'npm install', then 'npm start' to start the project
* Open the website in at least 1280 x 1024 screen. The code does not consider the scalability. The issue will be solved in future work. 
The data size for the project is huge. The process phase is complicated and needs parallel computing, which still takes a long time to finish the data processing. The shapefiles of the row data usually contain a lot of issues, such as the bad designed spatial data. For these issues, the developer needs to deal with them one by one. I suggest users to use my available website to play the system, rather than build their own website. 

## Avaiable website to play the system
The [Conservation Planning System](http://104.196.253.120:13000/) is available now for users to play for generating their own purchasing portfolio with a variety of constraints. Please use a large screen to open the website.

## Demo of case study
<a href="https://youtu.be/NU5QoRY3ZhE" target="_blank">Demo Video</a> provides two cases to introduce the usage of the system. 

## Contact Us
If have any problem when install or run the system, please contact us at rzhan100@asu.edu.
