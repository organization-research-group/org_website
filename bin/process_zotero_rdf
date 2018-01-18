#!/usr/bin/env python3

import re
import sys
import fileinput

def replace_creator_names(creators, ttl):
    new_ttl = ttl

    for creator in creators:
        bnode_id = creator[0].rstrip()
        new_id = '<person/' + creator[3][18:-4] + creator[2][20:21] + '>'
        new_ttl = re.sub(bnode_id, new_id, new_ttl)

    return new_ttl

def main():
    ttl = ''

    creator = -1

    creators = []
    in_creators = False

    for line in fileinput.input():
        if line.startswith('    dcterms:abstract'):
            continue

        if line.startswith('_:n'):
            creator += 1
            creators.append([])
        
        if creator >= 0:
            creators[creator].append(line)
            ttl += line

        else:
            ttl += line

    ttl = replace_creator_names(creators, ttl)

    return ttl

if __name__ == '__main__':
    print(main())
