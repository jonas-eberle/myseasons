#!/usr/bin/python2.7 -u

# MySeasons Analysis Web Service
# Version: 1.0.0
# Author: Jonas Eberle <jonas.eberle@uni-jena.de>
# License: EUPL v1.1 (see LICENSE)

import os
import json
import requests
import xml.etree.ElementTree as ET

params = dict()
for kvp in os.environ['QUERY_STRING'].split('&'):
    (key, val) = kvp.split('=')
    params[key] = val

result = {}
outputs = {}

# execute time-series extraction process
# http://artemis.geogr.uni-jena.de/cgi-bin/testbox.cgi?request=Execute&service=WPS&version=1.0.0&identifier=1012_single_ts_plot_point&datainputs=[pointX=9.82;pointY=49.61;datasetName=mod13q1_evi]
pointX = str(params['pointX'])
pointY = str(params['pointY'])

ts = requests.get(
    'http://artemis.geogr.uni-jena.de/cgi-bin/testbox.cgi?request=Execute&service=WPS&version=1.0.0&identifier=1012_single_ts_plot_point&datainputs=[pointX=' + pointX + ';pointY=' + pointY + ';datasetName=mod13q1_evi;qualityLimits=1]')

root = ET.fromstring(ts.text)
for output in root.findall('.//{http://www.opengis.net/wps/1.0.0}Output'):
    identifier = output.find('{http://www.opengis.net/ows/1.1}Identifier').text
    value = output.find('.//{http://www.opengis.net/wps/1.0.0}LiteralData').text
    result[identifier] = value

outputs['uuid'] = result['uuid']
outputs['tsPlot'] = result['tsPlot']
outputs['pointBBOX'] = result['pointBBOX']

# execute timesat phenology analysis process
# http://artemis.geogr.uni-jena.de/cgi-bin/testbox.cgi?request=Execute&service=WPS&version=1.0.0&identifier=4010_single_ts_timesat_point&datainputs=[uuid=cc189868-09c6-48cb-9d4a-44ecff32e1eb]
ts = requests.get(
    'http://artemis.geogr.uni-jena.de/cgi-bin/testbox.cgi?request=Execute&service=WPS&version=1.0.0&identifier=4010_single_ts_timesat_point&datainputs=[uuid=' +
    result['uuid'] + ';plotTodayPhenoChart=1]')

root = ET.fromstring(ts.text)
for output in root.findall('.//{http://www.opengis.net/wps/1.0.0}Output'):
    identifier = output.find('{http://www.opengis.net/ows/1.1}Identifier').text
    value = output.find('.//{http://www.opengis.net/wps/1.0.0}LiteralData').text
    result[identifier] = value

outputs['phenoPlot'] = result['phenoPlot']
outputs['timesatPlot'] = result['timesatPlot']

# outputs['uuid'] = 'c9121d5e-a76a-4f26-a7f0-31146c4432e6'
# outputs['tsPlot'] = 'http://artemis.geogr.uni-jena.de/pywps/tmp/c9121d5e-a76a-4f26-a7f0-31146c4432e6/data/plot.png'
# outputs['pointBBOX'] = 'POLYGON ((9.818954090437717 49.610416662229603,9.822169203102829 49.610416662229603,9.821749429968433 49.608333328880839,9.818534454708601 49.608333328880839,9.818954090437717 49.610416662229603))'
# outputs['timesatPlot'] = 'http://artemis.geogr.uni-jena.de/pywps/tmp/1ebad46c-0715-4f55-8559-b21e8f8a405e/timesat_2015-08-31T20-53-56.146830/phenology_chart.png'

print
"Content-Type: text/json;charset=utf-8"
print
""
print
json.dumps(outputs)
