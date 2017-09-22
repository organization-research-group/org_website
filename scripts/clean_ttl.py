#!/usr/bin/env python3

import fileinput
import itertools

def clean_ttl(text):
    lines = text.split('\n')

    preamble = []
    rest = []

    in_preamble = True

    for line in lines:
        if in_preamble:
            preamble.append(line)
            if line == '# -- Begin bibliography --':
                in_preamble = False
        else:
            rest.append(line)

    groups = itertools.groupby(
        rest,
        key=lambda line: line.startswith(':')
    )

    next(groups)
    groups = (list(g) for k, g in groups)

    groups = [
        (uri[0].split('/')[0][1:], uri[0], uri + rest)
        for uri, rest in zip(groups, groups)
    ]

    groups = sorted(groups, key=lambda x: x[1])

    groups = itertools.groupby(
        groups,
        key=lambda x: x[0]
    )

    ttl = '\n'.join(preamble) + '\n\n'

    for key, val in groups:
        for _, _, rdf in val:
            ttl += '\n'.join([l for l in rdf if l.strip()]) + '\n\n'

    return ttl.rstrip()

if __name__ == '__main__':
    text = ''.join([line for line in fileinput.input()])
    print(clean_ttl(text))
