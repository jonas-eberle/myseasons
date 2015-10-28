#!/usr/bin/python2.7 -u

# MySeasons Data Colelction Web Service
# Version: 1.0.0
# Author: Jonas Eberle <jonas.eberle@uni-jena.de>
# License: EUPL v1.1 (see LICENSE)

import os, sys
import json
import sqlite3
import datetime
from slugify import slugify
import uuid

db_file = '/home/sibessc/workspace/mySeasons/data.sqlite'
image_dir = '/data3/MySeasons/collection/images'

data = sys.stdin.read().strip()
dataJ = json.loads(data)

data = {
    'lat': None,
    'lon': None,
    'pubDate': datetime.datetime.now(),
    'baum': None,
    'nutzung': None,
    'name': None,
    'mail': None,

    'bluete': None,
    'blattverfaerbung': None,
    'blattfall': None,
    'blattentfaltung': None,
    'fruchtreife': None,

    'bluete_image': None,
    'blattverfaerbung_image': None,
    'blattfall_image': None,
    'blattentfaltung_image': None,
    'fruchtreife_image': None,
}

data.update(dataJ)

conn = sqlite3.connect(db_file)
cursor = conn.cursor()
sql = 'INSERT INTO data (lat, lon, pubDate, baum, nutzung, bluete, blattverfaerbung, blattfall, blattentfaltung, fruchtreife) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
cursor.execute(sql,
               [float(data['lat']), float(data['lon']), data['pubDate'], data['baum'], data['nutzung'], data['bluete'],
                data['blattverfaerbung'], data['blattfall'], data['blattentfaltung'], data['fruchtreife']])

data_id = cursor.lastrowid

sql = 'INSERT INTO contact (data_id, name, mail) VALUES (?, ?, ?)'
cursor.execute(sql, [data_id, data['name'], data['mail']])

conn.commit()

sql = 'INSERT INTO images (data_id, property, file) VALUES (?, ?, ?)'
for key in dataJ:
    if key.endswith('_image') and isinstance(dataJ[key], unicode):
        if dataJ[key].startswith('data:image'):
            _, val = dataJ[key].split(',')
            property, type = key.split('_')
            filename = slugify(
                data['baum'] + ' ' + property + ' ' + str(data_id) + ' ' + str(datetime.datetime.now()).replace('-',
                                                                                                                '').replace(
                    ':', '').replace(' ', 'T') + ' ' + str(uuid.uuid4())) + '.png'
            file = os.path.join(image_dir, filename)
            with open(file, 'w') as f:
                f.write(val.decode('base64'))
            # conn.execute(sql,[data_id, property, sqlite3.Binary(val.decode('base64'))])
            conn.execute(sql, [data_id, property, file])

conn.commit()
conn.close()

import requests

analysis = requests.get(
    'http://artemis.geogr.uni-jena.de/mySeasons/analysis?pointY=' + str(data['lat']) + '&pointX=' + str(
        data['lon']) + '&marker=true')

print
"Content-Type: text/json;charset=utf-8"
print
""
print
analysis.text
