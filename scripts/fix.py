#!/usr/bin/env python3

import json
import fileinput

graph = json.loads(''.join([line for line in fileinput.input()]))

graph.pop('@context')
graph['items'] = graph.pop('@graph')

for item in graph['items']:
    item.pop('@type')

    if 'author' in item and not isinstance(item['author'], list):
        item['author'] = [item['author']]

    if 'editor' in item and not isinstance(item['editor'], list):
        item['editor'] = [item['editor']]

    if 'issued' in item:
        item['issued'].pop('@id')

graph = graph['items']

print(json.dumps(graph, indent=True))
